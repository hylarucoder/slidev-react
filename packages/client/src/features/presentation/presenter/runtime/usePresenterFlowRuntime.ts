import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resolveStepTotal } from "@slidev-react/core/presentation/flow/step";
import {
  canAdvanceFlow,
  canRetreatFlow,
  clampStepIndex,
  resolveAdvanceFlow,
  resolveRetreatFlow,
} from "@slidev-react/core/presentation/flow/navigation";
import { type RevealContextValue } from "../../reveal/RevealContext";
import type { CompiledSlide } from "../model/types";

interface SlidesNavigationLike {
  currentIndex: number;
  total: number;
  goTo: (index: number) => void;
}

function resolveMaxRegisteredStep(stepCounts: Map<number, number> | undefined) {
  if (!stepCounts || stepCounts.size === 0) return 0;

  let max = 0;
  for (const step of stepCounts.keys()) {
    if (step > max) max = step;
  }

  return max;
}

export function usePresenterFlowRuntime({
  slides,
  navigation,
}: {
  slides: CompiledSlide[];
  navigation: SlidesNavigationLike;
}) {
  const currentSlide = slides[navigation.currentIndex];
  const revealStepCountsRef = useRef<Record<string, Map<number, number>>>({});
  const [stepBySlideId, setStepBySlideId] = useState<Record<string, number>>({});
  const [stepTotalBySlideId, setStepTotalBySlideId] = useState<Record<string, number>>({});
  const stepBySlideIdRef = useRef(stepBySlideId);
  const stepTotalBySlideIdRef = useRef(stepTotalBySlideId);
  const configuredStepsBySlideId = useMemo(
    () =>
      Object.fromEntries(
        slides.map((slide) => [slide.id, slide.meta.clicks ?? 0] as const),
      ) as Record<string, number>,
    [slides],
  );

  useEffect(() => {
    stepBySlideIdRef.current = stepBySlideId;
  }, [stepBySlideId]);

  useEffect(() => {
    stepTotalBySlideIdRef.current = stepTotalBySlideId;
  }, [stepTotalBySlideId]);

  const setSlideStep = useCallback(
    (slideId: string, next: number) => {
      setStepBySlideId((prev) => {
        const total = resolveStepTotal({
          configuredSteps: configuredStepsBySlideId[slideId],
          detectedSteps: stepTotalBySlideIdRef.current[slideId],
        });
        const clamped = clampStepIndex(next, total);
        if ((prev[slideId] ?? 0) === clamped) return prev;

        const updated = {
          ...prev,
          [slideId]: clamped,
        };
        stepBySlideIdRef.current = updated;
        return updated;
      });
    },
    [configuredStepsBySlideId],
  );

  const setSlideStepTotal = useCallback(
    (slideId: string, nextTotal: number) => {
      const safeTotal = resolveStepTotal({
        configuredSteps: configuredStepsBySlideId[slideId],
        detectedSteps: nextTotal,
      });

      setStepTotalBySlideId((prev) => {
        if (prev[slideId] === safeTotal) return prev;

        const updated = {
          ...prev,
          [slideId]: safeTotal,
        };
        stepTotalBySlideIdRef.current = updated;
        return updated;
      });

      setStepBySlideId((prev) => {
        const clamped = clampStepIndex(prev[slideId] ?? 0, safeTotal);
        if ((prev[slideId] ?? 0) === clamped) return prev;

        const updated = {
          ...prev,
          [slideId]: clamped,
        };
        stepBySlideIdRef.current = updated;
        return updated;
      });
    },
    [configuredStepsBySlideId],
  );

  const registerRevealStep = useCallback(
    (step: number) => {
      const slideId = currentSlide.id;
      const normalizedStep = Math.max(Math.floor(step), 1);
      const slideSteps = revealStepCountsRef.current[slideId] ?? new Map<number, number>();
      revealStepCountsRef.current[slideId] = slideSteps;
      slideSteps.set(normalizedStep, (slideSteps.get(normalizedStep) ?? 0) + 1);
      setSlideStepTotal(slideId, resolveMaxRegisteredStep(slideSteps));

      return () => {
        const steps = revealStepCountsRef.current[slideId];
        if (!steps) return;

        const nextCount = (steps.get(normalizedStep) ?? 1) - 1;
        if (nextCount <= 0) steps.delete(normalizedStep);
        else steps.set(normalizedStep, nextCount);

        if (steps.size === 0) delete revealStepCountsRef.current[slideId];

        setSlideStepTotal(slideId, resolveMaxRegisteredStep(steps));
      };
    },
    [currentSlide.id, setSlideStepTotal],
  );

  const currentStep = stepBySlideId[currentSlide.id] ?? 0;
  const currentStepTotal = resolveStepTotal({
    configuredSteps: currentSlide.meta.clicks,
    detectedSteps: stepTotalBySlideId[currentSlide.id],
  });

  const goToSlideAtStart = useCallback(
    (index: number) => {
      const targetSlide = slides[index];
      if (!targetSlide) return;

      setSlideStep(targetSlide.id, 0);
      navigation.goTo(index);
    },
    [navigation, setSlideStep, slides],
  );

  const advanceReveal = useCallback(() => {
    const nextState = resolveAdvanceFlow({
      currentStepIndex: currentStep,
      currentStepTotal: currentStepTotal,
      currentPageIndex: navigation.currentIndex,
      totalPages: navigation.total,
    });
    if (!nextState) return;

    const targetSlide = slides[nextState.pageIndex];
    if (!targetSlide) return;

    setSlideStep(targetSlide.id, nextState.stepIndex);
    if (nextState.pageIndex !== navigation.currentIndex) navigation.goTo(nextState.pageIndex);
  }, [currentStep, currentStepTotal, navigation, setSlideStep, slides]);

  const retreatReveal = useCallback(() => {
    const previousSlideId = slides[navigation.currentIndex - 1]?.id ?? "";
    const nextState = resolveRetreatFlow({
      currentStepIndex: currentStep,
      currentPageIndex: navigation.currentIndex,
      previousStepIndex: stepBySlideIdRef.current[previousSlideId],
      previousStepTotal: resolveStepTotal({
        configuredSteps: configuredStepsBySlideId[previousSlideId],
        detectedSteps: stepTotalBySlideIdRef.current[previousSlideId],
      }),
    });
    if (!nextState) return;

    const targetSlide = slides[nextState.pageIndex];
    if (!targetSlide) return;

    setSlideStep(targetSlide.id, nextState.stepIndex);
    if (nextState.pageIndex !== navigation.currentIndex) navigation.goTo(nextState.pageIndex);
  }, [currentStep, navigation, setSlideStep, configuredStepsBySlideId, slides]);

  const revealContextValue = useMemo<RevealContextValue>(
    () => ({
      slideId: currentSlide.id,
      step: currentStep,
      stepTotal: currentStepTotal,
      setStep: (next) => setSlideStep(currentSlide.id, next),
      registerStep: registerRevealStep,
      advance: advanceReveal,
      retreat: retreatReveal,
      canAdvance: canAdvanceFlow({
        currentStepIndex: currentStep,
        currentStepTotal: currentStepTotal,
        currentPageIndex: navigation.currentIndex,
        totalPages: navigation.total,
      }),
      canRetreat: canRetreatFlow({
        currentStepIndex: currentStep,
        currentPageIndex: navigation.currentIndex,
      }),
    }),
    [
      advanceReveal,
      currentStep,
      currentStepTotal,
      currentSlide.id,
      navigation.currentIndex,
      navigation.total,
      registerRevealStep,
      retreatReveal,
      setSlideStep,
    ],
  );

  return {
    currentStep,
    currentStepTotal,
    canPrev: revealContextValue.canRetreat,
    canNext: revealContextValue.canAdvance,
    revealContextValue,
    setSlideStep,
    setSlideStepTotal,
    goToSlideAtStart,
    advanceReveal,
    retreatReveal,
  }
}

export type PresenterFlowRuntime = ReturnType<typeof usePresenterFlowRuntime>
