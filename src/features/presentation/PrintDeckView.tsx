import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import type { LayoutName } from "../../deck/model/layout";
import { resolveSlideSurface } from "../player/slideSurface";
import type { CompiledSlide } from "../presenter/types";
import { RevealProvider, type RevealContextValue } from "../reveal/RevealContext";
import { resolveRevealTotal } from "../reveal/clicks";
import { useResolvedLayout } from "../../theme/useResolvedLayout";

const PRINT_SLIDE_WIDTH = 1920;
const PRINT_SLIDE_HEIGHT = 1080;

function noopCleanup() {}

function noopRegisterStep() {
  return noopCleanup;
}

function createRevealContextValue({
  slideId,
  clicks,
  clicksTotal,
  registerStep,
}: {
  slideId: string;
  clicks: number;
  clicksTotal: number;
  registerStep: RevealContextValue["registerStep"];
}): RevealContextValue {
  return {
    slideId,
    clicks,
    clicksTotal,
    setClicks: () => {},
    registerStep,
    advance: () => {},
    retreat: () => {},
    canAdvance: false,
    canRetreat: false,
  };
}

function PrintSlideSnapshot({
  Slide,
  slideId,
  clicks,
  clicksTotal,
  registerStep,
  children,
}: {
  Slide: CompiledSlide["component"];
  slideId: string;
  clicks: number;
  clicksTotal: number;
  registerStep: RevealContextValue["registerStep"];
  children: (content: ReactNode) => ReactNode;
}) {
  const revealContextValue = useMemo(
    () =>
      createRevealContextValue({
        slideId,
        clicks,
        clicksTotal,
        registerStep,
      }),
    [clicks, clicksTotal, registerStep, slideId],
  );

  return <RevealProvider value={revealContextValue}>{children(<Slide />)}</RevealProvider>;
}

function PrintSlideGroup({
  slide,
  slideNumber,
  totalSlides,
  deckLayout,
  deckBackground,
  withClicks,
}: {
  slide: CompiledSlide;
  slideNumber: number;
  totalSlides: number;
  deckLayout?: LayoutName;
  deckBackground?: string;
  withClicks: boolean;
}) {
  const Slide = slide.component;
  const Layout = useResolvedLayout(slide.meta.layout ?? deckLayout);
  const surface = resolveSlideSurface({
    meta: slide.meta,
    deckBackground,
    className:
      "slide-prose relative box-border size-full overflow-hidden px-18 py-14 shadow-[0_24px_60px_rgba(15,23,42,0.1)]",
  });
  const probeStepsRef = useRef(new Map<number, number>());
  const [detectedClicks, setDetectedClicks] = useState(0);
  const [measurementReady, setMeasurementReady] = useState(!withClicks);
  const clicksTotal = resolveRevealTotal({
    configuredClicks: slide.meta.clicks,
    detectedClicks,
  });
  const clickSteps = useMemo(() => {
    if (!withClicks) return [null];

    return Array.from({ length: clicksTotal + 1 }, (_, index) => index);
  }, [clicksTotal, withClicks]);
  const registerProbeStep = useCallback<RevealContextValue["registerStep"]>((step) => {
    const normalizedStep = Math.max(Math.floor(step), 1);
    const next = probeStepsRef.current.get(normalizedStep) ?? 0;
    probeStepsRef.current.set(normalizedStep, next + 1);
    setDetectedClicks((value) => Math.max(value, normalizedStep));

    return () => {
      const current = probeStepsRef.current.get(normalizedStep) ?? 1;
      if (current <= 1) probeStepsRef.current.delete(normalizedStep);
      else probeStepsRef.current.set(normalizedStep, current - 1);
    };
  }, []);

  useEffect(() => {
    if (!withClicks) {
      setMeasurementReady(true);
      return;
    }

    setMeasurementReady(false);
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        setMeasurementReady(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, [clicksTotal, withClicks]);

  return (
    <>
      {withClicks && (
        <div aria-hidden className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0">
          <PrintSlideSnapshot
            Slide={Slide}
            slideId={`${slide.id}:probe`}
            clicks={0}
            clicksTotal={clicksTotal}
            registerStep={registerProbeStep}
          >
            {(content) => <Layout>{content}</Layout>}
          </PrintSlideSnapshot>
        </div>
      )}
      {clickSteps.map((clickStep) => {
        const clickValue = typeof clickStep === "number" ? clickStep : "all";
        const clickLabel =
          typeof clickStep === "number"
            ? `Click ${clickStep}/${clicksTotal}`
            : `Slide ${slideNumber}`;

        return (
          <section
            key={`${slide.id}:${clickValue}`}
            data-export-snapshot="slide"
            data-export-slide={String(slideNumber)}
            data-export-slide-title={slide.meta.title ?? ""}
            data-export-click={String(clickValue)}
            data-export-clicks-total={String(clicksTotal)}
            data-export-slide-ready={measurementReady ? "true" : "false"}
            className="print-slide-shell"
          >
            <div className="mb-3 flex items-center justify-between px-1 text-xs font-medium tracking-[0.18em] text-slate-500 uppercase">
              <span>{slide.meta.title ?? `Slide ${slideNumber}`}</span>
              <span>
                {withClicks
                  ? `${slideNumber}/${totalSlides} • ${clickLabel}`
                  : `${slideNumber} / ${totalSlides}`}
              </span>
            </div>
            <div className="print-slide-frame rounded-[20px] border border-slate-200/80 bg-white/72 p-3 shadow-[0_30px_80px_rgba(148,163,184,0.22)]">
              {withClicks && typeof clickStep === "number" ? (
                <PrintSlideSnapshot
                  Slide={Slide}
                  slideId={`${slide.id}:${clickStep}`}
                  clicks={clickStep}
                  clicksTotal={clicksTotal}
                  registerStep={noopRegisterStep}
                >
                  {(content) => (
                    <article
                      data-export-surface="slide"
                      className={surface.className}
                      style={{
                        ...surface.style,
                        aspectRatio: `${PRINT_SLIDE_WIDTH} / ${PRINT_SLIDE_HEIGHT}`,
                      }}
                    >
                      <Layout>{content}</Layout>
                    </article>
                  )}
                </PrintSlideSnapshot>
              ) : (
                <article
                  data-export-surface="slide"
                  className={surface.className}
                  style={{
                    ...surface.style,
                    aspectRatio: `${PRINT_SLIDE_WIDTH} / ${PRINT_SLIDE_HEIGHT}`,
                  }}
                >
                  <Layout>
                    <Slide />
                  </Layout>
                </article>
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}

export function PrintDeckView({
  slides,
  deckTitle,
  deckLayout,
  deckBackground,
  exportBaseName,
  withClicks = false,
  onBack,
}: {
  slides: CompiledSlide[];
  deckTitle?: string;
  deckLayout?: LayoutName;
  deckBackground?: string;
  exportBaseName: string;
  withClicks?: boolean;
  onBack: () => void;
}) {
  return (
    <div
      data-export-view="print"
      data-export-with-clicks={withClicks ? "true" : "false"}
      className="print-deck-view min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eff6ff_26%,#f8fafc_100%)] text-slate-900"
    >
      <header className="print-deck-toolbar sticky top-0 z-20 border-b border-slate-200/80 bg-white/88 px-5 py-4 shadow-[0_16px_44px_rgba(148,163,184,0.18)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700">
              Print Export
            </p>
            <h1 className="truncate text-lg font-semibold text-slate-900">
              {deckTitle ?? "Untitled deck"}
            </h1>
            <p className="text-sm text-slate-500">
              {slides.length} slides
              {withClicks ? " • reveal snapshots included" : ""}
              {" • "}suggested file name: {exportBaseName}.pdf
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center justify-center gap-2 rounded-[8px] border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft size={15} />
              Back to deck
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-2 rounded-[8px] border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
            >
              <Printer size={15} />
              Print / Save PDF
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6 md:py-10">
        {slides.map((slide, index) => (
          <PrintSlideGroup
            key={slide.id}
            slide={slide}
            slideNumber={index + 1}
            totalSlides={slides.length}
            deckLayout={deckLayout}
            deckBackground={deckBackground}
            withClicks={withClicks}
          />
        ))}
      </main>
    </div>
  );
}
