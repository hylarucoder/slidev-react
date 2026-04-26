import type { FullscreenRuntime } from '../presenter/platform/useFullscreen'
import type { WakeLockRuntime } from '../presenter/platform/useWakeLock'
import type { PresentationSession } from '../session'
import type { UsePresentationSyncResult } from '../sync'
import type { PresentationSyncMode } from '../types'
import type { CursorModeOption } from '../../../ui/tokens'
import { DisplayControlsRow } from './panels/DisplayControlsRow'
import { SessionInfoRow } from './panels/SessionInfoRow'
import { SyncControlsRow } from './panels/SyncControlsRow'

export interface StatusDetailsPanelProps {
  session: PresentationSession
  sync: UsePresentationSyncResult
  fullscreen: FullscreenRuntime
  wakeLock: WakeLockRuntime
  stageScale: number
  cursorMode: CursorModeOption
  timelinePreviewOpen: boolean
  canRecord: boolean
  onOpenMirrorStage?: () => void
  onOpenPrintExport?: () => void
  onToggleTimelinePreview: () => void
  onStageScaleChange: (value: number) => void
  onCursorModeChange: (value: CursorModeOption) => void
  onSyncModeChange?: (mode: PresentationSyncMode) => void
}

export function StatusDetailsPanel(props: StatusDetailsPanelProps) {
  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-full mb-2 border-t border-slate-200/80 bg-slate-50/72 px-3 py-3 text-slate-800 ring-1 ring-white/45 backdrop-blur-xl">
      <SyncControlsRow
        session={props.session}
        syncStatus={props.sync.status}
        timelinePreviewOpen={props.timelinePreviewOpen}
        fullscreen={props.fullscreen}
        wakeLock={props.wakeLock}
        canRecord={props.canRecord}
        onOpenMirrorStage={props.onOpenMirrorStage}
        onOpenPrintExport={props.onOpenPrintExport}
        onToggleTimelinePreview={props.onToggleTimelinePreview}
        onSyncModeChange={props.onSyncModeChange}
      />
      <DisplayControlsRow
        stageScale={props.stageScale}
        cursorMode={props.cursorMode}
        onStageScaleChange={props.onStageScaleChange}
        onCursorModeChange={props.onCursorModeChange}
      />
      <SessionInfoRow session={props.session} sync={props.sync} syncStatus={props.sync.status} />
    </div>
  )
}
