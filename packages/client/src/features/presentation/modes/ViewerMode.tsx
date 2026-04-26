import { PresentationNavbar } from '../navigation/PresentationNavbar'
import { RevealProvider } from '../reveal/RevealContext'
import { SlideStage } from '../stage/SlideStage'
import { usePresenterContext } from '../presenter/PresenterContext'

export function ViewerMode() {
  const ctx = usePresenterContext()
  const currentSlide = ctx.slides[ctx.navigation.currentIndex]
  const showEnterPresenterButton = ctx.session.role !== 'presenter'

  return (
    <>
      <div className="relative min-h-0 min-w-0 size-full">
        <RevealProvider value={ctx.flow.revealContextValue}>
          <SlideStage
            Slide={currentSlide.component}
            slideId={currentSlide.id}
            meta={currentSlide.meta}
            slidesConfig={ctx.slidesConfig}
            remoteCursor={ctx.canControl ? null : ctx.sessionState.remoteCursor}
            onCursorChange={ctx.canControl ? ctx.sessionState.setLocalCursor : undefined}
          />
        </RevealProvider>
      </div>

      <PresentationNavbar
        slideTitle={currentSlide.meta.title}
        currentIndex={ctx.navigation.currentIndex}
        total={ctx.navigation.total}
        canPrev={ctx.flow.canPrev}
        canNext={ctx.flow.canNext}
        showPresenterModeButton={showEnterPresenterButton}
        overviewOpen={ctx.chrome.overviewOpen}
        notesOpen={ctx.chrome.notesOverviewOpen}
        shortcutsOpen={ctx.chrome.shortcutsHelpOpen}
        canOpenOverview={ctx.canOpenOverview}
        onEnterPresenterMode={showEnterPresenterButton ? ctx.onEnterPresenterMode : undefined}
        onToggleOverview={ctx.chrome.toggleOverview}
        onToggleNotes={ctx.chrome.toggleNotes}
        onToggleShortcuts={ctx.chrome.toggleShortcuts}
        onPrev={ctx.flow.retreatReveal}
        onNext={ctx.flow.advanceReveal}
        canControl={ctx.canControl}
      />
    </>
  )
}
