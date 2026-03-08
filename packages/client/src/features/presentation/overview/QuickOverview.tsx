import type { KeyboardEvent } from "react";
import { X } from "lucide-react";
import type { SlidesViewport } from "@slidev-react/core/slides/viewport";
import { formatViewportAspectRatio } from "@slidev-react/core/slides/viewport";
import type { CompiledSlide } from "../presenter/types";
import { ChromeIconButton } from "../../../ui/primitives/ChromeIconButton";
import { ChromePanel } from "../../../ui/primitives/ChromePanel";
import { ChromeTag } from "../../../ui/primitives/ChromeTag";
import { SlidePreviewSurface } from "../stage/SlidePreviewSurface";

function OverviewSlidePreview({
  index,
  active,
  slide,
  slidesViewport,
  slidesLayout,
  slidesBackground,
}: {
  index: number;
  active: boolean;
  slide: CompiledSlide;
  slidesViewport: SlidesViewport;
  slidesLayout?: CompiledSlide["meta"]["layout"];
  slidesBackground?: string;
}) {
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
      <SlidePreviewSurface
        Slide={slide.component}
        meta={slide.meta}
        slidesViewport={slidesViewport}
        slidesLayout={slidesLayout}
        slidesBackground={slidesBackground}
        viewportClassName="size-full"
        stageClassName="pointer-events-none select-none"
      />
    </div>
  );
}

export function QuickOverview({
  open,
  slides,
  currentIndex,
  slidesViewport,
  slidesLayout,
  slidesBackground,
  onClose,
  onSelect,
}: {
  open: boolean;
  slides: CompiledSlide[];
  currentIndex: number;
  slidesViewport: SlidesViewport;
  slidesLayout?: CompiledSlide["meta"]["layout"];
  slidesBackground?: string;
  onClose: () => void;
  onSelect: (index: number) => void;
}) {
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
                    slidesViewport={slidesViewport}
                    slidesLayout={slidesLayout}
                    slidesBackground={slidesBackground}
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
