import type { PresentationCursorState } from "../types"
import { RevealProvider } from "../reveal/RevealContext"
import { SlideStage } from "../stage/SlideStage"
import { PresenterSidePreview } from "./PresenterSidePreview"
import { SpeakerNotesPanel } from "./SpeakerNotesPanel"
import type { CompiledSlide, SlidesConfig } from "./model/types"
import type { PresenterFlowRuntime } from "./runtime/usePresenterFlowRuntime"
import type { usePresenterChromeRuntime } from "./runtime/usePresenterChromeRuntime"

export function PresenterModeView({
  currentSlide,
  nextSlide,
  slidesConfig,
  canControl,
  remoteCursor,
  localCursor: _localCursor,
  setLocalCursor,
  flow,
  chrome,
  navigation,
}: {
  currentSlide: CompiledSlide
  nextSlide: CompiledSlide | null
  slidesConfig: SlidesConfig
  canControl: boolean
  remoteCursor: PresentationCursorState | null
  localCursor: PresentationCursorState | null
  setLocalCursor: (cursor: PresentationCursorState | null) => void
  flow: PresenterFlowRuntime
  chrome: ReturnType<typeof usePresenterChromeRuntime>
  navigation: { currentIndex: number; total: number }
}) {
  const CurrentSlide = currentSlide.component

  return (
    <div
      ref={chrome.presenterLayoutRef}
      style={chrome.presenterLayoutStyle}
      className="grid h-full min-h-0 grid-cols-1 gap-0"
    >
      <section className="relative min-h-0 overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="relative z-0 h-full">
          <RevealProvider value={flow.revealContextValue}>
            <SlideStage
              Slide={CurrentSlide}
              slideId={currentSlide.id}
              meta={currentSlide.meta}
              slidesConfig={slidesConfig}
              remoteCursor={canControl ? null : remoteCursor}
              onCursorChange={canControl ? setLocalCursor : undefined}
              onStageAdvance={
                canControl && !chrome.activeOverlay ? flow.advanceReveal : undefined
              }
              scaleMultiplier={chrome.stageScale}
            />
          </RevealProvider>
        </div>
      </section>
      <div
        role="separator"
        aria-label="Resize presenter sidebar"
        aria-orientation="vertical"
        tabIndex={0}
        onPointerDown={chrome.handleSidebarResizeStart}
        onKeyDown={chrome.handleSidebarResizeKeyDown}
        className="group relative hidden cursor-col-resize lg:block"
      >
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-slate-200" />
        <div className="absolute inset-y-0 left-1/2 w-1.5 -translate-x-1/2 rounded-sm bg-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <aside className="relative z-10 flex min-h-0 min-w-0 flex-col text-slate-900">
        <div className="grid min-h-0 flex-1 gap-3 lg:grid-rows-[minmax(220px,0.92fr)_minmax(0,1.08fr)]">
          <PresenterSidePreview
            title="Up Next"
            indexLabel={nextSlide ? String(navigation.currentIndex + 2) : "--"}
            slide={nextSlide}
            slidesConfig={slidesConfig}
          />
          <SpeakerNotesPanel
            currentClicks={flow.currentClicks}
            currentClicksTotal={flow.currentClicksTotal}
            notes={currentSlide.meta.notes}
          />
        </div>
      </aside>
    </div>
  )
}
