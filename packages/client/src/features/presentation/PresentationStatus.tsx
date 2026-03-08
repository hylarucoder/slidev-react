import {
  Circle,
  CircleDot,
  Copy,
  Eraser,
  Expand,
  Keyboard,
  LayoutGrid,
  List,
  Link2,
  NotebookText,
  PenLine,
  Printer,
  Radio,
  RectangleHorizontal,
  RotateCcw,
  Square,
  SunMedium,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useDraw } from "./draw/DrawProvider";
import type { PresentationSession } from "./session";
import type { PresentationSyncMode } from "./types";
import type { PresentationSyncStatus } from "./usePresentationSync";
import { ChromeIconButton } from "../../ui/primitives/ChromeIconButton";
import { ChromeTag } from "../../ui/primitives/ChromeTag";
import { FormSelect } from "../../ui/primitives/FormSelect";

const DRAW_COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#111827"];
const DRAW_WIDTHS = [3, 5, 8];

function badgeClassName(status: PresentationSyncStatus) {
  switch (status) {
    case "connected":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "degraded":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "connecting":
      return "border-green-200 bg-green-50 text-green-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function statusDotClassName(status: PresentationSyncStatus) {
  switch (status) {
    case "connected":
      return "bg-emerald-400";
    case "degraded":
      return "bg-amber-400";
    case "connecting":
      return "bg-green-400";
    default:
      return "bg-slate-400";
  }
}

function formatTimer(seconds: number) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const restSeconds = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${restSeconds}`;
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
  recordingError,
  wakeLockSupported,
  wakeLockRequested,
  wakeLockActive,
  wakeLockError,
  fullscreenSupported,
  fullscreenActive,
  stageScale,
  cursorMode,
  timelinePreviewOpen,
  overviewOpen,
  notesOpen,
  shortcutsOpen,
  canOpenOverview,
  onStartRecording,
  onStopRecording,
  onToggleWakeLock,
  onToggleFullscreen,
  onToggleTimelinePreview,
  onToggleOverview,
  onToggleNotes,
  onToggleShortcuts,
  onStageScaleChange,
  onCursorModeChange,
  onOpenMirrorStage,
  onOpenPrintExport,
  onSyncModeChange,
}: {
  slideId: string;
  session: PresentationSession;
  status: PresentationSyncStatus;
  broadcastConnected: boolean;
  wsConnected: boolean;
  lastSyncedAt: number | null;
  peerCount: number;
  remoteActive: boolean;
  sessionTimerSeconds: number;
  canRecord: boolean;
  recordingSupported: boolean;
  isRecording: boolean;
  recordingError: string | null;
  wakeLockSupported: boolean;
  wakeLockRequested: boolean;
  wakeLockActive: boolean;
  wakeLockError: string | null;
  fullscreenSupported: boolean;
  fullscreenActive: boolean;
  stageScale: number;
  cursorMode: "always" | "idle-hide";
  timelinePreviewOpen: boolean;
  overviewOpen: boolean;
  notesOpen: boolean;
  shortcutsOpen: boolean;
  canOpenOverview: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onToggleWakeLock: () => void;
  onToggleFullscreen: () => void;
  onToggleTimelinePreview: () => void;
  onToggleOverview: () => void;
  onToggleNotes: () => void;
  onToggleShortcuts: () => void;
  onStageScaleChange: (value: number) => void;
  onCursorModeChange: (value: "always" | "idle-hide") => void;
  onOpenMirrorStage?: () => void;
  onOpenPrintExport?: () => void;
  onSyncModeChange?: (mode: PresentationSyncMode) => void;
}) {
  const draw = useDraw();
  const [copiedTarget, setCopiedTarget] = useState<"viewer" | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const strokeCount = draw.strokesBySlideId[slideId]?.length ?? 0;
  const hasStrokes = strokeCount > 0;

  const statusLabel = useMemo(() => {
    switch (status) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting";
      case "degraded":
        return "Degraded";
      default:
        return "Disabled";
    }
  }, [status]);

  if (!session.enabled || !session.sessionId) return null;

  const canCopyViewerLink = session.role === "presenter" && !!session.viewerUrl;

  return (
    <aside className="pointer-events-none absolute inset-x-0 bottom-0 z-40">
      <div className="relative">
        {detailsOpen && (
          <div className="pointer-events-auto absolute inset-x-0 bottom-full mb-2 border-t border-slate-200/80 bg-slate-50/72 px-3 py-3 text-slate-800  ring-1 ring-white/45 backdrop-blur-xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <ChromeTag size="md" weight="semibold" className="uppercase tracking-[0.18em]">
                <span className={`size-2.5 rounded-full ${statusDotClassName(status)}`} />
                Live
                <span
                  className={`rounded-[4px] border px-2 py-0.5 text-[10px] font-medium normal-case tracking-normal ${badgeClassName(status)}`}
                >
                  {statusLabel}
                </span>
              </ChromeTag>
              <FormSelect
                label="sync"
                size="sm"
                value={session.syncMode}
                onChange={(event) => {
                  onSyncModeChange?.(event.target.value as PresentationSyncMode);
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
                    if (!session.viewerUrl) return;

                    try {
                      await navigator.clipboard.writeText(session.viewerUrl);
                      setCopiedTarget("viewer");
                      window.setTimeout(
                        () => setCopiedTarget((value) => (value === "viewer" ? null : value)),
                        1200,
                      );
                    } catch {
                      setCopiedTarget(null);
                    }
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white/88 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-white"
                >
                  {copiedTarget === "viewer" ? <Copy size={12} /> : <Link2 size={12} />}
                  {copiedTarget === "viewer" ? "Viewer copied" : "Copy viewer link"}
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
            </div>
            <div className="mb-3 grid gap-2 sm:grid-cols-2">
              <FormSelect
                label="stage scale"
                size="sm"
                value={String(stageScale)}
                onChange={(event) => {
                  onStageScaleChange(Number(event.target.value));
                }}
              >
                <option value="0.9">90%</option>
                <option value="1">100%</option>
                <option value="1.08">108%</option>
              </FormSelect>
              <FormSelect
                label="cursor"
                size="sm"
                value={cursorMode}
                onChange={(event) => {
                  onCursorModeChange(event.target.value as "always" | "idle-hide");
                }}
              >
                <option value="always">always visible</option>
                <option value="idle-hide">hide when idle</option>
              </FormSelect>
              <span
                className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${
                  fullscreenSupported
                    ? fullscreenActive
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white/82 text-slate-600"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                fullscreen:{" "}
                {fullscreenSupported ? (fullscreenActive ? "active" : "off") : "unsupported"}
              </span>
              <span
                className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${
                  wakeLockSupported
                    ? wakeLockActive
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white/82 text-slate-600"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                wake lock:{" "}
                {wakeLockSupported
                  ? wakeLockRequested || wakeLockActive
                    ? wakeLockActive
                      ? "active"
                      : "requesting"
                    : "off"
                  : "unsupported"}
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <ChromeTag tone="muted" size="md" className="py-2 text-xs">
                {broadcastConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
                {broadcastConnected ? "Broadcast connected" : "Broadcast unavailable"}
              </ChromeTag>
              <ChromeTag tone="muted" size="md" className="py-2 text-xs">
                ws: {wsConnected ? "connected" : "idle"}
              </ChromeTag>
              <ChromeTag tone="muted" size="md" className="py-2 text-xs tabular-nums">
                peers: {peerCount}
              </ChromeTag>
              <ChromeTag
                tone={remoteActive ? "success" : "warning"}
                size="md"
                className="py-2 text-xs"
              >
                remote: {remoteActive ? "active" : "stale"}
              </ChromeTag>
              <ChromeTag tone="muted" size="md" className="py-2 text-xs">
                role: {session.role}
              </ChromeTag>
              <ChromeTag tone="muted" size="md" className="py-2 font-mono text-[11px]">
                {session.sessionId}
              </ChromeTag>
            </div>
            {lastSyncedAt && (
              <p className="mt-3 text-right text-[11px] text-slate-500">
                last sync {new Date(lastSyncedAt).toLocaleTimeString()}
              </p>
            )}
          </div>
        )}
        <div className="pointer-events-auto w-full overflow-hidden rounded-t-[6px] border border-b-0 border-slate-200/80 bg-white/82 text-slate-800  ring-1 ring-white/45 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              {canRecord && (
                <>
                  <ChromeIconButton
                    onClick={draw.toggleEnabled}
                    title="Toggle draw (D)"
                    aria-label="Toggle draw mode"
                    tone={draw.enabled ? "active" : "default"}
                  >
                    <PenLine size={16} />
                  </ChromeIconButton>
                  {draw.enabled && (
                    <>
                      <ChromeIconButton
                        onClick={() => draw.setTool("pen")}
                        title="Pen (P)"
                        aria-label="Use pen tool"
                        tone={draw.tool === "pen" ? "active" : "default"}
                      >
                        <PenLine size={15} />
                      </ChromeIconButton>
                      <ChromeIconButton
                        onClick={() => draw.setTool("circle")}
                        title="Circle (B)"
                        aria-label="Use circle tool"
                        tone={draw.tool === "circle" ? "active" : "default"}
                      >
                        <Circle size={15} />
                      </ChromeIconButton>
                      <ChromeIconButton
                        onClick={() => draw.setTool("rectangle")}
                        title="Rectangle (R)"
                        aria-label="Use rectangle tool"
                        tone={draw.tool === "rectangle" ? "active" : "default"}
                      >
                        <RectangleHorizontal size={15} />
                      </ChromeIconButton>
                      <ChromeIconButton
                        onClick={() => draw.setTool("eraser")}
                        title="Eraser (E)"
                        aria-label="Use eraser tool"
                        tone={draw.tool === "eraser" ? "active" : "default"}
                      >
                        <Eraser size={15} />
                      </ChromeIconButton>
                      <div className="mx-1 h-6 w-px bg-slate-200" aria-hidden />
                      {DRAW_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            draw.setColor(color);
                            draw.setTool("pen");
                          }}
                          title={`Set draw color ${color}`}
                          aria-label={`Set draw color ${color}`}
                          className={`inline-flex size-5 items-center justify-center rounded-full border shadow-sm transition ${draw.color === color ? "border-slate-700 ring-2 ring-emerald-300" : "border-slate-300 opacity-90 hover:opacity-100"}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      <div className="mx-1 h-6 w-px bg-slate-200" aria-hidden />
                      {DRAW_WIDTHS.map((value) => (
                        <ChromeIconButton
                          key={value}
                          onClick={() => {
                            draw.setWidth(value);
                            draw.setTool("pen");
                          }}
                          title={`Set brush size ${value}`}
                          aria-label={`Set brush size ${value}`}
                          tone={draw.width === value ? "active" : "default"}
                        >
                          <span
                            className="rounded-full bg-current"
                            style={{
                              width: `${Math.max(value + 2, 6)}px`,
                              height: `${Math.max(value + 2, 6)}px`,
                            }}
                          />
                        </ChromeIconButton>
                      ))}
                      <div className="mx-1 h-6 w-px bg-slate-200" aria-hidden />
                      <ChromeIconButton
                        onClick={() => draw.undo(slideId)}
                        disabled={!hasStrokes}
                        title="Undo last stroke (Cmd/Ctrl+Z)"
                        aria-label="Undo last stroke"
                      >
                        <RotateCcw size={15} />
                      </ChromeIconButton>
                      <ChromeIconButton
                        onClick={() => draw.clear(slideId)}
                        disabled={!hasStrokes}
                        title="Clear page strokes (C)"
                        aria-label="Clear page strokes"
                      >
                        <Trash2 size={15} />
                      </ChromeIconButton>
                    </>
                  )}
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <ChromeTag
                tone="defaultStrong"
                size="md"
                weight="semibold"
                className="h-9 px-3.5 text-sm tabular-nums"
              >
                <Radio size={13} />
                {formatTimer(sessionTimerSeconds)}
              </ChromeTag>
              {canRecord && recordingSupported && (
                <ChromeIconButton
                  onClick={() => {
                    if (isRecording) onStopRecording();
                    else onStartRecording();
                  }}
                  title={isRecording ? "Stop recording" : "Start recording"}
                  aria-label={isRecording ? "Stop recording" : "Start recording"}
                  tone={isRecording ? "danger" : "default"}
                >
                  {isRecording ? <Square size={12} /> : <CircleDot size={12} />}
                </ChromeIconButton>
              )}
              {canRecord && onOpenPrintExport && (
                <ChromeIconButton
                  onClick={onOpenPrintExport}
                  title="Print / PDF"
                  aria-label="Print / PDF"
                >
                  <Printer size={12} />
                </ChromeIconButton>
              )}
              <ChromeIconButton
                onClick={onToggleNotes}
                title="Notes Workspace (N)"
                aria-label="Toggle notes workspace"
                tone={notesOpen ? "active" : "default"}
              >
                <NotebookText size={13} />
              </ChromeIconButton>
              <ChromeIconButton
                onClick={onToggleOverview}
                disabled={!canOpenOverview}
                title="Quick Overview (O)"
                aria-label="Toggle quick overview"
                tone={overviewOpen ? "active" : "default"}
              >
                <LayoutGrid size={13} />
              </ChromeIconButton>
              <ChromeIconButton
                onClick={onToggleShortcuts}
                title="Keyboard shortcuts (?)"
                aria-label="Toggle keyboard shortcuts"
                tone={shortcutsOpen ? "active" : "default"}
              >
                <Keyboard size={13} />
              </ChromeIconButton>
              <ChromeIconButton
                onClick={onToggleTimelinePreview}
                title={timelinePreviewOpen ? "Hide timeline preview" : "Show timeline preview"}
                aria-label={timelinePreviewOpen ? "Hide timeline preview" : "Show timeline preview"}
                tone={timelinePreviewOpen ? "violet" : "default"}
              >
                <List size={13} />
              </ChromeIconButton>
              <ChromeIconButton
                onClick={onToggleWakeLock}
                disabled={!wakeLockSupported}
                title={
                  wakeLockSupported
                    ? wakeLockActive
                      ? "Wake lock on"
                      : "Turn on wake lock"
                    : "Wake lock unsupported"
                }
                aria-label={
                  wakeLockSupported
                    ? wakeLockActive
                      ? "Wake lock on"
                      : "Turn on wake lock"
                    : "Wake lock unsupported"
                }
                tone={wakeLockActive ? "success" : "default"}
              >
                <SunMedium size={13} />
              </ChromeIconButton>
              <ChromeIconButton
                onClick={onToggleFullscreen}
                disabled={!fullscreenSupported}
                title={fullscreenActive ? "Fullscreen on" : "Fullscreen"}
                aria-label={fullscreenActive ? "Fullscreen on" : "Fullscreen"}
                tone={fullscreenActive ? "info" : "default"}
              >
                <Expand size={12} />
              </ChromeIconButton>
              <ChromeIconButton
                onClick={() => setDetailsOpen((value) => !value)}
                title={detailsOpen ? "Hide live details" : "Show live details"}
                aria-label={detailsOpen ? "Hide live details" : "Show live details"}
              >
                <span className="relative inline-flex items-center justify-center">
                  <Radio size={13} />
                  <span
                    className={`absolute right-0 bottom-0 size-2 rounded-full ring-2 ring-white ${statusDotClassName(status)}`}
                  />
                </span>
              </ChromeIconButton>
            </div>
            {canRecord && !recordingSupported && (
              <span className="text-xs text-amber-700">Recording unsupported in this browser.</span>
            )}
            {recordingError && <span className="text-xs text-rose-700">{recordingError}</span>}
            {wakeLockError && <span className="text-xs text-amber-700">{wakeLockError}</span>}
          </div>
        </div>
      </div>
    </aside>
  );
}
