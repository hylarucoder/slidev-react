import { useCallback, useMemo } from 'react'
import type compiledSlides from '@generated/slides'
import { buildPrintExportUrl } from '@slidev-react/core/presentation/export/urls'
import { DrawKeyboardBridge } from './draw/DrawKeyboardBridge'
import { DrawProvider } from './draw/DrawProvider'
import { KeyboardController } from './navigation/KeyboardController'
import { ShortcutsHelpOverlay } from './navigation/ShortcutsHelpOverlay'
import { NotesOverview } from './overview/NotesOverview'
import { useSlidesNavigation } from './navigation/useSlidesNavigation'
import { QuickOverview } from './overview/QuickOverview'
import { buildPresentationEntryUrl, type PresentationSession } from './session'
import type { PresentationSyncMode } from './types'
import { RevealProvider } from './reveal/RevealContext'
import { PresentationEmptyState } from './modes/PresentationEmptyState'
import { PresenterMode } from './modes/PresenterMode'
import { ViewerMode } from './modes/ViewerMode'
import {
  PresenterContextProvider,
  type PresenterContextValue,
} from './presenter/PresenterContext'
import { usePresenterFlowRuntime } from './presenter/runtime/usePresenterFlowRuntime'
import { usePresenterChromeRuntime } from './presenter/runtime/usePresenterChromeRuntime'
import { usePresenterSessionRuntime } from './presenter/runtime/usePresenterSessionRuntime'
import { useWakeLock } from './presenter/platform/useWakeLock'
import { useFullscreen } from './presenter/platform/useFullscreen'

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
  if (slides.length === 0) return <PresentationEmptyState />
  const currentSlide = slides[navigation.currentIndex]
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
        storageKey={drawStorageKey}
        readOnly={!canControl}
        remoteStrokes={canControl ? null : sessionState.remoteDrawings}
        onStrokesChange={sessionState.onStrokesChange}
      >
        <DrawKeyboardBridge
          currentSlideId={currentSlide.id}
          readOnly={!canControl}
          overlayOpen={Boolean(chrome.activeOverlay)}
        />
        <div
          className={`relative grid h-dvh max-h-dvh grid-cols-1 grid-rows-[minmax(0,1fr)] overflow-hidden ${chrome.hideCursor ? 'cursor-none' : ''}`}
          style={{
            background: isPresenterRole ? 'var(--chrome-backdrop)' : '#000',
          }}
        >
          {isPresenterRole ? <PresenterMode /> : <ViewerMode />}

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
