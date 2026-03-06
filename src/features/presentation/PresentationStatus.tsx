import { ChevronDown, ChevronUp, Circle, CircleDot, Copy, Eraser, Link2, PenLine, Radio, RectangleHorizontal, RotateCcw, Square, Trash2, Wifi, WifiOff } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDraw } from '../draw/DrawProvider'
import type { PresentationSession } from './session'
import type { PresentationSyncMode } from './types'
import type { PresentationSyncStatus } from './usePresentationSync'

const DRAW_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#111827']
const DRAW_WIDTHS = [3, 5, 8]

function dockButtonClassName(active?: boolean) {
  if (active)
    return 'inline-flex size-9 items-center justify-center rounded-[5px] border border-sky-200 bg-sky-50 text-sky-700 transition-colors'

  return 'inline-flex size-9 items-center justify-center rounded-[5px] border border-slate-200 bg-white/88 text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45'
}

function badgeClassName(status: PresentationSyncStatus) {
  switch (status) {
    case 'connected':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'degraded':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    case 'connecting':
      return 'border-blue-200 bg-blue-50 text-blue-700'
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700'
  }
}

function statusDotClassName(status: PresentationSyncStatus) {
  switch (status) {
    case 'connected':
      return 'bg-emerald-400'
    case 'degraded':
      return 'bg-amber-400'
    case 'connecting':
      return 'bg-sky-400'
    default:
      return 'bg-slate-400'
  }
}

function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

function formatTimer(seconds: number) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0')
  const restSeconds = String(seconds % 60).padStart(2, '0')
  return `${minutes}:${restSeconds}`
}

export function PresentationStatus({
  slideId,
  session,
  status,
  broadcastConnected,
  wsConnected,
  lastSyncedAt,
  peerCount,
  remoteActive,
  sessionTimerSeconds,
  canRecord,
  recordingSupported,
  isRecording,
  recordingElapsedMs,
  recordingError,
  onStartRecording,
  onStopRecording,
  onSyncModeChange,
}: {
  slideId: string
  session: PresentationSession
  status: PresentationSyncStatus
  broadcastConnected: boolean
  wsConnected: boolean
  lastSyncedAt: number | null
  peerCount: number
  remoteActive: boolean
  sessionTimerSeconds: number
  canRecord: boolean
  recordingSupported: boolean
  isRecording: boolean
  recordingElapsedMs: number
  recordingError: string | null
  onStartRecording: () => void
  onStopRecording: () => void
  onSyncModeChange?: (mode: PresentationSyncMode) => void
}) {
  const draw = useDraw()
  const [copiedTarget, setCopiedTarget] = useState<'viewer' | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const strokeCount = draw.strokesBySlideId[slideId]?.length ?? 0
  const hasStrokes = strokeCount > 0

  const statusLabel = useMemo(() => {
    switch (status) {
      case 'connected':
        return 'Connected'
      case 'connecting':
        return 'Connecting'
      case 'degraded':
        return 'Degraded'
      default:
        return 'Disabled'
    }
  }, [status])

  if (!session.enabled || !session.sessionId)
    return null

  const canCopyViewerLink = session.role === 'presenter' && !!session.viewerUrl

  return (
    <aside className="pointer-events-none absolute inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-[min(1120px,calc(100vw-2rem))] overflow-hidden rounded-[8px] border border-slate-200/80 bg-white/82 text-slate-800 shadow-[0_24px_70px_rgba(148,163,184,0.24)] ring-1 ring-white/45 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {canRecord && (
              <>
                <button
                  type="button"
                  onClick={draw.toggleEnabled}
                  title="Toggle draw (D)"
                  aria-label="Toggle draw mode"
                  className={dockButtonClassName(draw.enabled)}
                >
                  <PenLine size={16} />
                </button>
                {draw.enabled && (
                  <>
                    <button
                      type="button"
                      onClick={() => draw.setTool('pen')}
                      title="Pen (P)"
                      aria-label="Use pen tool"
                      className={dockButtonClassName(draw.tool === 'pen')}
                    >
                      <PenLine size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => draw.setTool('circle')}
                      title="Circle (B)"
                      aria-label="Use circle tool"
                      className={dockButtonClassName(draw.tool === 'circle')}
                    >
                      <Circle size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => draw.setTool('rectangle')}
                      title="Rectangle (R)"
                      aria-label="Use rectangle tool"
                      className={dockButtonClassName(draw.tool === 'rectangle')}
                    >
                      <RectangleHorizontal size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => draw.setTool('eraser')}
                      title="Eraser (E)"
                      aria-label="Use eraser tool"
                      className={dockButtonClassName(draw.tool === 'eraser')}
                    >
                      <Eraser size={15} />
                    </button>
                    <div className="mx-1 h-6 w-px bg-slate-200" aria-hidden />
                    {DRAW_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          draw.setColor(color)
                          draw.setTool('pen')
                        }}
                        title={`Set draw color ${color}`}
                        aria-label={`Set draw color ${color}`}
                        className={`inline-flex size-5 items-center justify-center rounded-full border shadow-sm transition ${draw.color === color ? 'border-slate-700 ring-2 ring-sky-300' : 'border-slate-300 opacity-90 hover:opacity-100'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <div className="mx-1 h-6 w-px bg-slate-200" aria-hidden />
                    {DRAW_WIDTHS.map(value => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          draw.setWidth(value)
                          draw.setTool('pen')
                        }}
                        title={`Set brush size ${value}`}
                        aria-label={`Set brush size ${value}`}
                        className={dockButtonClassName(draw.width === value)}
                      >
                        <span
                          className="rounded-full bg-current"
                          style={{
                            width: `${Math.max(value + 2, 6)}px`,
                            height: `${Math.max(value + 2, 6)}px`,
                          }}
                        />
                      </button>
                    ))}
                    <div className="mx-1 h-6 w-px bg-slate-200" aria-hidden />
                    <button
                      type="button"
                      onClick={() => draw.undo(slideId)}
                      disabled={!hasStrokes}
                      title="Undo last stroke (Cmd/Ctrl+Z)"
                      aria-label="Undo last stroke"
                      className={dockButtonClassName()}
                    >
                      <RotateCcw size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => draw.clear(slideId)}
                      disabled={!hasStrokes}
                      title="Clear page strokes (C)"
                      aria-label="Clear page strokes"
                      className={dockButtonClassName()}
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="inline-flex items-center gap-2 rounded-[5px] border border-slate-200 bg-white/88 px-3 py-1.5 text-sm font-semibold text-slate-800">
              <Radio size={13} />
              {formatTimer(sessionTimerSeconds)}
            </span>
            {canRecord && recordingSupported && (
              <button
                type="button"
                onClick={() => {
                  if (isRecording)
                    onStopRecording()
                  else
                    onStartRecording()
                }}
                className={`inline-flex items-center justify-center gap-1.5 rounded-[5px] border px-3 py-1.5 text-xs font-semibold transition ${isRecording ? 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100' : 'border-slate-200 bg-white/88 text-slate-700 hover:bg-white'}`}
              >
                {isRecording ? <Square size={12} /> : <CircleDot size={12} />}
                {isRecording ? formatElapsed(recordingElapsedMs) : 'Record'}
              </button>
            )}
            <button
              type="button"
              onClick={() => setDetailsOpen(value => !value)}
              className="inline-flex items-center justify-center gap-1.5 rounded-[5px] border border-slate-200 bg-white/88 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-white"
            >
              <span className={`size-2 rounded-full ${statusDotClassName(status)}`} />
              {detailsOpen ? 'Hide' : 'Live'}
              {detailsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
          {canRecord && !recordingSupported && (
            <span className="text-xs text-amber-700">Recording unsupported in this browser.</span>
          )}
          {recordingError && (
            <span className="text-xs text-rose-700">{recordingError}</span>
          )}
        </div>
        {detailsOpen && (
          <div className="border-t border-slate-200/80 bg-slate-50/72 px-3 py-3">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-[5px] border border-slate-200 bg-white/88 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                <span className={`size-2.5 rounded-full ${statusDotClassName(status)}`} />
                Live
                <span className={`rounded-[4px] border px-2 py-0.5 text-[10px] font-medium normal-case tracking-normal ${badgeClassName(status)}`}>
                  {statusLabel}
                </span>
              </span>
              <label className="inline-flex items-center gap-2 rounded-[5px] border border-slate-200 bg-white/88 px-3 py-1.5 text-xs font-medium text-slate-700">
                sync
                <select
                  value={session.syncMode}
                  onChange={(event) => {
                    onSyncModeChange?.(event.target.value as PresentationSyncMode)
                  }}
                  className="rounded-[5px] border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 outline-none"
                >
                  <option value="send">send</option>
                  <option value="receive">receive</option>
                  <option value="both">both</option>
                  <option value="off">off</option>
                </select>
              </label>
              {canCopyViewerLink && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!session.viewerUrl)
                      return

                    try {
                      await navigator.clipboard.writeText(session.viewerUrl)
                      setCopiedTarget('viewer')
                      window.setTimeout(() => setCopiedTarget((value) => (value === 'viewer' ? null : value)), 1200)
                    }
                    catch {
                      setCopiedTarget(null)
                    }
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-[5px] border border-slate-200 bg-white/88 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-white"
                >
                  {copiedTarget === 'viewer' ? <Copy size={12} /> : <Link2 size={12} />}
                  {copiedTarget === 'viewer' ? 'Viewer copied' : 'Copy viewer link'}
                </button>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <span className="inline-flex items-center gap-2 rounded-[5px] border border-slate-200 bg-white/82 px-3 py-2 text-xs text-slate-600">
                {broadcastConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
                {broadcastConnected ? 'Broadcast connected' : 'Broadcast unavailable'}
              </span>
              <span className="inline-flex items-center gap-2 rounded-[5px] border border-slate-200 bg-white/82 px-3 py-2 text-xs text-slate-600">
                ws: {wsConnected ? 'connected' : 'idle'}
              </span>
              <span className="inline-flex items-center gap-2 rounded-[5px] border border-slate-200 bg-white/82 px-3 py-2 text-xs text-slate-600">
                peers: {peerCount}
              </span>
              <span className={`inline-flex items-center gap-2 rounded-[5px] border border-slate-200 bg-white/82 px-3 py-2 text-xs ${remoteActive ? 'text-emerald-700' : 'text-amber-700'}`}>
                remote: {remoteActive ? 'active' : 'stale'}
              </span>
              <span className="inline-flex items-center gap-2 rounded-[5px] border border-slate-200 bg-white/82 px-3 py-2 text-xs text-slate-600">
                role: {session.role}
              </span>
              <span className="inline-flex items-center gap-2 rounded-[5px] border border-slate-200 bg-white/82 px-3 py-2 font-mono text-[11px] text-slate-500">
                {session.sessionId}
              </span>
            </div>
            {lastSyncedAt && (
              <p className="mt-3 text-right text-[11px] text-slate-500">
                last sync {new Date(lastSyncedAt).toLocaleTimeString()}
              </p>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
