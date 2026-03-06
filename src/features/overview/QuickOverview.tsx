import { X } from "lucide-react";
import { resolveLayout } from "../../theme/layouts/resolveLayout";
import {
  OVERVIEW_STAGE_HEIGHT,
  OVERVIEW_STAGE_SCALE,
  OVERVIEW_STAGE_WIDTH,
  STAGE_HEIGHT,
  STAGE_WIDTH,
} from "../presenter/stage";
import type { CompiledSlide } from "../presenter/types";

export function QuickOverview({
  open,
  slides,
  currentIndex,
  onClose,
  onSelect,
}: {
  open: boolean;
  slides: CompiledSlide[];
  currentIndex: number;
  onClose: () => void;
  onSelect: (index: number) => void;
}) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 bg-slate-100/82 backdrop-blur-sm">
      <div className="mx-auto flex h-full w-full max-w-[1800px] flex-col px-6 py-6">
        <header className="mb-4 flex items-center justify-between">
          <div className="text-slate-900">
            <h2 className="text-lg font-semibold">Quick Overview</h2>
            <p className="text-sm text-slate-600">
              Click a slide to jump. Press `O` or `Esc` to close.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quick overview"
            className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          >
            <X size={18} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto pr-1">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(308px,1fr))] gap-4">
            {slides.map((slide, index) => {
              const active = index === currentIndex;
              const Layout = resolveLayout(slide.meta.layout);
              const Slide = slide.component;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => onSelect(index)}
                  className={`group overflow-hidden rounded-xl border p-3 text-left transition ${active ? "border-blue-400 bg-blue-50 shadow-[0_0_0_1px_rgba(96,165,250,0.45)]" : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50"}`}
                  aria-label={`Go to slide ${index + 1}`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                      {index + 1}
                    </span>
                    {slide.meta.layout && (
                      <span className="text-xs text-slate-500">{slide.meta.layout}</span>
                    )}
                  </div>
                  <div
                    className="mb-2 overflow-hidden rounded-lg border border-slate-300 bg-white"
                    style={{
                      width: `${OVERVIEW_STAGE_WIDTH}px`,
                      height: `${OVERVIEW_STAGE_HEIGHT}px`,
                    }}
                  >
                    <div
                      className="pointer-events-none origin-top-left select-none"
                      style={{
                        width: `${STAGE_WIDTH}px`,
                        height: `${STAGE_HEIGHT}px`,
                        transform: `scale(${OVERVIEW_STAGE_SCALE})`,
                      }}
                    >
                      <article className="slide-prose box-border size-full bg-white px-18 py-14">
                        <Layout>
                          <Slide />
                        </Layout>
                      </article>
                    </div>
                  </div>
                  <div className="truncate text-sm font-medium text-slate-900">
                    {slide.meta.title ?? `Slide ${index + 1}`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
