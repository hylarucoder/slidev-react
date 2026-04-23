import { RevealProvider } from '../reveal/RevealContext'
import { SlideStage } from '../stage/SlideStage'
import { usePresenterContext } from '../presenter/PresenterContext'
import { FlowTimeline } from '../presenter/panels/FlowTimeline'
import { SidePreview } from '../presenter/panels/SidePreview'
import { SpeakerNotes } from '../presenter/panels/SpeakerNotes'
import { TopProgress } from '../presenter/panels/TopProgress'
import { StatusBar } from '../status/StatusBar'

const PRESENTER_BOTTOM_BAR_CLEARANCE = 72

export function PresenterMode() {
  const ctx = usePresenterContext()
  const currentSlide = ctx.slides[ctx.navigation.currentIndex]
  const nextSlide = ctx.slides[ctx.navigation.currentIndex + 1] ?? null
  const progressPercent =
    ctx.navigation.total > 0
      ? ((ctx.navigation.currentIndex + 1) / ctx.navigation.total) * 100
      : 0

  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-slate-50" />
      <TopProgress total={ctx.navigation.total} progressPercent={progressPercent} />

      <StatusBar
        slideId={currentSlide.id}
        session={ctx.session}
        sync={ctx.sessionState.sync}
        recorder={ctx.sessionState.recorder}
        wakeLock={ctx.wakeLock}
        fullscreen={ctx.fullscreen}
        chrome={{
          stageScale: ctx.chrome.stageScale,
          cursorMode: ctx.chrome.cursorMode,
          timelinePreviewOpen: ctx.chrome.timelinePreviewOpen,
          overviewOpen: ctx.chrome.overviewOpen,
          notesOpen: ctx.chrome.notesOverviewOpen,
          shortcutsOpen: ctx.chrome.shortcutsHelpOpen,
          canOpenOverview: ctx.canOpenOverview,
          onToggleTimelinePreview: ctx.chrome.toggleTimelinePreview,
          onToggleOverview: ctx.chrome.toggleOverview,
          onToggleNotes: ctx.chrome.toggleNotes,
          onToggleShortcuts: ctx.chrome.toggleShortcuts,
          onStageScaleChange: ctx.chrome.handleStageScaleChange,
          onCursorModeChange: ctx.chrome.handleCursorModeChange,
        }}
        sessionTimerSeconds={
          ctx.canControl ? ctx.sessionState.localTimer : ctx.sessionState.remoteTimer
        }
        canRecord={ctx.canControl}
        onOpenMirrorStage={ctx.onOpenMirrorStage}
        onOpenPrintExport={ctx.onOpenPrintExport}
        onSyncModeChange={ctx.onSyncModeChange}
      />

      <div
        style={{ paddingBottom: `${PRESENTER_BOTTOM_BAR_CLEARANCE}px` }}
        className="relative min-h-0 min-w-0 size-full"
      >
        <div
          ref={ctx.chrome.presenterLayoutRef}
          style={ctx.chrome.presenterLayoutStyle}
          className="grid h-full min-h-0 grid-cols-1 gap-0"
        >
          <section className="relative min-h-0 overflow-hidden rounded-md border border-slate-200 bg-white">
            <div className="relative z-0 h-full">
              <RevealProvider value={ctx.flow.revealContextValue}>
                <SlideStage
                  Slide={currentSlide.component}
                  slideId={currentSlide.id}
                  meta={currentSlide.meta}
                  slidesConfig={ctx.slidesConfig}
                  remoteCursor={ctx.canControl ? null : ctx.sessionState.remoteCursor}
                  onCursorChange={ctx.canControl ? ctx.sessionState.setLocalCursor : undefined}
                  onStageAdvance={
                    ctx.canControl && !ctx.chrome.activeOverlay ? ctx.flow.advanceReveal : undefined
                  }
                  scaleMultiplier={ctx.chrome.stageScale}
                />
              </RevealProvider>
            </div>
          </section>
          <div
            role="separator"
            aria-label="Resize presenter sidebar"
            aria-orientation="vertical"
            tabIndex={0}
            onPointerDown={ctx.chrome.handleSidebarResizeStart}
            onKeyDown={ctx.chrome.handleSidebarResizeKeyDown}
            className="group relative hidden cursor-col-resize lg:block"
          >
            <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-slate-200" />
            <div className="absolute inset-y-0 left-1/2 w-1.5 -translate-x-1/2 rounded-sm bg-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <aside className="relative z-10 flex min-h-0 min-w-0 flex-col text-slate-900">
            <div className="grid min-h-0 flex-1 gap-3 lg:grid-rows-[minmax(220px,0.92fr)_minmax(0,1.08fr)]">
              <SidePreview
                title="Up Next"
                indexLabel={nextSlide ? String(ctx.navigation.currentIndex + 2) : '--'}
                slide={nextSlide}
                slidesConfig={ctx.slidesConfig}
              />
              <SpeakerNotes
                currentClicks={ctx.flow.currentClicks}
                currentClicksTotal={ctx.flow.currentClicksTotal}
                notes={currentSlide.meta.notes}
              />
            </div>
          </aside>
        </div>
      </div>

      {ctx.chrome.timelinePreviewOpen && (
        <div
          className="absolute inset-x-4 z-30 flex justify-center"
          style={{ bottom: `${PRESENTER_BOTTOM_BAR_CLEARANCE + 16}px` }}
        >
          <FlowTimeline
            slide={currentSlide}
            currentClicks={ctx.flow.currentClicks}
            currentClicksTotal={ctx.flow.currentClicksTotal}
            slidesConfig={ctx.slidesConfig}
            onJumpToCue={(cueIndex) => ctx.flow.setSlideClicks(currentSlide.id, cueIndex)}
            onClose={ctx.chrome.closeOverlay}
            className="w-full max-w-[min(920px,calc(100vw-2rem))] max-h-[min(60vh,700px)]"
          />
        </div>
      )}
    </>
  )
}
