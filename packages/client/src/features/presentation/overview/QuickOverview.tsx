import { startTransition, useEffect, useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { formatViewportAspectRatio } from "@slidev-react/core/slides/viewport";
import type { CompiledSlide, SlidesConfig } from "../presenter/model/types";
import { ChromeIconButton } from "../../../ui/primitives/ChromeIconButton";
import { ChromePanel } from "../../../ui/primitives/ChromePanel";
import { ChromeTag } from "../../../ui/primitives/ChromeTag";
import { SlidePreviewSurface } from "../stage/SlidePreviewSurface";

function OverviewSlidePreview({
  index,
  active,
  slide,
  ready,
  slidesConfig,
}: {
  index: number;
  active: boolean;
  slide: CompiledSlide;
  ready: boolean;
  slidesConfig: Pick<SlidesConfig, "slidesViewport" | "slidesLayout" | "slidesBackground">;
}) {
  const { slidesViewport } = slidesConfig;
  return (
    <div
      style={{ aspectRatio: formatViewportAspectRatio(slidesViewport) }}
      className={`relative mb-0 w-full overflow-hidden rounded-t-md rounded-b-none bg-slate-100/72  ${active ? "ring-1 ring-emerald-200/80" : ""}`}
    >
      <span className="absolute top-2 left-2 z-10">
        <ChromeTag tone={active ? "active" : "default"} size="xs" weight="semibold">
          {index + 1}
        </ChromeTag>
      </span>
      {slide.meta.layout && (
        <span className="absolute top-2 right-2 z-10">
          <ChromeTag size="xs">{slide.meta.layout}</ChromeTag>
        </span>
      )}
      {ready ? (
        <SlidePreviewSurface
          Slide={slide.component}
          meta={slide.meta}
          slidesConfig={slidesConfig}
          viewportClassName="size-full"
          stageClassName="pointer-events-none select-none"
        />
      ) : (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(241,245,249,0.94))]" />
          <div className="absolute inset-x-5 top-14 h-5 rounded-full bg-white/90 shadow-[0_1px_0_rgba(255,255,255,0.6)] animate-pulse" />
          <div className="absolute inset-x-10 top-24 h-3 rounded-full bg-slate-200/90 animate-pulse" />
          <div className="absolute inset-x-12 top-[7.75rem] h-3 rounded-full bg-slate-200/70 animate-pulse" />
          <div className="absolute left-8 right-8 bottom-10 top-40 rounded-[24px] border border-slate-200/80 bg-white/88 shadow-[0_18px_40px_rgba(148,163,184,0.12)]" />
        </div>
      )}
    </div>
  );
}

export function QuickOverview({
  open,
  slides,
  currentIndex,
  slidesConfig,
  onClose,
  onSelect,
}: {
  open: boolean;
  slides: CompiledSlide[];
  currentIndex: number;
  slidesConfig: Pick<SlidesConfig, "slidesViewport" | "slidesLayout" | "slidesBackground">;
  onClose: () => void;
  onSelect: (index: number) => void;
}) {
  const [previewsReady, setPreviewsReady] = useState(false)

  useEffect(() => {
    if (!open) {
      setPreviewsReady(false)
      return
    }

    setPreviewsReady(false)

    let secondFrameId = 0
    const firstFrameId = window.requestAnimationFrame(() => {
      secondFrameId = window.requestAnimationFrame(() => {
        startTransition(() => {
          setPreviewsReady(true)
        })
      })
    })

    return () => {
      window.cancelAnimationFrame(firstFrameId)
      if (secondFrameId) window.cancelAnimationFrame(secondFrameId)
    }
  }, [open, slides.length])

  function handleSelectKeyDown(event: KeyboardEvent<HTMLElement>, index: number) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSelect(index);
  }

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 bg-slate-100/84 backdrop-blur-md">
      <div className="mx-auto flex h-full w-full max-w-[2200px] flex-col px-6 py-6">
        <header className="mb-5 flex items-center justify-between">
          <div className="text-slate-900">
            <h2 className="text-lg font-semibold">Quick Overview</h2>
            <p className="text-sm text-slate-600">
              Click a slide to jump. Press `O` or `Esc` to close.
            </p>
          </div>
          <ChromeIconButton
            onClick={onClose}
            aria-label="Close quick overview"
            className="rounded-full "
          >
            <X size={18} />
          </ChromeIconButton>
        </header>
        <div className="min-h-0 flex-1 overflow-auto pr-1">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(360px,1fr))] gap-5">
            {slides.map((slide, index) => {
              const active = index === currentIndex;
              return (
                <ChromePanel
                  key={slide.id}
                  as="article"
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(index)}
                  onKeyDown={(event: KeyboardEvent<HTMLElement>) =>
                    handleSelectKeyDown(event, index)
                  }
                  className={`group cursor-pointer overflow-hidden p-0 text-left transition focus:outline-none focus:ring-2 focus:ring-emerald-300/70 ${active ? "bg-white ring-1 ring-emerald-300/70" : "bg-white/90 ring-1 ring-transparent hover:bg-white/92  hover:ring-slate-300/70"}`}
                  aria-label={`Go to slide ${index + 1}`}
                  tone="solid"
                  radius="section"
                  padding="none"
                >
                  <OverviewSlidePreview
                    index={index}
                    active={active}
                    slide={slide}
                    ready={previewsReady}
                    slidesConfig={slidesConfig}
                  />
                  <div className="truncate px-2.5 py-2 text-sm font-medium text-slate-900">
                    {slide.meta.title ?? `Slide ${index + 1}`}
                  </div>
                </ChromePanel>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
