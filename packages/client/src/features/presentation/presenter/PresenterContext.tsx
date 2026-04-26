import { createContext, useContext, type ReactNode } from 'react'
import type { PresentationSession } from '../session'
import type { PresentationSyncMode } from '../types'
import type { FullscreenRuntime } from './platform/useFullscreen'
import type { WakeLockRuntime } from './platform/useWakeLock'
import type { CompiledSlide, SlidesConfig } from './model/types'
import type { PresenterFlowRuntime } from './runtime/usePresenterFlowRuntime'
import type { PresenterSessionState } from './runtime/usePresenterSessionRuntime'

export interface PresenterNavigation {
  currentIndex: number
  total: number
  goTo: (index: number) => void
}

export type PresenterChromeRuntime = {
  activeOverlay: 'quick-overview' | 'notes-overview' | 'timeline-preview' | 'shortcuts-help' | null
  stageScale: number
  cursorMode: 'always' | 'idle-hide'
  hideCursor: boolean
  presenterLayoutRef: React.RefObject<HTMLDivElement | null>
  presenterLayoutStyle: React.CSSProperties | undefined
  isResizingSidebar: boolean
  overviewOpen: boolean
  notesOverviewOpen: boolean
  shortcutsHelpOpen: boolean
  timelinePreviewOpen: boolean
  shortcutHelpSections: ReturnType<
    typeof import('../navigation/keyboardShortcuts').buildShortcutHelpSections
  >
  handleStageScaleChange: (value: number) => void
  handleCursorModeChange: (value: 'always' | 'idle-hide') => void
  handleSidebarResizeStart: (event: React.PointerEvent<HTMLDivElement>) => void
  handleSidebarResizeKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void
  setActiveOverlay: (value: PresenterChromeRuntime['activeOverlay']) => void
  toggleOverview: () => void
  toggleNotes: () => void
  toggleShortcuts: () => void
  toggleTimelinePreview: () => void
  closeOverlay: () => void
}

export interface PresenterContextValue {
  slides: CompiledSlide[]
  slidesTitle?: string
  slidesConfig: SlidesConfig
  slidesExportFilename?: string
  slidesSessionSeed: string
  session: PresentationSession
  navigation: PresenterNavigation
  flow: PresenterFlowRuntime
  chrome: PresenterChromeRuntime
  sessionState: PresenterSessionState
  wakeLock: WakeLockRuntime
  fullscreen: FullscreenRuntime
  canControl: boolean
  isPresenterRole: boolean
  canOpenOverview: boolean
  onOpenPrintExport: () => void
  onOpenMirrorStage: () => void
  onEnterPresenterMode: () => void
  onSyncModeChange: (mode: PresentationSyncMode) => void
  handleViewerAdvance: () => void
  handleViewerRetreat: () => void
  handleViewerFirst: () => void
  handleViewerLast: () => void
}

const PresenterContext = createContext<PresenterContextValue | null>(null)

export function PresenterContextProvider({
  value,
  children,
}: {
  value: PresenterContextValue
  children: ReactNode
}) {
  return <PresenterContext.Provider value={value}>{children}</PresenterContext.Provider>
}

export function usePresenterContext(): PresenterContextValue {
  const context = useContext(PresenterContext)
  if (!context) throw new Error('usePresenterContext must be used inside PresenterContextProvider')

  return context
}
