import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { ArrowLeft, Printer } from "lucide-react";
import type { LayoutName } from "@slidev-react/core/slides/layout";
import type { SlidesViewport } from "@slidev-react/core/slides/viewport";
import {
  formatViewportAspectRatio,
  isPortraitViewport,
  resolvePrintPageSize,
} from "@slidev-react/core/slides/viewport";
import { resolveCueTotal } from "@slidev-react/core/presentation/flow/cue";
import { SlidePreviewSurface } from "./stage/SlidePreviewSurface";
import type { CompiledSlide } from "./presenter/types";
import { RevealProvider, type RevealContextValue } from "./reveal/RevealContext";
import { useResolvedLayout } from "../../theme/useResolvedLayout";

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
  slidesViewport,
  slidesLayout,
  slidesBackground,
  withClicks,
}: {
  slide: CompiledSlide;
  slideNumber: number;
  totalSlides: number;
  slidesViewport: SlidesViewport;
  slidesLayout?: LayoutName;
  slidesBackground?: string;
  withClicks: boolean;
}) {
  const Slide = slide.component;
  const Layout = useResolvedLayout(slide.meta.layout ?? slidesLayout);
  const probeStepsRef = useRef(new Map<number, number>());
  const [detectedClicks, setDetectedClicks] = useState(0);
  const [measurementReady, setMeasurementReady] = useState(!withClicks);
  const clicksTotal = resolveCueTotal({
    configuredCues: slide.meta.clicks,
    detectedCues: detectedClicks,
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
            <div className="print-slide-meta mb-3 flex items-center justify-between px-1 text-xs font-medium tracking-[0.18em] text-slate-500 uppercase">
              <span>{slide.meta.title ?? `Slide ${slideNumber}`}</span>
              <span>
                {withClicks
                  ? `${slideNumber}/${totalSlides} • ${clickLabel}`
                  : `${slideNumber} / ${totalSlides}`}
              </span>
            </div>
            <div className="print-slide-sheet rounded-[24px] border border-slate-200/80 bg-white ">
              <div className="print-slide-frame p-3">
                {withClicks && typeof clickStep === "number" ? (
                  <SlidePreviewSurface
                    Slide={Slide}
                    meta={slide.meta}
                    slidesViewport={slidesViewport}
                    slidesLayout={slidesLayout}
                    slidesBackground={slidesBackground}
                    content={
                      <PrintSlideSnapshot
                        Slide={Slide}
                        slideId={`${slide.id}:${clickStep}`}
                        clicks={clickStep}
                        clicksTotal={clicksTotal}
                        registerStep={noopRegisterStep}
                      >
                        {(content) => <Layout>{content}</Layout>}
                      </PrintSlideSnapshot>
                    }
                    viewportClassName="print-slide-viewport relative w-full overflow-hidden"
                    viewportStyle={{ aspectRatio: formatViewportAspectRatio(slidesViewport) }}
                    overflowHidden
                    shadowClass=""
                    articleProps={{
                      "data-export-surface": "slide",
                    }}
                  />
                ) : (
                  <SlidePreviewSurface
                    Slide={Slide}
                    meta={slide.meta}
                    slidesViewport={slidesViewport}
                    slidesLayout={slidesLayout}
                    slidesBackground={slidesBackground}
                    content={
                      <Layout>
                        <Slide />
                      </Layout>
                    }
                    viewportClassName="print-slide-viewport relative w-full overflow-hidden"
                    viewportStyle={{ aspectRatio: formatViewportAspectRatio(slidesViewport) }}
                    overflowHidden
                    shadowClass=""
                    articleProps={{
                      "data-export-surface": "slide",
                    }}
                  />
                )}
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}

export function PrintSlidesView({
  slides,
  slidesTitle,
  slidesViewport,
  slidesLayout,
  slidesBackground,
  exportBaseName,
  withClicks = false,
  onBack,
}: {
  slides: CompiledSlide[];
  slidesTitle?: string;
  slidesViewport: SlidesViewport;
  slidesLayout?: LayoutName;
  slidesBackground?: string;
  exportBaseName: string;
  withClicks?: boolean;
  onBack: () => void;
}) {
  const pageSize = useMemo(() => resolvePrintPageSize(slidesViewport), [slidesViewport]);
  const rootStyle = useMemo(
    () =>
      ({
        "--print-page-width": `${pageSize.widthMm}mm`,
        "--print-page-height": `${pageSize.heightMm}mm`,
        "--print-page-aspect-ratio": formatViewportAspectRatio(slidesViewport),
      }) as CSSProperties,
    [slidesViewport, pageSize.heightMm, pageSize.widthMm],
  );

  return (
    <div
      data-export-view="print"
      data-export-with-clicks={withClicks ? "true" : "false"}
      data-export-orientation={isPortraitViewport(slidesViewport) ? "portrait" : "landscape"}
      data-export-viewport-width={String(slidesViewport.width)}
      data-export-viewport-height={String(slidesViewport.height)}
      className="print-slides-view min-h-screen bg-[linear-gradient(180deg,#dcfce7_0%,#f0fdf4_26%,#f8fafc_100%)] text-slate-900"
      style={rootStyle}
    >
      <style>{`@page { size: ${pageSize.widthMm}mm ${pageSize.heightMm}mm; margin: 0; }`}</style>
      <header className="print-slides-toolbar sticky top-0 z-20 border-b border-slate-200/80 bg-white/88 px-5 py-4  backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Print Export
            </p>
            <h1 className="truncate text-lg font-semibold text-slate-900">
              {slidesTitle ?? "Untitled slides"}
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
              Back to slides
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-2 rounded-[8px] border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              <Printer size={15} />
              Print / Save PDF
            </button>
          </div>
        </div>
      </header>
      <main className="print-slides-content mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6 md:py-10">
        {slides.map((slide, index) => (
          <PrintSlideGroup
            key={slide.id}
            slide={slide}
            slideNumber={index + 1}
            totalSlides={slides.length}
            slidesViewport={slidesViewport}
            slidesLayout={slidesLayout}
            slidesBackground={slidesBackground}
            withClicks={withClicks}
          />
        ))}
      </main>
    </div>
  );
}
