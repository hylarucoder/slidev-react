import { useLayoutEffect } from "react";
import { useReveal } from "./RevealContext";
import { normalizeStep } from "@slidev-react/core/presentation/flow/step";

export function useRevealStep(step: number | undefined) {
  const reveal = useReveal();
  const registerStep = reveal?.registerStep;
  const slideId = reveal?.slideId;
  const normalizedStep = normalizeStep(step);

  useLayoutEffect(() => {
    if (!registerStep || normalizedStep === undefined) return;

    return registerStep(normalizedStep);
  }, [normalizedStep, registerStep, slideId]);

  const isVisible = normalizedStep === undefined || !reveal || reveal.step >= normalizedStep;

  return {
    reveal,
    normalizedStep,
    isVisible,
  };
}

export function useRevealProgress(maxStep: number) {
  const { reveal, normalizedStep } = useRevealStep(maxStep);
  const normalizedMaxStep = normalizedStep ?? 1;

  return {
    reveal,
    step: Math.min(reveal?.step ?? 0, normalizedMaxStep),
    maxStep: normalizedMaxStep,
  };
}
