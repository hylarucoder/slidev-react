import { useState } from 'react'
import type { FullscreenRuntime } from '../presenter/platform/useFullscreen'
import type { WakeLockRuntime } from '../presenter/platform/useWakeLock'
import type { PresentationSession } from '../session'
import type { UsePresentationSyncResult } from '../sync'
import type { PresentationSyncMode } from '../types'
import type { CursorModeOption } from '../../../ui/tokens'
import type { PresentationRecorderRuntime } from '../recording/useRecorderRuntime'
import { StatusBarActions } from './StatusBarActions'
import { StatusBarDrawToolbar } from './StatusBarDrawToolbar'
import { StatusDetailsPanel } from './StatusDetailsPanel'

export interface StatusBarChrome {
  stageScale: number
  cursorMode: CursorModeOption
  timelinePreviewOpen: boolean
  overviewOpen: boolean
  notesOpen: boolean
  shortcutsOpen: boolean
  canOpenOverview: boolean
  onToggleTimelinePreview: () => void
  onToggleOverview: () => void
  onToggleNotes: () => void
  onToggleShortcuts: () => void
  onStageScaleChange: (value: number) => void
  onCursorModeChange: (value: CursorModeOption) => void
}

export interface StatusBarProps {
  slideId: string
  session: PresentationSession
  sync: UsePresentationSyncResult
  recorder: PresentationRecorderRuntime
  wakeLock: WakeLockRuntime
  fullscreen: FullscreenRuntime
  chrome: StatusBarChrome
  sessionTimerSeconds: number
  canRecord: boolean
  onOpenMirrorStage?: () => void
  onOpenPrintExport?: () => void
  onSyncModeChange?: (mode: PresentationSyncMode) => void
}

export function StatusBar({
  slideId,
  session,
  sync,
  recorder,
  wakeLock,
  fullscreen,
  chrome,
  sessionTimerSeconds,
  canRecord,
  onOpenMirrorStage,
  onOpenPrintExport,
  onSyncModeChange,
}: StatusBarProps) {
  const [detailsOpen, setDetailsOpen] = useState(false)

  if (!session.enabled || !session.sessionId) return null

  return (
    <aside className="pointer-events-none absolute inset-x-0 bottom-0 z-40">
      <div className="relative">
        {detailsOpen && (
          <StatusDetailsPanel
            session={session}
            sync={sync}
            fullscreen={fullscreen}
            wakeLock={wakeLock}
            stageScale={chrome.stageScale}
            cursorMode={chrome.cursorMode}
            timelinePreviewOpen={chrome.timelinePreviewOpen}
            canRecord={canRecord}
            onOpenMirrorStage={onOpenMirrorStage}
            onOpenPrintExport={onOpenPrintExport}
            onToggleTimelinePreview={chrome.onToggleTimelinePreview}
            onStageScaleChange={chrome.onStageScaleChange}
            onCursorModeChange={chrome.onCursorModeChange}
            onSyncModeChange={onSyncModeChange}
          />
        )}
        <div className="pointer-events-auto w-full overflow-hidden rounded-t-[6px] border border-b-0 border-slate-200/80 bg-white/82 text-slate-800 ring-1 ring-white/45 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              {canRecord && <StatusBarDrawToolbar slideId={slideId} />}
            </div>
            <StatusBarActions
              sessionTimerSeconds={sessionTimerSeconds}
              canRecord={canRecord}
              recorder={recorder}
              notesOpen={chrome.notesOpen}
              overviewOpen={chrome.overviewOpen}
              shortcutsOpen={chrome.shortcutsOpen}
              detailsOpen={detailsOpen}
              canOpenOverview={chrome.canOpenOverview}
              syncStatus={sync.status}
              onToggleNotes={chrome.onToggleNotes}
              onToggleOverview={chrome.onToggleOverview}
              onToggleShortcuts={chrome.onToggleShortcuts}
              onToggleDetails={() => setDetailsOpen((v) => !v)}
            />
            {canRecord && !recorder.supported && (
              <span className="text-xs text-amber-700">Recording unsupported in this browser.</span>
            )}
            {recorder.error && <span className="text-xs text-rose-700">{recorder.error}</span>}
            {wakeLock.error && <span className="text-xs text-amber-700">{wakeLock.error}</span>}
          </div>
        </div>
      </div>
    </aside>
  )
}
