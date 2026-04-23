import { useCursorMode, type PresenterCursorMode } from './chrome/useCursorMode'
import {
  useOverlayController,
  type PresenterOverlay,
} from './chrome/useOverlayController'
import { useSidebarWidth } from './chrome/useSidebarWidth'
import { useStageScale } from './chrome/useStageScale'

export type { PresenterCursorMode, PresenterOverlay }

export function usePresenterChromeRuntime({
  canControl,
  canOpenOverview,
  isPresenterRole,
}: {
  canControl: boolean
  canOpenOverview: boolean
  isPresenterRole: boolean
}) {
  const stageScale = useStageScale()
  const cursorMode = useCursorMode({
    enabled: isPresenterRole && canControl,
  })
  const sidebar = useSidebarWidth()
  const overlays = useOverlayController({ canControl, canOpenOverview })

  return {
    activeOverlay: overlays.activeOverlay,
    stageScale: stageScale.stageScale,
    cursorMode: cursorMode.cursorMode,
    hideCursor: cursorMode.hideCursor,
    presenterLayoutRef: sidebar.presenterLayoutRef,
    presenterLayoutStyle: sidebar.presenterLayoutStyle,
    isResizingSidebar: sidebar.isResizing,
    overviewOpen: overlays.overviewOpen,
    notesOverviewOpen: overlays.notesOverviewOpen,
    shortcutsHelpOpen: overlays.shortcutsHelpOpen,
    timelinePreviewOpen: overlays.timelinePreviewOpen,
    shortcutHelpSections: overlays.shortcutHelpSections,
    handleStageScaleChange: stageScale.handleStageScaleChange,
    handleCursorModeChange: cursorMode.handleCursorModeChange,
    handleSidebarResizeStart: sidebar.handleResizeStart,
    handleSidebarResizeKeyDown: sidebar.handleResizeKeyDown,
    setActiveOverlay: overlays.setActiveOverlay,
    toggleOverview: () => {
      if (!canOpenOverview) return
      overlays.toggleOverlay('quick-overview')
    },
    toggleNotes: () => {
      if (!canControl) return
      overlays.toggleOverlay('notes-overview')
    },
    toggleShortcuts: () => overlays.toggleOverlay('shortcuts-help'),
    toggleTimelinePreview: () => overlays.toggleOverlay('timeline-preview'),
    closeOverlay: overlays.closeOverlay,
  }
}
