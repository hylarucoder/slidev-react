import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { LayoutName } from "@slidev-react/core/slides/layout";
import type { SlidesViewport } from "@slidev-react/core/slides/viewport";
import { resolveSlideSurface, resolveSlideSurfaceClassName } from "../stage/slideSurface";
import { RevealProvider, type RevealContextValue } from "../reveal/RevealContext";
import { useResolvedLayout } from "../../../theme/useResolvedLayout";
import { resolveOverviewStageMetrics } from "./stage";
import type { CompiledSlide } from "./types";
import { ChromeIconButton } from "../../../ui/primitives/ChromeIconButton";
import { ChromePanel } from "../../../ui/primitives/ChromePanel";
import { ChromeTag, chromeTagClassName } from "../../../ui/primitives/ChromeTag";

type FlowPreviewMode = "live" | "steps" | "final";

function noopCleanup() {}

function noopRegisterStep() {
  return noopCleanup;
}

function createRevealContextValue({
  slideId,
  clicks,
  clicksTotal,
}: {
  slideId: string;
  clicks: number;
  clicksTotal: number;
}): RevealContextValue {
  return {
    slideId,
    clicks,
    clicksTotal,
    setClicks: () => {},
    registerStep: noopRegisterStep,
    advance: () => {},
    retreat: () => {},
    canAdvance: clicks < clicksTotal,
    canRetreat: clicks > 0,
  };
}

function resolvePreviewStep({
  mode,
  currentClicks,
  currentClicksTotal,
  selectedClicks,
}: {
  mode: FlowPreviewMode;
  currentClicks: number;
  currentClicksTotal: number;
  selectedClicks: number;
}) {
  if (mode === "final") return currentClicksTotal;
  if (mode === "steps") return selectedClicks;

  return currentClicks;
}

function describePreviewStep(step: number, total: number) {
  if (total <= 0) return "Base state";
  if (step <= 0) return "Before cue 1";
  if (step >= total) return `Cue ${total}/${total} • final state`;

  return `Cue ${step}/${total}`;
}

export function FlowTimelinePreview({
  slide,
  currentClicks,
  currentClicksTotal,
  slidesViewport,
  slidesLayout,
  slidesBackground,
  onJumpToCue,
  onClose,
  className,
}: {
  slide: CompiledSlide;
  currentClicks: number;
  currentClicksTotal: number;
  slidesViewport: SlidesViewport;
  slidesLayout?: LayoutName;
  slidesBackground?: string;
  onJumpToCue?: (cueIndex: number) => void;
  onClose?: () => void;
  className?: string;
}) {
  const [mode, setMode] = useState<FlowPreviewMode>("live");
  const [selectedClicks, setSelectedClicks] = useState(currentClicks);
  const Layout = useResolvedLayout(slide.meta.layout ?? slidesLayout);
  const Slide = slide.component;
  const overviewStage = useMemo(
    () => resolveOverviewStageMetrics(slidesViewport),
    [slidesViewport],
  );
  const cueSteps = useMemo(
    () => Array.from({ length: currentClicksTotal + 1 }, (_, index) => index),
    [currentClicksTotal],
  );

  useEffect(() => {
    setSelectedClicks(currentClicks);
  }, [currentClicks, currentClicksTotal, slide.id]);

  const previewClicks = resolvePreviewStep({
    mode,
    currentClicks,
    currentClicksTotal,
    selectedClicks,
  });
  const revealContextValue = useMemo(
    () =>
      createRevealContextValue({
        slideId: `${slide.id}:timeline-preview`,
        clicks: previewClicks,
        clicksTotal: currentClicksTotal,
      }),
    [currentClicksTotal, previewClicks, slide.id],
  );
  const surface = resolveSlideSurface({
    meta: slide.meta,
    slidesBackground,
    className: resolveSlideSurfaceClassName({
      layout: slide.meta.layout ?? slidesLayout,
      overflowHidden: true,
    }),
  });
  const previewLabel = describePreviewStep(previewClicks, currentClicksTotal);
  const modeDescription =
    mode === "live"
      ? "Mirror the current stage state."
      : mode === "final"
        ? "Flatten to the final result."
        : "Inspect one cue position without changing the stage.";

  return (
    <ChromePanel className={`flex flex-col ${className ?? ""}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Timeline Preview
          </p>
          <p className="mt-1 text-xs text-slate-500">{modeDescription}</p>
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
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
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
      <div className="mb-3 flex items-center justify-between gap-3 text-xs text-slate-500">
        <span>
          Current stage:{" "}
          {currentClicksTotal > 0 ? `${currentClicks}/${currentClicksTotal}` : "base"}
        </span>
        {onJumpToCue && previewClicks !== currentClicks && (
          <button
            onClick={() => onJumpToCue(previewClicks)}
            className={chromeTagClassName({
              tone: "active",
              className: "transition hover:bg-emerald-100",
            })}
          >
            Jump To Stage
          </button>
        )}
      </div>
      {currentClicksTotal > 0 ? (
        <div className="grid grid-cols-2 gap-2 overflow-auto pr-1">
          {cueSteps.map((step) => {
            const selected = previewClicks === step;
            const current = currentClicks === step;
            const label = step === 0 ? "Start" : `Cue ${step}`;

            return (
              <button
                key={step}
                type="button"
                onClick={() => {
                  setMode("steps");
                  setSelectedClicks(step);
                }}
                className={`rounded-md border px-3 py-2 text-left transition ${
                  selected
                    ? "border-slate-900 bg-slate-900 text-white"
                    : current
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-white/90 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                      selected ? "bg-white/18 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    reveal
                  </span>
                </div>
                <div
                  className={`mt-1 text-xs ${
                    selected ? "text-white/78" : current ? "text-emerald-700" : "text-slate-500"
                  }`}
                >
                  {step === 0
                    ? "Base slide state before cues."
                    : `Reveal cue ${step} becomes active.`}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <ChromePanel as="div" tone="dashed" radius="inset" className="px-4 py-5 text-sm">
          No cue steps detected on this slide yet.
        </ChromePanel>
      )}
    </ChromePanel>
  );
}
