import { useState } from 'react'
import { Copy, Expand, Link2, List, Printer, SunMedium } from 'lucide-react'
import { ChromeTag } from '../../../../ui/primitives/ChromeTag'
import { FormSelect } from '../../../../ui/primitives/FormSelect'
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
      <FormSelect
        label="sync"
        size="sm"
        value={session.syncMode}
        onChange={(event) => {
          onSyncModeChange?.(event.target.value as PresentationSyncMode)
        }}
      >
        <option value="send">send</option>
        <option value="receive">receive</option>
        <option value="both">both</option>
        <option value="off">off</option>
      </FormSelect>
      {canCopyViewerLink && (
        <button
          type="button"
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
          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white/88 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-white"
        >
          {copiedViewer ? <Copy size={12} /> : <Link2 size={12} />}
          {copiedViewer ? 'Viewer copied' : 'Copy viewer link'}
        </button>
      )}
      {onOpenMirrorStage && (
        <button
          type="button"
          onClick={onOpenMirrorStage}
          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white/88 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-white"
        >
          <Link2 size={12} />
          Open mirror stage
        </button>
      )}
      {canRecord && onOpenPrintExport && (
        <button
          type="button"
          onClick={onOpenPrintExport}
          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white/88 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-white"
        >
          <Printer size={12} />
          Print / PDF
        </button>
      )}
      <button
        type="button"
        onClick={onToggleTimelinePreview}
        className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition ${
          timelinePreviewOpen
            ? 'border-violet-300 bg-violet-50 text-violet-700'
            : 'border-slate-200 bg-white/88 text-slate-700 hover:bg-white'
        }`}
      >
        <List size={12} />
        Timeline
      </button>
      <button
        type="button"
        onClick={() => {
          void fullscreen.toggle()
        }}
        disabled={!fullscreen.supported}
        className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
          fullscreen.supported && fullscreen.active
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
            : 'border-slate-200 bg-white/88 text-slate-700 hover:bg-white'
        }`}
      >
        <Expand size={12} />
        {fullscreen.supported
          ? fullscreen.active
            ? 'Fullscreen on'
            : 'Fullscreen'
          : 'Fullscreen unavailable'}
      </button>
      <button
        type="button"
        onClick={() => {
          void wakeLock.toggle()
        }}
        disabled={!wakeLock.supported}
        className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
          wakeLock.supported && wakeLock.active
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
            : 'border-slate-200 bg-white/88 text-slate-700 hover:bg-white'
        }`}
      >
        <SunMedium size={12} />
        {wakeLock.supported
          ? wakeLock.active
            ? 'Wake lock on'
            : 'Wake lock'
          : 'Wake lock unavailable'}
      </button>
    </div>
  )
}
