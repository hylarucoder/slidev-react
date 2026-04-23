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
import type {
  PresentationSyncStatus,
  UsePresentationSyncResult,
} from './sync';
import type { PresentationRecorderRuntime } from "./usePresentationRecorder";
import type { WakeLockRuntime } from "./presenter/platform/useWakeLock";
import type { FullscreenRuntime } from "./presenter/platform/useFullscreen";
import { ChromeIconButton } from "../../ui/primitives/ChromeIconButton";
import { ChromeTag } from "../../ui/primitives/ChromeTag";
import { FormSelect } from "../../ui/primitives/FormSelect";
import { DRAW_COLORS, DRAW_WIDTHS } from "../../ui/tokens";

interface PresenterChromeProps {
  stageScale: number;
  cursorMode: "always" | "idle-hide";
  timelinePreviewOpen: boolean;
  overviewOpen: boolean;
  notesOpen: boolean;
  shortcutsOpen: boolean;
  canOpenOverview: boolean;
  onToggleTimelinePreview: () => void;
  onToggleOverview: () => void;
  onToggleNotes: () => void;
  onToggleShortcuts: () => void;
  onStageScaleChange: (value: number) => void;
  onCursorModeChange: (value: "always" | "idle-hide") => void;
}

export interface PresentationStatusProps {
  slideId: string;
  session: PresentationSession;
  sync: UsePresentationSyncResult;
  recorder: PresentationRecorderRuntime;
  wakeLock: WakeLockRuntime;
  fullscreen: FullscreenRuntime;
  chrome: PresenterChromeProps;
  sessionTimerSeconds: number;
  canRecord: boolean;
  onOpenMirrorStage?: () => void;
  onOpenPrintExport?: () => void;
  onSyncModeChange?: (mode: PresentationSyncMode) => void;
}

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
}: PresentationStatusProps) {
  const draw = useDraw();
  const [copiedTarget, setCopiedTarget] = useState<"viewer" | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const strokeCount = draw.strokesBySlideId[slideId]?.length ?? 0;
  const hasStrokes = strokeCount > 0;

  const statusLabel = useMemo(() => {
    switch (sync.status) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting";
      case "degraded":
        return "Degraded";
      default:
        return "Disabled";
    }
  }, [sync.status]);

  if (!session.enabled || !session.sessionId) return null;

  const canCopyViewerLink = session.role === "presenter" && !!session.viewerUrl;

  return (
    <aside className="pointer-events-none absolute inset-x-0 bottom-0 z-40">
      <div className="relative">
        {detailsOpen && (
          <div className="pointer-events-auto absolute inset-x-0 bottom-full mb-2 border-t border-slate-200/80 bg-slate-50/72 px-3 py-3 text-slate-800  ring-1 ring-white/45 backdrop-blur-xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <ChromeTag size="md" weight="semibold" className="uppercase tracking-[0.18em]">
                <span className={`size-2.5 rounded-full ${statusDotClassName(sync.status)}`} />
                Live
                <span
                  className={`rounded-[4px] border px-2 py-0.5 text-[10px] font-medium normal-case tracking-normal ${badgeClassName(sync.status)}`}
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
                onClick={chrome.onToggleTimelinePreview}
                className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                  chrome.timelinePreviewOpen
                    ? "border-violet-300 bg-violet-50 text-violet-700"
                    : "border-slate-200 bg-white/88 text-slate-700 hover:bg-white"
                }`}
              >
                <List size={12} />
                Timeline
              </button>
              <button
                type="button"
                onClick={() => {
                  void fullscreen.toggle();
                }}
                disabled={!fullscreen.supported}
                className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  fullscreen.supported && fullscreen.active
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white/88 text-slate-700 hover:bg-white"
                }`}
              >
                <Expand size={12} />
                {fullscreen.supported
                  ? fullscreen.active
                    ? "Fullscreen on"
                    : "Fullscreen"
                  : "Fullscreen unavailable"}
              </button>
              <button
                type="button"
                onClick={() => {
                  void wakeLock.toggle();
                }}
                disabled={!wakeLock.supported}
                className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  wakeLock.supported && wakeLock.active
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white/88 text-slate-700 hover:bg-white"
                }`}
              >
                <SunMedium size={12} />
                {wakeLock.supported
                  ? wakeLock.active
                    ? "Wake lock on"
                    : "Wake lock"
                  : "Wake lock unavailable"}
              </button>
            </div>
            <div className="mb-3 grid gap-2 sm:grid-cols-2">
              <FormSelect
                label="stage scale"
                size="sm"
                value={String(chrome.stageScale)}
                onChange={(event) => {
                  chrome.onStageScaleChange(Number(event.target.value));
                }}
              >
                <option value="0.9">90%</option>
                <option value="1">100%</option>
                <option value="1.08">108%</option>
              </FormSelect>
              <FormSelect
                label="cursor"
                size="sm"
                value={chrome.cursorMode}
                onChange={(event) => {
                  chrome.onCursorModeChange(event.target.value as "always" | "idle-hide");
                }}
              >
                <option value="always">always visible</option>
                <option value="idle-hide">hide when idle</option>
              </FormSelect>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <ChromeTag tone="muted" size="md" className="py-2 text-xs">
                {sync.broadcastConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
                {sync.broadcastConnected ? "Broadcast connected" : "Broadcast unavailable"}
              </ChromeTag>
              <ChromeTag tone="muted" size="md" className="py-2 text-xs">
                ws: {sync.wsConnected ? "connected" : "idle"}
              </ChromeTag>
              <ChromeTag tone="muted" size="md" className="py-2 text-xs tabular-nums">
                peers: {sync.peerCount}
              </ChromeTag>
              <ChromeTag
                tone={sync.remoteActive ? "success" : "warning"}
                size="md"
                className="py-2 text-xs"
              >
                remote: {sync.remoteActive ? "active" : "stale"}
              </ChromeTag>
              <ChromeTag tone="muted" size="md" className="py-2 text-xs">
                role: {session.role}
              </ChromeTag>
              <ChromeTag tone="muted" size="md" className="py-2 font-mono text-[11px]">
                {session.sessionId}
              </ChromeTag>
            </div>
            {sync.lastSyncedAt && (
              <p className="mt-3 text-right text-[11px] text-slate-500">
                last sync {new Date(sync.lastSyncedAt).toLocaleTimeString()}
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
                {formatTimer(sessionTimerSeconds)}
              </ChromeTag>
              {canRecord && recorder.supported && (
                <ChromeIconButton
                  onClick={() => {
                    if (recorder.isRecording) void recorder.stop();
                    else void recorder.start();
                  }}
                  title={recorder.isRecording ? "Stop recording" : "Start recording"}
                  aria-label={recorder.isRecording ? "Stop recording" : "Start recording"}
                  tone={recorder.isRecording ? "danger" : "default"}
                >
                  {recorder.isRecording ? <Square size={14} /> : <CircleDot size={14} />}
                </ChromeIconButton>
              )}
              <ChromeIconButton
                onClick={chrome.onToggleNotes}
                title="Notes Workspace (N)"
                aria-label="Toggle notes workspace"
                tone={chrome.notesOpen ? "active" : "default"}
              >
                <NotebookText size={14} />
              </ChromeIconButton>
              <ChromeIconButton
                onClick={chrome.onToggleOverview}
                disabled={!chrome.canOpenOverview}
                title="Quick Overview (O)"
                aria-label="Toggle quick overview"
                tone={chrome.overviewOpen ? "active" : "default"}
              >
                <LayoutGrid size={14} />
              </ChromeIconButton>
              <ChromeIconButton
                onClick={chrome.onToggleShortcuts}
                title="Keyboard shortcuts (?)"
                aria-label="Toggle keyboard shortcuts"
                tone={chrome.shortcutsOpen ? "active" : "default"}
              >
                <Keyboard size={14} />
              </ChromeIconButton>
              <ChromeIconButton
                onClick={() => setDetailsOpen((value) => !value)}
                title={detailsOpen ? "Hide live details" : "Show live details"}
                aria-label={detailsOpen ? "Hide live details" : "Show live details"}
                tone={detailsOpen ? "active" : "default"}
              >
                <span className="relative inline-flex items-center justify-center">
                  <Radio size={14} />
                  <span
                    className={`absolute right-0 bottom-0 size-2 rounded-full ring-2 ring-white ${statusDotClassName(sync.status)}`}
                  />
                </span>
              </ChromeIconButton>
            </div>
            {canRecord && !recorder.supported && (
              <span className="text-xs text-amber-700">Recording unsupported in this browser.</span>
            )}
            {recorder.error && <span className="text-xs text-rose-700">{recorder.error}</span>}
            {wakeLock.error && <span className="text-xs text-amber-700">{wakeLock.error}</span>}
          </div>
        </div>
      </div>
    </aside>
  );
}
