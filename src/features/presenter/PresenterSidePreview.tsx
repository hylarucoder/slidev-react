import type { LayoutName } from "../../deck/model/layout"
import { resolveLayout } from "../../theme/layouts/resolveLayout"
import {
  OVERVIEW_STAGE_SCALE,
  STAGE_HEIGHT,
  STAGE_WIDTH,
} from "./stage"
import type { CompiledSlide } from "./types"

export function PresenterSidePreview({
  title,
  indexLabel,
  slide,
  deckLayout,
}: {
  title: string
  indexLabel: string
  slide: CompiledSlide | null
  deckLayout?: LayoutName
}) {
  if (!slide) {
    return (
      <section className="flex h-full min-h-0 flex-col rounded-[8px] border border-slate-200/70 bg-white/72 p-4 text-slate-900 shadow-[0_18px_44px_rgba(148,163,184,0.18)] backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{title}</p>
          <span className="rounded-[5px] border border-slate-200 bg-white/88 px-2.5 py-1 text-[11px] font-medium text-slate-500">{indexLabel}</span>
        </div>
        <div className="grid min-h-[220px] flex-1 place-items-center rounded-[5px] border border-dashed border-slate-200/80 bg-slate-50/75 text-sm text-slate-500">
          End of deck
        </div>
      </section>
    )
  }

  const Layout = resolveLayout(slide.meta.layout ?? deckLayout)
  const Slide = slide.component

  return (
    <section className="flex h-full min-h-0 flex-col rounded-[8px] border border-slate-200/70 bg-white/72 p-4 text-slate-900 shadow-[0_18px_44px_rgba(148,163,184,0.18)] backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{title}</p>
        <span className="rounded-[5px] border border-slate-200 bg-white/88 px-2.5 py-1 text-[11px] font-medium text-slate-500">{indexLabel}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-[5px] border border-slate-200/80 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
        <div
          className="origin-top-left text-black"
          style={{
            width: `${STAGE_WIDTH}px`,
            height: `${STAGE_HEIGHT}px`,
            transform: `scale(${OVERVIEW_STAGE_SCALE})`,
            transformOrigin: "top left",
          }}
        >
          <article className="slide-prose box-border size-full bg-white px-18 py-14">
            <Layout>
              <Slide />
            </Layout>
          </article>
        </div>
      </div>
      <p className="mt-3 truncate text-base font-semibold text-slate-900">
        {slide.meta.title ?? "Untitled"}
      </p>
      <p className="mt-1 text-sm text-slate-500">
        Keep this in peripheral view so the next transition never feels reactive.
      </p>
    </section>
  )
}
