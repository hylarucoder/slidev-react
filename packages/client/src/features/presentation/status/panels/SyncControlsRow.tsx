import { useState } from 'react'
import { Copy, Expand, Link2, List, Printer, SunMedium } from 'lucide-react'
import { ChromeButton } from '../../../../ui/primitives/ChromeButton'
import { ChromeTag } from '../../../../ui/primitives/ChromeTag'
import { ChromeToggleGroup } from '../../../../ui/primitives/ChromeToggleGroup'
import type { FullscreenRuntime } from '../../presenter/platform/useFullscreen'
import type { WakeLockRuntime } from '../../presenter/platform/useWakeLock'
import type { PresentationSession } from '../../session'
import type { PresentationSyncStatus } from '../../sync'
import type { PresentationSyncMode } from '../../types'
import { statusBadgeClassName, statusDotClassName, statusLabelOf } from '../tone'

export interface SyncControlsRowProps {
  session: PresentationSession
  syncStatus: PresentationSyncStatus
  timelinePreviewOpen: boolean
  fullscreen: FullscreenRuntime
  wakeLock: WakeLockRuntime
  canRecord: boolean
  onOpenMirrorStage?: () => void
  onOpenPrintExport?: () => void
  onToggleTimelinePreview: () => void
  onSyncModeChange?: (mode: PresentationSyncMode) => void
}

const SYNC_MODE_OPTIONS = [
  { value: 'send', label: 'send' },
  { value: 'receive', label: 'receive' },
  { value: 'both', label: 'both' },
  { value: 'off', label: 'off' },
] as const satisfies ReadonlyArray<{ value: PresentationSyncMode; label: string }>

export function SyncControlsRow({
  session,
  syncStatus,
  timelinePreviewOpen,
  fullscreen,
  wakeLock,
  canRecord,
  onOpenMirrorStage,
  onOpenPrintExport,
  onToggleTimelinePreview,
  onSyncModeChange,
}: SyncControlsRowProps) {
  const [copiedViewer, setCopiedViewer] = useState(false)
  const canCopyViewerLink = session.role === 'presenter' && !!session.viewerUrl

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <ChromeTag size="md" weight="semibold" className="uppercase tracking-[0.18em]">
        <span className={`size-2.5 rounded-full ${statusDotClassName(syncStatus)}`} />
        Live
        <span
          className={`rounded-[4px] border px-2 py-0.5 text-[10px] font-medium normal-case tracking-normal ${statusBadgeClassName(syncStatus)}`}
        >
          {statusLabelOf(syncStatus)}
        </span>
      </ChromeTag>
      <ChromeToggleGroup
        label="sync"
        size="sm"
        value={session.syncMode}
        options={SYNC_MODE_OPTIONS}
        onChange={(value) => onSyncModeChange?.(value)}
      />
      {canCopyViewerLink && (
        <ChromeButton
          size="sm"
          leading={copiedViewer ? <Copy size={12} /> : <Link2 size={12} />}
          onClick={async () => {
            if (!session.viewerUrl) return
            try {
              await navigator.clipboard.writeText(session.viewerUrl)
              setCopiedViewer(true)
              window.setTimeout(() => setCopiedViewer(false), 1200)
            } catch {
              setCopiedViewer(false)
            }
          }}
        >
          {copiedViewer ? 'Viewer copied' : 'Copy viewer link'}
        </ChromeButton>
      )}
      {onOpenMirrorStage && (
        <ChromeButton size="sm" leading={<Link2 size={12} />} onClick={onOpenMirrorStage}>
          Open mirror stage
        </ChromeButton>
      )}
      {canRecord && onOpenPrintExport && (
        <ChromeButton size="sm" leading={<Printer size={12} />} onClick={onOpenPrintExport}>
          Print / PDF
        </ChromeButton>
      )}
      <ChromeButton
        size="sm"
        tone={timelinePreviewOpen ? 'violet' : 'default'}
        leading={<List size={12} />}
        onClick={onToggleTimelinePreview}
      >
        Timeline
      </ChromeButton>
      <ChromeButton
        size="sm"
        tone={fullscreen.supported && fullscreen.active ? 'success' : 'default'}
        leading={<Expand size={12} />}
        disabled={!fullscreen.supported}
        onClick={() => {
          void fullscreen.toggle()
        }}
      >
        {fullscreen.supported
          ? fullscreen.active
            ? 'Fullscreen on'
            : 'Fullscreen'
          : 'Fullscreen unavailable'}
      </ChromeButton>
      <ChromeButton
        size="sm"
        tone={wakeLock.supported && wakeLock.active ? 'success' : 'default'}
        leading={<SunMedium size={12} />}
        disabled={!wakeLock.supported}
        onClick={() => {
          void wakeLock.toggle()
        }}
      >
        {wakeLock.supported
          ? wakeLock.active
            ? 'Wake lock on'
            : 'Wake lock'
          : 'Wake lock unavailable'}
      </ChromeButton>
    </div>
  )
}
