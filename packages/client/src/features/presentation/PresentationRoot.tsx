import { useCallback, useMemo } from 'react'
import type compiledSlides from '@generated/slides'
import { buildPrintExportUrl } from '@slidev-react/core/presentation/export/urls'
import { DrawProvider } from './draw/DrawProvider'
import { KeyboardController } from './navigation/KeyboardController'
import { ShortcutsHelpOverlay } from './navigation/ShortcutsHelpOverlay'
import { NotesOverview } from './overview/NotesOverview'
import { PresentationNavbar } from './navigation/PresentationNavbar'
import { useSlidesNavigation } from './navigation/useSlidesNavigation'
import { QuickOverview } from './overview/QuickOverview'
import { PresentationStatus } from './PresentationStatus'
import { buildPresentationEntryUrl, type PresentationSession } from './session'
import type { PresentationSyncMode } from './types'
import { RevealProvider } from './reveal/RevealContext'
import { FlowTimelinePreview } from './presenter/FlowTimelinePreview'
import { PresenterTopProgress } from './presenter/PresenterTopProgress'
import { PresenterModeView } from './presenter/PresenterModeView'
import { StandaloneModeView } from './presenter/StandaloneModeView'
import {
  PresenterContextProvider,
  type PresenterContextValue,
} from './presenter/PresenterContext'
import { usePresenterFlowRuntime } from './presenter/runtime/usePresenterFlowRuntime'
import { usePresenterChromeRuntime } from './presenter/runtime/usePresenterChromeRuntime'
import { usePresenterSessionRuntime } from './presenter/runtime/usePresenterSessionRuntime'
import { useWakeLock } from './presenter/platform/useWakeLock'
import { useFullscreen } from './presenter/platform/useFullscreen'

const PRESENTER_BOTTOM_BAR_CLEARANCE = 72

function canControlNavigation(session: PresentationSession) {
  return !session.enabled || session.role === 'presenter'
}

export function PresentationRoot({
  slidesDocument,
  session,
  onSyncModeChange,
}: {
  slidesDocument: typeof compiledSlides
  session: PresentationSession
  onSyncModeChange: (mode: PresentationSyncMode) => void
}) {
  const slides = slidesDocument.slides
  const slidesTitle = slidesDocument.meta.title
  const slidesConfig = useMemo(
    () => ({
      slidesViewport: slidesDocument.meta.viewport,
      slidesLayout: slidesDocument.meta.layout,
      slidesBackground: slidesDocument.meta.background,
      slidesTransition: slidesDocument.meta.transition,
    }),
    [
      slidesDocument.meta.viewport,
      slidesDocument.meta.layout,
      slidesDocument.meta.background,
      slidesDocument.meta.transition,
    ],
  )
  const slidesExportFilename = slidesDocument.meta.exportFilename
  const slidesSessionSeed = slidesDocument.sourceHash
  const drawStorageKey = useMemo(
    () => `slide-react:draw:${slidesSessionSeed}`,
    [slidesSessionSeed],
  )

  const navigation = useSlidesNavigation()
  const currentSlide = slides[navigation.currentIndex]
  const nextSlide = slides[navigation.currentIndex + 1] ?? null
  const canControl = canControlNavigation(session)
  const isPresenterRole = session.role === 'presenter'
  const canOpenOverview = canControl || session.role === 'viewer'

  const flow = usePresenterFlowRuntime({ slides, navigation })
  const chrome = usePresenterChromeRuntime({ canControl, canOpenOverview, isPresenterRole })
  const wakeLock = useWakeLock()
  const fullscreen = useFullscreen()

  const sessionState = usePresenterSessionRuntime({
    slides,
    session,
    navigation,
    flow,
    canControl,
    slidesExportFilename,
    slidesTitle,
  })

  const handleViewerAdvance = useCallback(() => {
    sessionState.detachFromPresenter()
    flow.advanceReveal()
  }, [sessionState.detachFromPresenter, flow.advanceReveal])

  const handleViewerRetreat = useCallback(() => {
    sessionState.detachFromPresenter()
    flow.retreatReveal()
  }, [sessionState.detachFromPresenter, flow.retreatReveal])

  const handleViewerFirst = useCallback(() => {
    sessionState.detachFromPresenter()
    flow.goToSlideAtStart(0)
  }, [sessionState.detachFromPresenter, flow.goToSlideAtStart])

  const handleViewerLast = useCallback(() => {
    sessionState.detachFromPresenter()
    flow.goToSlideAtStart(Math.max(navigation.total - 1, 0))
  }, [sessionState.detachFromPresenter, flow.goToSlideAtStart, navigation.total])

  const onEnterPresenterMode = useCallback(() => {
    const entryUrl = buildPresentationEntryUrl('presenter', slidesSessionSeed)
    if (!entryUrl) return
    window.location.assign(entryUrl)
  }, [slidesSessionSeed])

  const onOpenPrintExport = useCallback(() => {
    const exportUrl = buildPrintExportUrl(window.location.href)
    const exportWindow = window.open(exportUrl, '_blank')
    if (exportWindow) {
      exportWindow.opener = null
      return
    }
    window.location.assign(exportUrl)
  }, [])

  const onOpenMirrorStage = useCallback(() => {
    const targetUrl = session.viewerUrl
    if (!targetUrl) return
    const mirrorWindow = window.open(targetUrl, '_blank', 'noopener,noreferrer')
    if (mirrorWindow) {
      mirrorWindow.opener = null
      return
    }
    window.location.assign(targetUrl)
  }, [session.viewerUrl])

  const progressPercent =
    navigation.total > 0 ? ((navigation.currentIndex + 1) / navigation.total) * 100 : 0

  const contextValue: PresenterContextValue = {
    slides,
    slidesTitle,
    slidesConfig,
    slidesExportFilename,
    slidesSessionSeed,
    session,
    navigation,
    flow,
    chrome,
    sessionState,
    wakeLock,
    fullscreen,
    canControl,
    isPresenterRole,
    canOpenOverview,
    onOpenPrintExport,
    onOpenMirrorStage,
    onEnterPresenterMode,
    onSyncModeChange,
    handleViewerAdvance,
    handleViewerRetreat,
    handleViewerFirst,
    handleViewerLast,
  }

  return (
    <PresenterContextProvider value={contextValue}>
      <RevealProvider value={flow.revealContextValue}>
        <KeyboardController
          enabled={canControl || session.role === 'viewer'}
          overlayOpen={Boolean(chrome.activeOverlay)}
          onAdvance={!canControl ? handleViewerAdvance : undefined}
          onRetreat={!canControl ? handleViewerRetreat : undefined}
          onFirst={!canControl ? handleViewerFirst : undefined}
          onLast={!canControl ? handleViewerLast : undefined}
        />
      </RevealProvider>
      <DrawProvider
        currentSlideId={currentSlide.id}
        storageKey={drawStorageKey}
        readOnly={!canControl}
        overlayOpen={Boolean(chrome.activeOverlay)}
        remoteStrokes={canControl ? null : sessionState.remoteDrawings}
        onStrokesChange={sessionState.onStrokesChange}
      >
        <div
          className={`relative grid h-dvh max-h-dvh grid-cols-1 grid-rows-[minmax(0,1fr)] overflow-hidden ${
            isPresenterRole ? 'bg-slate-50' : 'bg-black'
          } ${chrome.hideCursor ? 'cursor-none' : ''}`}
        >
          {isPresenterRole && (
            <>
              <div className="pointer-events-none absolute inset-0 bg-slate-50" />
              <PresenterTopProgress total={navigation.total} progressPercent={progressPercent} />
            </>
          )}
          {isPresenterRole && (
            <PresentationStatus
              slideId={currentSlide.id}
              session={session}
              sync={sessionState.sync}
              recorder={sessionState.recorder}
              wakeLock={wakeLock}
              fullscreen={fullscreen}
              chrome={{
                stageScale: chrome.stageScale,
                cursorMode: chrome.cursorMode,
                timelinePreviewOpen: chrome.timelinePreviewOpen,
                overviewOpen: chrome.overviewOpen,
                notesOpen: chrome.notesOverviewOpen,
                shortcutsOpen: chrome.shortcutsHelpOpen,
                canOpenOverview,
                onToggleTimelinePreview: chrome.toggleTimelinePreview,
                onToggleOverview: chrome.toggleOverview,
                onToggleNotes: chrome.toggleNotes,
                onToggleShortcuts: chrome.toggleShortcuts,
                onStageScaleChange: chrome.handleStageScaleChange,
                onCursorModeChange: chrome.handleCursorModeChange,
              }}
              sessionTimerSeconds={canControl ? sessionState.localTimer : sessionState.remoteTimer}
              canRecord={canControl}
              onOpenMirrorStage={onOpenMirrorStage}
              onOpenPrintExport={onOpenPrintExport}
              onSyncModeChange={onSyncModeChange}
            />
          )}
          <div
            style={
              isPresenterRole ? { paddingBottom: `${PRESENTER_BOTTOM_BAR_CLEARANCE}px` } : undefined
            }
            className={`relative min-h-0 min-w-0 size-full ${isPresenterRole ? 'px-0 pb-0 pt-0 lg:px-0' : ''}`}
          >
            {isPresenterRole ? (
              <PresenterModeView
                currentSlide={currentSlide}
                nextSlide={nextSlide}
                slidesConfig={slidesConfig}
                canControl={canControl}
                remoteCursor={sessionState.remoteCursor}
                localCursor={sessionState.localCursor}
                setLocalCursor={sessionState.setLocalCursor}
                flow={flow}
                chrome={chrome}
                navigation={navigation}
              />
            ) : (
              <StandaloneModeView
                currentSlide={currentSlide}
                slidesConfig={slidesConfig}
                canControl={canControl}
                remoteCursor={sessionState.remoteCursor}
                setLocalCursor={sessionState.setLocalCursor}
                flow={flow}
              />
            )}
          </div>
          {isPresenterRole && chrome.timelinePreviewOpen && (
            <div
              className="absolute inset-x-4 z-30 flex justify-center"
              style={{ bottom: `${PRESENTER_BOTTOM_BAR_CLEARANCE + 16}px` }}
            >
              <FlowTimelinePreview
                slide={currentSlide}
                currentClicks={flow.currentClicks}
                currentClicksTotal={flow.currentClicksTotal}
                slidesConfig={slidesConfig}
                onJumpToCue={(cueIndex) => flow.setSlideClicks(currentSlide.id, cueIndex)}
                onClose={chrome.closeOverlay}
                className="w-full max-w-[min(920px,calc(100vw-2rem))] max-h-[min(60vh,700px)]"
              />
            </div>
          )}
          {!isPresenterRole && (
            <PresentationNavbar
              slideTitle={currentSlide.meta.title}
              currentIndex={navigation.currentIndex}
              total={navigation.total}
              canPrev={flow.canPrev}
              canNext={flow.canNext}
              showPresenterModeButton={session.role !== 'presenter'}
              overviewOpen={chrome.overviewOpen}
              notesOpen={chrome.notesOverviewOpen}
              shortcutsOpen={chrome.shortcutsHelpOpen}
              canOpenOverview={canOpenOverview}
              onEnterPresenterMode={session.role !== 'presenter' ? onEnterPresenterMode : undefined}
              onToggleOverview={chrome.toggleOverview}
              onToggleNotes={chrome.toggleNotes}
              onToggleShortcuts={chrome.toggleShortcuts}
              onPrev={flow.retreatReveal}
              onNext={flow.advanceReveal}
              canControl={canControl}
            />
          )}
          <QuickOverview
            open={chrome.overviewOpen && canOpenOverview}
            slides={slides}
            currentIndex={navigation.currentIndex}
            slidesConfig={slidesConfig}
            onClose={chrome.closeOverlay}
            onSelect={(index) => {
              if (!canControl) sessionState.detachFromPresenter()
              flow.goToSlideAtStart(index)
              chrome.closeOverlay()
            }}
          />
          <NotesOverview
            open={chrome.notesOverviewOpen && canControl}
            slides={slides}
            currentIndex={navigation.currentIndex}
            onClose={chrome.closeOverlay}
            onSelect={(index) => {
              flow.goToSlideAtStart(index)
              chrome.closeOverlay()
            }}
          />
          <ShortcutsHelpOverlay
            open={chrome.shortcutsHelpOpen}
            sections={chrome.shortcutHelpSections}
            onClose={chrome.closeOverlay}
          />
        </div>
      </DrawProvider>
    </PresenterContextProvider>
  )
}
