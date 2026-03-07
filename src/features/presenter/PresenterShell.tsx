import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LayoutName } from "../../deck/model/layout";
import type { TransitionName } from "../../deck/model/transition";
import { DrawProvider, type DrawStroke } from "../draw/DrawProvider";
import { KeyboardController } from "../navigation/KeyboardController";
import { NotesOverview } from "../overview/NotesOverview";
import { PresentationNavbar } from "../navigation/PresentationNavbar";
import { useDeckNavigation } from "../navigation/useDeckNavigation";
import { QuickOverview } from "../overview/QuickOverview";
import { SlideStage } from "../player/SlideStage";
import { PresentationStatus } from "../presentation/PresentationStatus";
import { buildPrintExportUrl } from "../presentation/printExport";
import { buildPresentationEntryUrl, type PresentationSession } from "../presentation/session";
import { usePresentationRecorder } from "../presentation/usePresentationRecorder";
import { usePresentationSync } from "../presentation/usePresentationSync";
import type {
  PresentationCursorState,
  PresentationSharedState,
  PresentationSyncMode,
} from "../presentation/types";
import { RevealProvider, type RevealContextValue } from "../reveal/RevealContext";
import {
  canAdvanceReveal,
  canRetreatReveal,
  clampRevealCount,
  resolveAdvanceReveal,
  resolveRetreatReveal,
} from "../reveal/navigation";
import { SpeakerNotesPanel } from "./SpeakerNotesPanel";
import { PresenterSidePreview } from "./PresenterSidePreview";
import { PresenterTopProgress } from "./PresenterTopProgress";
import type { CompiledSlide } from "./types";
import { resolveRevealTotal } from "../reveal/clicks";
import { useWakeLock } from "./useWakeLock";
import { useFullscreen } from "./useFullscreen";
import { useIdleCursor } from "./useIdleCursor";

function isTypingElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

function formatSpeakerTime(seconds: number) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const restSeconds = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${restSeconds}`;
}

function canControlNavigation(session: PresentationSession) {
  return !session.enabled || session.role === "presenter";
}

const PRESENTER_STAGE_SCALE_STORAGE_KEY = "slide-react:presenter-stage-scale";
const PRESENTER_STAGE_SCALE_OPTIONS = new Set([0.9, 1, 1.08]);
const PRESENTER_CURSOR_MODE_STORAGE_KEY = "slide-react:presenter-cursor-mode";
const PRESENTER_CURSOR_MODE_OPTIONS = new Set(["always", "idle-hide"] as const);

type PresenterCursorMode = "always" | "idle-hide";

function readInitialStageScale() {
  if (typeof window === "undefined") return 1;

  try {
    const savedValue = window.localStorage.getItem(PRESENTER_STAGE_SCALE_STORAGE_KEY);
    if (!savedValue) return 1;

    const parsedValue = Number(savedValue);
    if (!Number.isFinite(parsedValue) || !PRESENTER_STAGE_SCALE_OPTIONS.has(parsedValue)) return 1;

    return parsedValue;
  } catch {
    return 1;
  }
}

function readInitialCursorMode(): PresenterCursorMode {
  if (typeof window === "undefined") return "always";

  try {
    const savedValue = window.localStorage.getItem(PRESENTER_CURSOR_MODE_STORAGE_KEY);
    if (!savedValue) return "always";

    return PRESENTER_CURSOR_MODE_OPTIONS.has(savedValue as PresenterCursorMode)
      ? (savedValue as PresenterCursorMode)
      : "always";
  } catch {
    return "always";
  }
}

function resolveMaxRevealStep(stepCounts: Map<number, number> | undefined) {
  if (!stepCounts || stepCounts.size === 0) return 0;

  let max = 0;
  for (const step of stepCounts.keys()) {
    if (step > max) max = step;
  }

  return max;
}

type PresenterOverlay = "quick-overview" | "notes-overview" | null;

export function PresenterShell({
  slides,
  deckTitle,
  deckLayout,
  deckBackground,
  deckTransition,
  deckExportFilename,
  deckSessionSeed,
  drawStorageKey,
  session,
  onSyncModeChange,
}: {
  slides: CompiledSlide[];
  deckTitle?: string;
  deckLayout?: LayoutName;
  deckBackground?: string;
  deckTransition?: TransitionName;
  deckExportFilename?: string;
  deckSessionSeed: string;
  drawStorageKey: string;
  session: PresentationSession;
  onSyncModeChange: (mode: PresentationSyncMode) => void;
}) {
  const navigation = useDeckNavigation();
  const currentSlide = slides[navigation.currentIndex];
  const nextSlide = slides[navigation.currentIndex + 1] ?? null;
  const CurrentSlide = currentSlide.component;
  const [activeOverlay, setActiveOverlay] = useState<PresenterOverlay>(null);
  const canControl = canControlNavigation(session);
  const isPresenterRole = session.role === "presenter";
  const [followPresenter, setFollowPresenter] = useState(session.role === "viewer");
  const [localCursor, setLocalCursor] = useState<PresentationCursorState | null>(null);
  const [remoteCursor, setRemoteCursor] = useState<PresentationCursorState | null>(null);
  const [remotePageIndex, setRemotePageIndex] = useState<number | null>(null);
  const [localTimer, setLocalTimer] = useState(0);
  const [remoteTimer, setRemoteTimer] = useState(0);
  const [drawings, setDrawings] = useState<Record<string, DrawStroke[]>>({});
  const [drawingsRevision, setDrawingsRevision] = useState(0);
  const [remoteDrawings, setRemoteDrawings] = useState<{
    revision: number;
    strokesBySlideId: Record<string, DrawStroke[]>;
  } | null>(null);
  const drawingsSyncFrameRef = useRef<number | null>(null);
  const currentIndexRef = useRef(navigation.currentIndex);
  const revealStepCountsRef = useRef<Record<string, Map<number, number>>>({});
  const [clicksBySlideId, setClicksBySlideId] = useState<Record<string, number>>({});
  const [clicksTotalBySlideId, setClicksTotalBySlideId] = useState<Record<string, number>>({});
  const [stageScale, setStageScale] = useState(readInitialStageScale);
  const [cursorMode, setCursorMode] = useState<PresenterCursorMode>(readInitialCursorMode);
  const clicksBySlideIdRef = useRef(clicksBySlideId);
  const clicksTotalBySlideIdRef = useRef(clicksTotalBySlideId);
  const wakeLock = useWakeLock();
  const fullscreen = useFullscreen();
  const slideClicksConfig = useMemo(
    () =>
      Object.fromEntries(
        slides.map((slide) => [slide.id, slide.meta.clicks ?? 0] as const),
      ) as Record<string, number>,
    [slides],
  );

  useEffect(() => {
    currentIndexRef.current = navigation.currentIndex;
  }, [navigation.currentIndex]);

  useEffect(() => {
    setFollowPresenter(session.role === "viewer");
  }, [session.role, session.sessionId]);

  useEffect(() => {
    setRemotePageIndex(navigation.currentIndex);
  }, [session.role, session.sessionId]);

  useEffect(() => {
    clicksBySlideIdRef.current = clicksBySlideId;
  }, [clicksBySlideId]);

  useEffect(() => {
    clicksTotalBySlideIdRef.current = clicksTotalBySlideId;
  }, [clicksTotalBySlideId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(PRESENTER_STAGE_SCALE_STORAGE_KEY, String(stageScale));
    } catch {
      // Ignore storage write failures.
    }
  }, [stageScale]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(PRESENTER_CURSOR_MODE_STORAGE_KEY, cursorMode);
    } catch {
      // Ignore storage write failures.
    }
  }, [cursorMode]);

  const setSlideClicks = useCallback(
    (slideId: string, next: number) => {
      setClicksBySlideId((prev) => {
        const total = resolveRevealTotal({
          configuredClicks: slideClicksConfig[slideId],
          detectedClicks: clicksTotalBySlideIdRef.current[slideId],
        });
        const clamped = clampRevealCount(next, total);
        if ((prev[slideId] ?? 0) === clamped) return prev;

        const updated = {
          ...prev,
          [slideId]: clamped,
        };
        clicksBySlideIdRef.current = updated;
        return updated;
      });
    },
    [slideClicksConfig],
  );

  const setSlideClicksTotal = useCallback(
    (slideId: string, nextTotal: number) => {
      const safeTotal = resolveRevealTotal({
        configuredClicks: slideClicksConfig[slideId],
        detectedClicks: nextTotal,
      });

      setClicksTotalBySlideId((prev) => {
        if (prev[slideId] === safeTotal) return prev;

        const updated = {
          ...prev,
          [slideId]: safeTotal,
        };
        clicksTotalBySlideIdRef.current = updated;
        return updated;
      });

      setClicksBySlideId((prev) => {
        const clamped = clampRevealCount(prev[slideId] ?? 0, safeTotal);
        if ((prev[slideId] ?? 0) === clamped) return prev;

        const updated = {
          ...prev,
          [slideId]: clamped,
        };
        clicksBySlideIdRef.current = updated;
        return updated;
      });
    },
    [slideClicksConfig],
  );

  const registerRevealStep = useCallback(
    (step: number) => {
      const slideId = currentSlide.id;
      const normalizedStep = Math.max(Math.floor(step), 1);
      const slideSteps = revealStepCountsRef.current[slideId] ?? new Map<number, number>();
      revealStepCountsRef.current[slideId] = slideSteps;
      slideSteps.set(normalizedStep, (slideSteps.get(normalizedStep) ?? 0) + 1);
      setSlideClicksTotal(slideId, resolveMaxRevealStep(slideSteps));

      return () => {
        const steps = revealStepCountsRef.current[slideId];
        if (!steps) return;

        const nextCount = (steps.get(normalizedStep) ?? 1) - 1;
        if (nextCount <= 0) steps.delete(normalizedStep);
        else steps.set(normalizedStep, nextCount);

        if (steps.size === 0) delete revealStepCountsRef.current[slideId];

        setSlideClicksTotal(slideId, resolveMaxRevealStep(steps));
      };
    },
    [currentSlide.id, setSlideClicksTotal],
  );

  const currentClicks = clicksBySlideId[currentSlide.id] ?? 0;
  const currentClicksTotal = resolveRevealTotal({
    configuredClicks: currentSlide.meta.clicks,
    detectedClicks: clicksTotalBySlideId[currentSlide.id],
  });

  const goToSlideAtStart = useCallback(
    (index: number) => {
      const targetSlide = slides[index];
      if (!targetSlide) return;

      setSlideClicks(targetSlide.id, 0);
      navigation.goTo(index);
    },
    [navigation, setSlideClicks, slides],
  );

  const advanceReveal = useCallback(() => {
    const nextState = resolveAdvanceReveal({
      currentClicks,
      currentClicksTotal,
      currentIndex: navigation.currentIndex,
      totalSlides: navigation.total,
    });
    if (!nextState) return;

    const targetSlide = slides[nextState.page];
    if (!targetSlide) return;

    setSlideClicks(targetSlide.id, nextState.clicks);
    if (nextState.page !== navigation.currentIndex) navigation.goTo(nextState.page);
  }, [currentClicks, currentClicksTotal, navigation, setSlideClicks, slides]);

  const retreatReveal = useCallback(() => {
    const previousSlideId = slides[navigation.currentIndex - 1]?.id ?? "";
    const nextState = resolveRetreatReveal({
      currentClicks,
      currentIndex: navigation.currentIndex,
      previousClicks: clicksBySlideIdRef.current[previousSlideId],
      previousClicksTotal: resolveRevealTotal({
        configuredClicks: slideClicksConfig[previousSlideId],
        detectedClicks: clicksTotalBySlideIdRef.current[previousSlideId],
      }),
    });
    if (!nextState) return;

    const targetSlide = slides[nextState.page];
    if (!targetSlide) return;

    setSlideClicks(targetSlide.id, nextState.clicks);
    if (nextState.page !== navigation.currentIndex) navigation.goTo(nextState.page);
  }, [currentClicks, navigation, setSlideClicks, slides]);

  const revealContextValue = useMemo<RevealContextValue>(
    () => ({
      slideId: currentSlide.id,
      clicks: currentClicks,
      clicksTotal: currentClicksTotal,
      setClicks: (next) => setSlideClicks(currentSlide.id, next),
      registerStep: registerRevealStep,
      advance: advanceReveal,
      retreat: retreatReveal,
      canAdvance: canAdvanceReveal({
        currentClicks,
        currentClicksTotal,
        currentIndex: navigation.currentIndex,
        totalSlides: navigation.total,
      }),
      canRetreat: canRetreatReveal({
        currentClicks,
        currentIndex: navigation.currentIndex,
      }),
    }),
    [
      advanceReveal,
      currentClicks,
      currentClicksTotal,
      currentSlide.id,
      navigation.currentIndex,
      navigation.total,
      registerRevealStep,
      retreatReveal,
      setSlideClicks,
    ],
  );

  const scheduleDrawingsSync = useCallback(() => {
    if (drawingsSyncFrameRef.current !== null) return;

    drawingsSyncFrameRef.current = window.requestAnimationFrame(() => {
      drawingsSyncFrameRef.current = null;
      setDrawingsRevision((revision) => revision + 1);
    });
  }, []);

  const onStrokesChange = useCallback(
    (nextStrokes: Record<string, DrawStroke[]>) => {
      setDrawings(nextStrokes);

      if (!canControl) return;

      scheduleDrawingsSync();
    },
    [canControl, scheduleDrawingsSync],
  );

  const localSharedState = useMemo<PresentationSharedState>(
    () => ({
      page: navigation.currentIndex,
      clicks: currentClicks,
      clicksTotal: currentClicksTotal,
      timer: localTimer,
      cursor: localCursor,
      drawings,
      drawingsRevision,
      lastUpdate: 0,
    }),
    [
      currentClicks,
      currentClicksTotal,
      drawings,
      drawingsRevision,
      localCursor,
      localTimer,
      navigation.currentIndex,
    ],
  );

  const sync = usePresentationSync({
    session,
    currentIndex: navigation.currentIndex,
    total: navigation.total,
    goTo: navigation.goTo,
    followRemotePage: followPresenter,
    localState: localSharedState,
    onRemoteState: (patch, remotePage) => {
      setRemotePageIndex(remotePage);
      const remoteIndex = remotePage;
      const remoteSlide = slides[remoteIndex];

      if (typeof patch.timer === "number") setRemoteTimer(patch.timer);

      if ("cursor" in patch) {
        setRemoteCursor(remoteIndex === currentIndexRef.current ? (patch.cursor ?? null) : null);
      }

      if (remoteSlide && typeof patch.clicksTotal === "number")
        setSlideClicksTotal(remoteSlide.id, patch.clicksTotal);

      if (remoteSlide && typeof patch.clicks === "number")
        setSlideClicks(remoteSlide.id, patch.clicks);

      if (patch.drawings) {
        setRemoteDrawings({
          revision:
            typeof patch.drawingsRevision === "number" ? patch.drawingsRevision : Date.now(),
          strokesBySlideId: patch.drawings,
        });
      }
    },
  });

  const recorder = usePresentationRecorder({
    enabled: canControl,
    exportFilename: deckExportFilename,
    deckTitle,
  });

  const detachFromPresenter = useCallback(() => {
    if (session.role !== "viewer") return;

    setFollowPresenter(false);
  }, [session.role]);

  const handleViewerAdvance = useCallback(() => {
    detachFromPresenter();
    advanceReveal();
  }, [advanceReveal, detachFromPresenter]);

  const handleViewerRetreat = useCallback(() => {
    detachFromPresenter();
    retreatReveal();
  }, [detachFromPresenter, retreatReveal]);

  const handleViewerFirst = useCallback(() => {
    detachFromPresenter();
    goToSlideAtStart(0);
  }, [detachFromPresenter, goToSlideAtStart]);

  const handleViewerLast = useCallback(() => {
    detachFromPresenter();
    goToSlideAtStart(Math.max(navigation.total - 1, 0));
  }, [detachFromPresenter, goToSlideAtStart, navigation.total]);

  const handleEnterPresenterMode = useCallback(() => {
    const entryUrl = buildPresentationEntryUrl("presenter", deckSessionSeed);
    if (!entryUrl) return;

    window.location.assign(entryUrl);
  }, [deckSessionSeed]);

  const handleOpenPrintExport = useCallback(() => {
    const exportUrl = buildPrintExportUrl(window.location.href);
    const exportWindow = window.open(exportUrl, "_blank");
    if (exportWindow) {
      exportWindow.opener = null;
      return;
    }

    window.location.assign(exportUrl);
  }, []);

  const handleOpenMirrorStage = useCallback(() => {
    const targetUrl = session.viewerUrl;
    if (!targetUrl) return;

    const mirrorWindow = window.open(targetUrl, "_blank", "noopener,noreferrer");
    if (mirrorWindow) {
      mirrorWindow.opener = null;
      return;
    }

    window.location.assign(targetUrl);
  }, [session.viewerUrl]);

  const handleStageScaleChange = useCallback((value: number) => {
    setStageScale(PRESENTER_STAGE_SCALE_OPTIONS.has(value) ? value : 1);
  }, []);

  const handleCursorModeChange = useCallback((value: PresenterCursorMode) => {
    setCursorMode(PRESENTER_CURSOR_MODE_OPTIONS.has(value) ? value : "always");
  }, []);

  const hideCursor = useIdleCursor({
    enabled: isPresenterRole && canControl && cursorMode === "idle-hide",
  });

  const canPrev = revealContextValue.canRetreat;
  const canNext = revealContextValue.canAdvance;
  const overviewOpen = activeOverlay === "quick-overview";
  const notesOverviewOpen = activeOverlay === "notes-overview";
  const progressPercent =
    navigation.total > 0 ? ((navigation.currentIndex + 1) / navigation.total) * 100 : 0;
  useEffect(() => {
    if (!canControl) {
      setLocalTimer(0);
      return;
    }

    const startedAt = Date.now();
    setLocalTimer(0);
    const intervalId = window.setInterval(() => {
      setLocalTimer(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [canControl, session.sessionId]);

  useEffect(() => {
    if (canControl) {
      setRemoteCursor(null);
      setRemoteTimer(0);
      setRemoteDrawings(null);
      return;
    }

    setLocalCursor(null);
    setActiveOverlay(null);
  }, [canControl]);

  useEffect(() => {
    if (remotePageIndex === navigation.currentIndex) return;

    setRemoteCursor(null);
  }, [navigation.currentIndex, remotePageIndex]);

  useEffect(() => {
    return () => {
      if (drawingsSyncFrameRef.current !== null)
        window.cancelAnimationFrame(drawingsSyncFrameRef.current);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingElement(event.target)) return;

      const key = event.key.toLowerCase();

      if (key === "o") {
        if (!canControl) return;

        event.preventDefault();
        setActiveOverlay((value) => (value === "quick-overview" ? null : "quick-overview"));
        return;
      }

      if (key === "n") {
        if (!canControl) return;

        event.preventDefault();
        setActiveOverlay((value) => (value === "notes-overview" ? null : "notes-overview"));
        return;
      }

      if (key === "escape") setActiveOverlay(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canControl]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.body.dataset.presenterOverlay = activeOverlay ? "open" : "closed";
    return () => {
      delete document.body.dataset.presenterOverlay;
    };
  }, [activeOverlay]);

  return (
    <>
      <RevealProvider value={revealContextValue}>
        <KeyboardController
          enabled={canControl || session.role === "viewer"}
          onAdvance={!canControl ? handleViewerAdvance : undefined}
          onRetreat={!canControl ? handleViewerRetreat : undefined}
          onFirst={!canControl ? handleViewerFirst : undefined}
          onLast={!canControl ? handleViewerLast : undefined}
        />
      </RevealProvider>
      <DrawProvider
        currentSlideId={currentSlide.id}
        storageKey={drawStorageKey}
        readOnly={!canControl}
        remoteStrokes={canControl ? null : remoteDrawings}
        onStrokesChange={onStrokesChange}
      >
        <div
          className={`relative grid h-dvh max-h-dvh grid-cols-1 grid-rows-[minmax(0,1fr)] overflow-hidden ${
            isPresenterRole ? "bg-[#eef4ff]" : "bg-black"
          } ${hideCursor ? "cursor-none" : ""}`}
        >
          {isPresenterRole && (
            <>
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_26%),radial-gradient(circle_at_78%_16%,rgba(244,114,182,0.14),transparent_20%),linear-gradient(180deg,#f8fbff_0%,#e8f0fb_52%,#f3f7ff_100%)]" />
              <PresenterTopProgress
                currentIndex={navigation.currentIndex}
                total={navigation.total}
                progressPercent={progressPercent}
                revealClicks={currentClicks}
                revealClicksTotal={currentClicksTotal}
                elapsedLabel={formatSpeakerTime(localTimer)}
                remoteActive={sync.remoteActive}
              />
            </>
          )}
          {isPresenterRole && (
            <PresentationStatus
              slideId={currentSlide.id}
              session={session}
              status={sync.status}
              broadcastConnected={sync.broadcastConnected}
              wsConnected={sync.wsConnected}
              lastSyncedAt={sync.lastSyncedAt}
              peerCount={sync.peerCount}
              remoteActive={sync.remoteActive}
              sessionTimerSeconds={canControl ? localTimer : remoteTimer}
              canRecord={canControl}
              recordingSupported={recorder.supported}
              isRecording={recorder.isRecording}
              recordingElapsedMs={recorder.elapsedMs}
              recordingError={recorder.error}
              wakeLockSupported={wakeLock.supported}
              wakeLockRequested={wakeLock.requested}
              wakeLockActive={wakeLock.active}
              wakeLockError={wakeLock.error}
              fullscreenSupported={fullscreen.supported}
              fullscreenActive={fullscreen.active}
              stageScale={stageScale}
              cursorMode={cursorMode}
              onStartRecording={() => {
                void recorder.start();
              }}
              onStopRecording={() => {
                void recorder.stop();
              }}
              onToggleWakeLock={() => {
                void wakeLock.toggle();
              }}
              onToggleFullscreen={() => {
                void fullscreen.toggle();
              }}
              onStageScaleChange={handleStageScaleChange}
              onCursorModeChange={handleCursorModeChange}
              onOpenMirrorStage={handleOpenMirrorStage}
              onOpenPrintExport={handleOpenPrintExport}
              onSyncModeChange={onSyncModeChange}
            />
          )}
          <div
            className={`relative min-h-0 min-w-0 size-full ${isPresenterRole ? "px-0 pb-0 pt-0 lg:px-0" : ""}`}
          >
            {isPresenterRole ? (
              <div className="grid h-full min-h-0 gap-0 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_390px]">
                <section className="relative min-h-0 overflow-hidden rounded-[5px] border border-slate-200/75 bg-white/42 shadow-[0_24px_80px_rgba(148,163,184,0.22)] ring-1 ring-white/50">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.55),transparent_38%)]" />
                  <div className="relative z-0 h-full">
                    <RevealProvider value={revealContextValue}>
                      <SlideStage
                        Slide={CurrentSlide}
                        slideId={currentSlide.id}
                        meta={currentSlide.meta}
                        deckLayout={deckLayout}
                        deckBackground={deckBackground}
                        deckTransition={deckTransition}
                        remoteCursor={canControl ? null : remoteCursor}
                        onCursorChange={canControl ? setLocalCursor : undefined}
                        onStageAdvance={canControl && !activeOverlay ? advanceReveal : undefined}
                        scaleMultiplier={stageScale}
                      />
                    </RevealProvider>
                  </div>
                </section>
                <aside className="relative z-10 flex min-h-0 flex-col gap-4 text-slate-900">
                  <div className="grid min-h-0 flex-1 gap-4 lg:grid-rows-[minmax(0,1fr)_minmax(0,0.88fr)]">
                    <PresenterSidePreview
                      title="Up Next"
                      indexLabel={nextSlide ? String(navigation.currentIndex + 2) : "--"}
                      slide={nextSlide}
                      deckLayout={deckLayout}
                      deckBackground={deckBackground}
                    />
                    <SpeakerNotesPanel
                      currentClicks={currentClicks}
                      currentClicksTotal={currentClicksTotal}
                      notes={currentSlide.meta.notes}
                    />
                  </div>
                </aside>
              </div>
            ) : (
              <RevealProvider value={revealContextValue}>
                <SlideStage
                  Slide={CurrentSlide}
                  slideId={currentSlide.id}
                  meta={currentSlide.meta}
                  deckLayout={deckLayout}
                  deckBackground={deckBackground}
                  deckTransition={deckTransition}
                  remoteCursor={canControl ? null : remoteCursor}
                  onCursorChange={canControl ? setLocalCursor : undefined}
                />
              </RevealProvider>
            )}
          </div>
          <PresentationNavbar
            slideTitle={currentSlide.meta.title}
            currentIndex={navigation.currentIndex}
            total={navigation.total}
            canPrev={canPrev}
            canNext={canNext}
            showPresenterModeButton={session.role !== "presenter"}
            overviewOpen={overviewOpen}
            notesOpen={notesOverviewOpen}
            onEnterPresenterMode={
              session.role !== "presenter" ? handleEnterPresenterMode : undefined
            }
            onToggleOverview={() => {
              if (!canControl) return;

              setActiveOverlay((value) => (value === "quick-overview" ? null : "quick-overview"));
            }}
            onToggleNotes={() => {
              if (!canControl) return;

              setActiveOverlay((value) => (value === "notes-overview" ? null : "notes-overview"));
            }}
            onPrev={retreatReveal}
            onNext={advanceReveal}
            canControl={canControl}
          />
          <QuickOverview
            open={overviewOpen && canControl}
            slides={slides}
            currentIndex={navigation.currentIndex}
            deckBackground={deckBackground}
            onClose={() => setActiveOverlay(null)}
            onSelect={(index) => {
              goToSlideAtStart(index);
              setActiveOverlay(null);
            }}
          />
          <NotesOverview
            open={notesOverviewOpen && canControl}
            slides={slides}
            currentIndex={navigation.currentIndex}
            onClose={() => setActiveOverlay(null)}
            onSelect={(index) => {
              goToSlideAtStart(index);
              setActiveOverlay(null);
            }}
          />
        </div>
      </DrawProvider>
    </>
  );
}
