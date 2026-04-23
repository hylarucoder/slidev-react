import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { SlidesConfig } from "../model/types";
import { resolveSlideSurface, resolveSlideSurfaceClassName } from "../../stage/slideSurface";
import { RevealProvider, type RevealContextValue } from "../../reveal/RevealContext";
import { useResolvedLayout } from "../../../../theme/useResolvedLayout";
import { resolveOverviewStageMetrics } from "../stage";
import type { CompiledSlide } from "../model/types";
import { ChromeIconButton } from "../../../../ui/primitives/ChromeIconButton";
import { ChromePanel } from "../../../../ui/primitives/ChromePanel";
import { ChromeTag, chromeTagClassName } from "../../../../ui/primitives/ChromeTag";

type FlowPreviewMode = "live" | "steps" | "final";

function noopCleanup() {}

function noopRegisterStep() {
  return noopCleanup;
}

function createRevealContextValue({
  slideId,
  step,
  stepTotal,
}: {
  slideId: string;
  step: number;
  stepTotal: number;
}): RevealContextValue {
  return {
    slideId,
    step,
    stepTotal,
    disableAnimation: false,
    setStep: () => {},
    registerStep: noopRegisterStep,
    advance: () => {},
    retreat: () => {},
    canAdvance: step < stepTotal,
    canRetreat: step > 0,
  };
}

function resolvePreviewStep({
  mode,
  currentStep,
  currentStepTotal,
  selectedStep,
}: {
  mode: FlowPreviewMode;
  currentStep: number;
  currentStepTotal: number;
  selectedStep: number;
}) {
  if (mode === "final") return currentStepTotal;
  if (mode === "steps") return selectedStep;

  return currentStep;
}

function describePreviewStep(step: number, total: number) {
  if (total <= 0) return "Base state";
  if (step <= 0) return "Before step 1";
  if (step >= total) return `Step ${total}/${total} • final state`;

  return `Step ${step}/${total}`;
}

export function FlowTimeline({
  slide,
  currentStep,
  currentStepTotal,
  slidesConfig,
  onJumpToStep,
  onClose,
  className,
}: {
  slide: CompiledSlide;
  currentStep: number;
  currentStepTotal: number;
  slidesConfig: Pick<SlidesConfig, "slidesViewport" | "slidesLayout" | "slidesBackground">;
  onJumpToStep?: (stepIndex: number) => void;
  onClose?: () => void;
  className?: string;
}) {
  const { slidesViewport, slidesLayout, slidesBackground } = slidesConfig;
  const [mode, setMode] = useState<FlowPreviewMode>("live");
  const [selectedStep, setSelectedStep] = useState(currentStep);
  const Layout = useResolvedLayout(slide.meta.layout ?? slidesLayout);
  const Slide = slide.component;
  const overviewStage = useMemo(
    () => resolveOverviewStageMetrics(slidesViewport),
    [slidesViewport],
  );
  const stepOptions = useMemo(
    () => Array.from({ length: currentStepTotal + 1 }, (_, index) => index),
    [currentStepTotal],
  );

  useEffect(() => {
    setSelectedStep(currentStep);
  }, [currentStep, currentStepTotal, slide.id]);

  const previewStep = resolvePreviewStep({
    mode,
    currentStep,
    currentStepTotal,
    selectedStep,
  });
  const revealContextValue = useMemo(
    () =>
      createRevealContextValue({
        slideId: `${slide.id}:timeline-preview`,
        step: previewStep,
        stepTotal: currentStepTotal,
      }),
    [currentStepTotal, previewStep, slide.id],
  );
  const surface = resolveSlideSurface({
    meta: slide.meta,
    slidesBackground,
    className: resolveSlideSurfaceClassName({
      layout: slide.meta.layout ?? slidesLayout,
      overflowHidden: true,
    }),
  });
  const previewLabel = describePreviewStep(previewStep, currentStepTotal);
  const modeDescription =
    mode === "live"
      ? "Mirror the current stage state."
      : mode === "final"
        ? "Flatten to the final result."
        : "Inspect one step position without changing the stage.";

  return (
    <ChromePanel className={`flex flex-col ${className ?? ""}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] chrome-fg-subtle">
            Timeline Preview
          </p>
          <p className="mt-1 text-xs chrome-fg-subtle">{modeDescription}</p>
        </div>
        <div className="flex items-center gap-2">
          <ChromeTag>{previewLabel}</ChromeTag>
          {onClose && (
            <ChromeIconButton onClick={onClose} aria-label="Close timeline preview" size="sm">
              <X size={14} />
            </ChromeIconButton>
          )}
        </div>
      </div>
      <ChromePanel
        as="div"
        tone="solid"
        radius="inset"
        padding="none"
        className="mb-3 flex items-center gap-2 p-1"
      >
        {(["live", "steps", "final"] as const).map((value) => {
          const active = mode === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`inline-flex flex-1 items-center justify-center rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                active
                  ? "bg-slate-900 text-white"
                  : "chrome-fg-subtle hover:bg-slate-100 hover:chrome-fg"
              }`}
            >
              {value}
            </button>
          );
        })}
      </ChromePanel>
      <ChromePanel
        as="div"
        tone="frame"
        radius="inset"
        padding="none"
        className="mb-3 overflow-hidden"
      >
        <div style={{ height: `${overviewStage.overviewStageHeight}px` }}>
          <div
            className="origin-top-left"
            style={{
              width: `${overviewStage.stageWidth}px`,
              height: `${overviewStage.stageHeight}px`,
              transform: `scale(${overviewStage.overviewStageScale})`,
              transformOrigin: "top left",
            }}
          >
            <RevealProvider value={revealContextValue}>
              <article className={surface.className} style={surface.style}>
                <Layout>
                  <Slide />
                </Layout>
              </article>
            </RevealProvider>
          </div>
        </div>
      </ChromePanel>
      <div className="mb-3 flex items-center justify-between gap-3 text-xs chrome-fg-subtle">
        <span>
          Current stage:{" "}
          {currentStepTotal > 0 ? `${currentStep}/${currentStepTotal}` : "base"}
        </span>
        {onJumpToStep && previewStep !== currentStep && (
          <button
            onClick={() => onJumpToStep(previewStep)}
            className={chromeTagClassName({
              tone: "active",
              className: "transition hover:bg-emerald-100",
            })}
          >
            Jump To Stage
          </button>
        )}
      </div>
      {currentStepTotal > 0 ? (
        <div className="grid grid-cols-2 gap-2 overflow-auto pr-1">
          {stepOptions.map((step) => {
            const selected = previewStep === step;
            const current = currentStep === step;
            const label = step === 0 ? "Start" : `Step ${step}`;

            return (
              <button
                key={step}
                type="button"
                onClick={() => {
                  setMode("steps");
                  setSelectedStep(step);
                }}
                className={`rounded-md border px-3 py-2 text-left transition ${
                  selected
                    ? "border-slate-900 bg-slate-900 text-white"
                    : current
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                      : "chrome-border bg-white/90 chrome-fg hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                      selected ? "bg-white/18 text-white" : "bg-slate-100 chrome-fg-subtle"
                    }`}
                  >
                    reveal
                  </span>
                </div>
                <div
                  className={`mt-1 text-xs ${
                    selected ? "text-white/78" : current ? "text-emerald-700" : "chrome-fg-subtle"
                  }`}
                >
                  {step === 0
                    ? "Base slide state before reveal."
                    : `Reveal step ${step} becomes active.`}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <ChromePanel as="div" tone="dashed" radius="inset" className="px-4 py-5 text-sm">
          No reveal steps detected on this slide yet.
        </ChromePanel>
      )}
    </ChromePanel>
  );
}
