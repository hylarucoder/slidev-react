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
  slideIndex?: number
  slideTotal?: number
  slideTitle?: string
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

function SlideContext({
  slideIndex,
  slideTotal,
  slideTitle,
}: {
  slideIndex?: number
  slideTotal?: number
  slideTitle?: string
}) {
  if (slideIndex === undefined || slideTotal === undefined) return null

  return (
    <div className="flex min-w-0 items-center gap-2 text-xs chrome-fg-subtle">
      <span className="font-semibold tabular-nums chrome-fg">
        {slideIndex + 1}
        <span className="chrome-fg-subtle"> / {slideTotal}</span>
      </span>
      {slideTitle && <span className="truncate">{slideTitle}</span>}
    </div>
  )
}

export function StatusBar({
  slideId,
  slideIndex,
  slideTotal,
  slideTitle,
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
  const diagnosticMessages = [
    canRecord && !recorder.supported && {
      tone: 'amber' as const,
      message: 'Recording unsupported in this browser.',
    },
    recorder.error && { tone: 'rose' as const, message: recorder.error },
    wakeLock.error && { tone: 'amber' as const, message: wakeLock.error },
  ].filter(
    (entry): entry is { tone: 'amber' | 'rose'; message: string } => Boolean(entry),
  )

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
        <div
          className="pointer-events-auto w-full overflow-hidden rounded-t-[6px] border border-b-0 ring-1 ring-white/45 backdrop-blur-xl"
          style={{
            background: 'var(--chrome-surface)',
            color: 'var(--chrome-fg)',
            borderColor: 'var(--chrome-border)',
          }}
        >
          {diagnosticMessages.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 border-b chrome-border px-3 py-1.5 text-xs">
              {diagnosticMessages.map((entry, index) => (
                <span
                  key={`${entry.tone}-${index}`}
                  className={entry.tone === 'rose' ? 'text-rose-700' : 'text-amber-700'}
                >
                  {entry.message}
                </span>
              ))}
            </div>
          )}
          <div className="grid items-center gap-3 px-3 py-3 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {canRecord && <StatusBarDrawToolbar slideId={slideId} />}
            </div>
            <div className="flex justify-center">
              <SlideContext
                slideIndex={slideIndex}
                slideTotal={slideTotal}
                slideTitle={slideTitle}
              />
            </div>
            <div className="flex justify-end">
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
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
