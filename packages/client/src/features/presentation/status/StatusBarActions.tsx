import { CircleDot, Keyboard, LayoutGrid, NotebookText, Radio, Square } from 'lucide-react'
import { ChromeIconButton } from '../../../ui/primitives/ChromeIconButton'
import { ChromeTag } from '../../../ui/primitives/ChromeTag'
import type { PresentationSyncStatus } from '../sync'
import type { PresentationRecorderRuntime } from '../recording/usePresentationRecorder'
import { formatSessionTimer, statusDotClassName } from './tone'

export interface StatusBarActionsProps {
  sessionTimerSeconds: number
  canRecord: boolean
  recorder: PresentationRecorderRuntime
  notesOpen: boolean
  overviewOpen: boolean
  shortcutsOpen: boolean
  detailsOpen: boolean
  canOpenOverview: boolean
  syncStatus: PresentationSyncStatus
  onToggleNotes: () => void
  onToggleOverview: () => void
  onToggleShortcuts: () => void
  onToggleDetails: () => void
}

export function StatusBarActions({
  sessionTimerSeconds,
  canRecord,
  recorder,
  notesOpen,
  overviewOpen,
  shortcutsOpen,
  detailsOpen,
  canOpenOverview,
  syncStatus,
  onToggleNotes,
  onToggleOverview,
  onToggleShortcuts,
  onToggleDetails,
}: StatusBarActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <ChromeTag
        tone="defaultStrong"
        size="md"
        weight="semibold"
        className="h-9 px-3.5 text-sm tabular-nums"
      >
        {formatSessionTimer(sessionTimerSeconds)}
      </ChromeTag>
      {canRecord && recorder.supported && (
        <ChromeIconButton
          onClick={() => {
            if (recorder.isRecording) void recorder.stop()
            else void recorder.start()
          }}
          title={recorder.isRecording ? 'Stop recording' : 'Start recording'}
          aria-label={recorder.isRecording ? 'Stop recording' : 'Start recording'}
          tone={recorder.isRecording ? 'danger' : 'default'}
        >
          {recorder.isRecording ? <Square size={14} /> : <CircleDot size={14} />}
        </ChromeIconButton>
      )}
      <ChromeIconButton
        onClick={onToggleNotes}
        title="Notes Workspace (N)"
        aria-label="Toggle notes workspace"
        tone={notesOpen ? 'active' : 'default'}
      >
        <NotebookText size={14} />
      </ChromeIconButton>
      <ChromeIconButton
        onClick={onToggleOverview}
        disabled={!canOpenOverview}
        title="Quick Overview (O)"
        aria-label="Toggle quick overview"
        tone={overviewOpen ? 'active' : 'default'}
      >
        <LayoutGrid size={14} />
      </ChromeIconButton>
      <ChromeIconButton
        onClick={onToggleShortcuts}
        title="Keyboard shortcuts (?)"
        aria-label="Toggle keyboard shortcuts"
        tone={shortcutsOpen ? 'active' : 'default'}
      >
        <Keyboard size={14} />
      </ChromeIconButton>
      <ChromeIconButton
        onClick={onToggleDetails}
        title={detailsOpen ? 'Hide live details' : 'Show live details'}
        aria-label={detailsOpen ? 'Hide live details' : 'Show live details'}
        tone={detailsOpen ? 'active' : 'default'}
      >
        <span className="relative inline-flex items-center justify-center">
          <Radio size={14} />
          <span
            className={`absolute right-0 bottom-0 size-2 rounded-full ring-2 ring-white ${statusDotClassName(syncStatus)}`}
          />
        </span>
      </ChromeIconButton>
    </div>
  )
}
