import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LayoutName } from "@slidev-react/core/slides/layout";
import type { SlidesViewport } from "@slidev-react/core/slides/viewport";
import type { TransitionName } from "@slidev-react/core/slides/transition";
import { DrawProvider, type DrawStroke } from "../draw/DrawProvider";
import { KeyboardController } from "../navigation/KeyboardController";
import { ShortcutsHelpOverlay } from "../navigation/ShortcutsHelpOverlay";
import { NotesOverview } from "../overview/NotesOverview";
import { PresentationNavbar } from "../navigation/PresentationNavbar";
import { useSlidesNavigation } from "../navigation/useSlidesNavigation";
import { QuickOverview } from "../overview/QuickOverview";
import { SlideStage } from "../stage/SlideStage";
import { PresentationStatus } from "../PresentationStatus";
import { buildPrintExportUrl } from "@slidev-react/core/presentation/export/urls";
import { buildPresentationEntryUrl, type PresentationSession } from "../session";
import { usePresentationRecorder } from "../usePresentationRecorder";
import { usePresentationSync } from "../usePresentationSync";
import type {
  PresentationCursorState,
  PresentationSharedState,
  PresentationSyncMode,
} from "../types";
import { RevealProvider } from "../reveal/RevealContext";
import { SpeakerNotesPanel } from "./SpeakerNotesPanel";
import { FlowTimelinePreview } from "./FlowTimelinePreview";
import { PresenterSidePreview } from "./PresenterSidePreview";
import { PresenterTopProgress } from "./PresenterTopProgress";
import { buildPresentationSharedState, mapRemotePresentationPatch } from "./presentationSyncBridge";
import type { CompiledSlide } from "./types";
import { usePresentationFlowRuntime } from "./usePresentationFlowRuntime";
import { usePresenterChromeRuntime } from "./usePresenterChromeRuntime";
import { useWakeLock } from "./useWakeLock";
import { useFullscreen } from "./useFullscreen";

function canControlNavigation(session: PresentationSession) {
  return !session.enabled || session.role === "presenter";
}
const PRESENTER_BOTTOM_BAR_CLEARANCE = 72;

export function PresenterShell({
  slides,
  slidesTitle,
  slidesViewport,
  slidesLayout,
  slidesBackground,
  slidesTransition,
  slidesExportFilename,
  slidesSessionSeed,
  drawStorageKey,
  session,
  onSyncModeChange,
}: {
  slides: CompiledSlide[];
  slidesTitle?: string;
  slidesViewport: SlidesViewport;
  slidesLayout?: LayoutName;
  slidesBackground?: string;
  slidesTransition?: TransitionName;
  slidesExportFilename?: string;
  slidesSessionSeed: string;
  drawStorageKey: string;
  session: PresentationSession;
  onSyncModeChange: (mode: PresentationSyncMode) => void;
}) {
  const navigation = useSlidesNavigation();
  const currentSlide = slides[navigation.currentIndex];
  const nextSlide = slides[navigation.currentIndex + 1] ?? null;
  const CurrentSlide = currentSlide.component;
  const canControl = canControlNavigation(session);
  const isPresenterRole = session.role === "presenter";
  const canOpenOverview = canControl || session.role === "viewer";
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
  const wakeLock = useWakeLock();
  const fullscreen = useFullscreen();
  const flow = usePresentationFlowRuntime({
    slides,
    navigation,
  });
  const chrome = usePresenterChromeRuntime({
    canControl,
    canOpenOverview,
    isPresenterRole,
  });

  useEffect(() => {
    currentIndexRef.current = navigation.currentIndex;
  }, [navigation.currentIndex]);

  useEffect(() => {
    setFollowPresenter(session.role === "viewer");
  }, [session.role, session.sessionId]);

  useEffect(() => {
    setRemotePageIndex(navigation.currentIndex);
  }, [session.role, session.sessionId]);

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
    () =>
      buildPresentationSharedState({
        page: navigation.currentIndex,
        clicks: flow.currentClicks,
        clicksTotal: flow.currentClicksTotal,
        timer: localTimer,
        cursor: localCursor,
        drawings,
        drawingsRevision,
      }),
    [
      flow.currentClicks,
      flow.currentClicksTotal,
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
      const effects = mapRemotePresentationPatch({
        patch,
        remotePage,
        currentPage: currentIndexRef.current,
        resolveSlideId: (index) => slides[index]?.id ?? null,
      });

      if (typeof effects.remoteTimer === "number") setRemoteTimer(effects.remoteTimer);

      if ("remoteCursor" in effects) setRemoteCursor(effects.remoteCursor ?? null);

      if (effects.slideClicksTotal)
        flow.setSlideClicksTotal(
          effects.slideClicksTotal.slideId,
          effects.slideClicksTotal.clicksTotal,
        );

      if (effects.slideClicks)
        flow.setSlideClicks(effects.slideClicks.slideId, effects.slideClicks.clicks);

      if (effects.remoteDrawings) setRemoteDrawings(effects.remoteDrawings);
    },
  });

  const recorder = usePresentationRecorder({
    enabled: canControl,
    exportFilename: slidesExportFilename,
    slidesTitle,
  });

  const detachFromPresenter = useCallback(() => {
    if (session.role !== "viewer") return;

    setFollowPresenter(false);
  }, [session.role]);

  const handleViewerAdvance = useCallback(() => {
    detachFromPresenter();
    flow.advanceReveal();
  }, [detachFromPresenter, flow.advanceReveal]);

  const handleViewerRetreat = useCallback(() => {
    detachFromPresenter();
    flow.retreatReveal();
  }, [detachFromPresenter, flow.retreatReveal]);

  const handleViewerFirst = useCallback(() => {
    detachFromPresenter();
    flow.goToSlideAtStart(0);
  }, [detachFromPresenter, flow.goToSlideAtStart]);

  const handleViewerLast = useCallback(() => {
    detachFromPresenter();
    flow.goToSlideAtStart(Math.max(navigation.total - 1, 0));
  }, [detachFromPresenter, flow.goToSlideAtStart, navigation.total]);

  const handleEnterPresenterMode = useCallback(() => {
    const entryUrl = buildPresentationEntryUrl("presenter", slidesSessionSeed);
    if (!entryUrl) return;

    window.location.assign(entryUrl);
  }, [slidesSessionSeed]);

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
    chrome.closeOverlay();
  }, [canControl, chrome.closeOverlay]);

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

  return (
    <>
      <RevealProvider value={flow.revealContextValue}>
        <KeyboardController
          enabled={canControl || session.role === "viewer"}
          overlayOpen={Boolean(chrome.activeOverlay)}
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
        overlayOpen={Boolean(chrome.activeOverlay)}
        remoteStrokes={canControl ? null : remoteDrawings}
        onStrokesChange={onStrokesChange}
      >
        <div
          className={`relative grid h-dvh max-h-dvh grid-cols-1 grid-rows-[minmax(0,1fr)] overflow-hidden ${
            isPresenterRole ? "bg-slate-50" : "bg-black"
          } ${chrome.hideCursor ? "cursor-none" : ""}`}
        >
          {isPresenterRole && (
            <>
              <div className="pointer-events-none absolute inset-0 bg-slate-50" />
              <PresenterTopProgress total={navigation.total} progressPercent={progressPercent} />
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
              recordingError={recorder.error}
              wakeLockSupported={wakeLock.supported}
              wakeLockRequested={wakeLock.requested}
              wakeLockActive={wakeLock.active}
              wakeLockError={wakeLock.error}
              fullscreenSupported={fullscreen.supported}
              fullscreenActive={fullscreen.active}
              stageScale={chrome.stageScale}
              cursorMode={chrome.cursorMode}
              timelinePreviewOpen={chrome.timelinePreviewOpen}
              overviewOpen={chrome.overviewOpen}
              notesOpen={chrome.notesOverviewOpen}
              shortcutsOpen={chrome.shortcutsHelpOpen}
              canOpenOverview={canOpenOverview}
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
              onToggleTimelinePreview={chrome.toggleTimelinePreview}
              onToggleOverview={chrome.toggleOverview}
              onToggleNotes={chrome.toggleNotes}
              onToggleShortcuts={chrome.toggleShortcuts}
              onStageScaleChange={chrome.handleStageScaleChange}
              onCursorModeChange={chrome.handleCursorModeChange}
              onOpenMirrorStage={handleOpenMirrorStage}
              onOpenPrintExport={handleOpenPrintExport}
              onSyncModeChange={onSyncModeChange}
            />
          )}
          <div
            style={
              isPresenterRole ? { paddingBottom: `${PRESENTER_BOTTOM_BAR_CLEARANCE}px` } : undefined
            }
            className={`relative min-h-0 min-w-0 size-full ${isPresenterRole ? "px-0 pb-0 pt-0 lg:px-0" : ""}`}
          >
            {isPresenterRole ? (
              <div
                ref={chrome.presenterLayoutRef}
                style={chrome.presenterLayoutStyle}
                className="grid h-full min-h-0 grid-cols-1 gap-0"
              >
                <section className="relative min-h-0 overflow-hidden rounded-md border border-slate-200 bg-white">
                  <div className="relative z-0 h-full">
                    <RevealProvider value={flow.revealContextValue}>
                      <SlideStage
                        Slide={CurrentSlide}
                        slideId={currentSlide.id}
                        meta={currentSlide.meta}
                        slidesViewport={slidesViewport}
                        slidesLayout={slidesLayout}
                        slidesBackground={slidesBackground}
                        slidesTransition={slidesTransition}
                        remoteCursor={canControl ? null : remoteCursor}
                        onCursorChange={canControl ? setLocalCursor : undefined}
                        onStageAdvance={
                          canControl && !chrome.activeOverlay ? flow.advanceReveal : undefined
                        }
                        scaleMultiplier={chrome.stageScale}
                      />
                    </RevealProvider>
                  </div>
                </section>
                <div
                  role="separator"
                  aria-label="Resize presenter sidebar"
                  aria-orientation="vertical"
                  tabIndex={0}
                  onPointerDown={chrome.handleSidebarResizeStart}
                  onKeyDown={chrome.handleSidebarResizeKeyDown}
                  className="group relative hidden cursor-col-resize lg:block"
                >
                  <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-slate-200" />
                  <div className="absolute inset-y-0 left-1/2 w-1.5 -translate-x-1/2 rounded-sm bg-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <aside className="relative z-10 flex min-h-0 min-w-0 flex-col gap-0 text-slate-900">
                  <div className="grid min-h-0 flex-1 gap-0 lg:grid-rows-[minmax(220px,0.92fr)_12px_minmax(0,1.08fr)]">
                    <PresenterSidePreview
                      title="Up Next"
                      indexLabel={nextSlide ? String(navigation.currentIndex + 2) : "--"}
                      slide={nextSlide}
                      slidesViewport={slidesViewport}
                      slidesLayout={slidesLayout}
                      slidesBackground={slidesBackground}
                    />
                    <div className="flex items-center justify-center px-2" aria-hidden>
                      <div className="h-px w-full bg-slate-200" />
                    </div>
                    <SpeakerNotesPanel
                      currentClicks={flow.currentClicks}
                      currentClicksTotal={flow.currentClicksTotal}
                      notes={currentSlide.meta.notes}
                    />
                  </div>
                </aside>
              </div>
            ) : (
              <RevealProvider value={flow.revealContextValue}>
                <SlideStage
                  Slide={CurrentSlide}
                  slideId={currentSlide.id}
                  meta={currentSlide.meta}
                  slidesViewport={slidesViewport}
                  slidesLayout={slidesLayout}
                  slidesBackground={slidesBackground}
                  slidesTransition={slidesTransition}
                  remoteCursor={canControl ? null : remoteCursor}
                  onCursorChange={canControl ? setLocalCursor : undefined}
                />
              </RevealProvider>
            )}
          </div>
          {isPresenterRole && chrome.timelinePreviewOpen && (
            <div
              className="absolute inset-x-4 z-30 flex justify-center"
              style={{ bottom: `${PRESENTER_BOTTOM_BAR_CLEARANCE + 16}px` }}
            >
              <FlowTimelinePreview
                slide={currentSlide}
                currentClicks={flow.currentClicks}
                currentClicksTotal={flow.currentClicksTotal}
                slidesViewport={slidesViewport}
                slidesLayout={slidesLayout}
                slidesBackground={slidesBackground}
                onJumpToCue={(cueIndex) => flow.setSlideClicks(currentSlide.id, cueIndex)}
                onClose={chrome.closeOverlay}
                className="w-full max-w-[min(920px,calc(100vw-2rem))] max-h-[min(60vh,700px)]"
              />
            </div>
          )}
          {!isPresenterRole && (
            <PresentationNavbar
              slideTitle={currentSlide.meta.title}
              currentIndex={navigation.currentIndex}
              total={navigation.total}
              canPrev={flow.canPrev}
              canNext={flow.canNext}
              showPresenterModeButton={session.role !== "presenter"}
              overviewOpen={chrome.overviewOpen}
              notesOpen={chrome.notesOverviewOpen}
              shortcutsOpen={chrome.shortcutsHelpOpen}
              canOpenOverview={canOpenOverview}
              onEnterPresenterMode={
                session.role !== "presenter" ? handleEnterPresenterMode : undefined
              }
              onToggleOverview={chrome.toggleOverview}
              onToggleNotes={chrome.toggleNotes}
              onToggleShortcuts={chrome.toggleShortcuts}
              onPrev={flow.retreatReveal}
              onNext={flow.advanceReveal}
              canControl={canControl}
            />
          )}
          <QuickOverview
            open={chrome.overviewOpen && canOpenOverview}
            slides={slides}
            currentIndex={navigation.currentIndex}
            slidesViewport={slidesViewport}
            slidesLayout={slidesLayout}
            slidesBackground={slidesBackground}
            onClose={chrome.closeOverlay}
            onSelect={(index) => {
              if (!canControl) detachFromPresenter();
              flow.goToSlideAtStart(index);
              chrome.closeOverlay();
            }}
          />
          <NotesOverview
            open={chrome.notesOverviewOpen && canControl}
            slides={slides}
            currentIndex={navigation.currentIndex}
            onClose={chrome.closeOverlay}
            onSelect={(index) => {
              flow.goToSlideAtStart(index);
              chrome.closeOverlay();
            }}
          />
          <ShortcutsHelpOverlay
            open={chrome.shortcutsHelpOpen}
            sections={chrome.shortcutHelpSections}
            onClose={chrome.closeOverlay}
          />
        </div>
      </DrawProvider>
    </>
  );
}
