import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  buildShortcutHelpSections,
  createShortcutHelpTriggerState,
  isShortcutHelpOpenKey,
  registerShortcutHelpKeyDown,
  registerShortcutHelpKeyUp,
} from "../navigation/keyboardShortcuts";
import { useIdleCursor } from "./useIdleCursor";
import { isTypingElement } from "../browser";
import {
  parsePersistedPresenterCursorMode,
  parsePersistedPresenterSidebarWidth,
  parsePersistedPresenterStageScale,
  PRESENTER_CURSOR_MODE_STORAGE_KEY,
  PRESENTER_SIDEBAR_WIDTH_STORAGE_KEY,
  PRESENTER_STAGE_SCALE_STORAGE_KEY,
} from "./persistence";

const PRESENTER_SIDEBAR_WIDTH_MIN = 280;
const PRESENTER_SIDEBAR_WIDTH_MAX = 420;
const PRESENTER_STAGE_MIN_WIDTH = 720;
const PRESENTER_DIVIDER_WIDTH = 10;
const PRESENTER_DESKTOP_BREAKPOINT = 1024;

export type PresenterCursorMode = "always" | "idle-hide";

export type PresenterOverlay =
  | "quick-overview"
  | "notes-overview"
  | "timeline-preview"
  | "shortcuts-help"
  | null;

function readInitialStageScale() {
  try {
    return parsePersistedPresenterStageScale(
      window.localStorage.getItem(PRESENTER_STAGE_SCALE_STORAGE_KEY),
    ) ?? 1;
  } catch {
    return 1;
  }
}

function readInitialCursorMode(): PresenterCursorMode {
  try {
    return (
      parsePersistedPresenterCursorMode(
        window.localStorage.getItem(PRESENTER_CURSOR_MODE_STORAGE_KEY),
      ) ?? "always"
    );
  } catch {
    return "always";
  }
}

function clampPresenterSidebarWidth(value: number, containerWidth: number) {
  const maxWidth = Math.min(
    PRESENTER_SIDEBAR_WIDTH_MAX,
    Math.max(
      PRESENTER_SIDEBAR_WIDTH_MIN,
      containerWidth - PRESENTER_STAGE_MIN_WIDTH - PRESENTER_DIVIDER_WIDTH,
    ),
  );

  return Math.min(Math.max(Math.round(value), PRESENTER_SIDEBAR_WIDTH_MIN), maxWidth);
}

function readInitialSidebarWidth() {
  try {
    const parsedValue = parsePersistedPresenterSidebarWidth(
      window.localStorage.getItem(PRESENTER_SIDEBAR_WIDTH_STORAGE_KEY),
    );
    if (parsedValue !== null) return clampPresenterSidebarWidth(parsedValue, window.innerWidth);
  } catch {
    // Ignore storage read failures.
  }

  return clampPresenterSidebarWidth(window.innerWidth * 0.23, window.innerWidth);
}

export function usePresenterChromeRuntime({
  canControl,
  canOpenOverview,
  isPresenterRole,
}: {
  canControl: boolean;
  canOpenOverview: boolean;
  isPresenterRole: boolean;
}) {
  const [activeOverlay, setActiveOverlay] = useState<PresenterOverlay>(null);
  const [stageScale, setStageScale] = useState(readInitialStageScale);
  const [cursorMode, setCursorMode] = useState<PresenterCursorMode>(readInitialCursorMode);
  const [sidebarWidth, setSidebarWidth] = useState(readInitialSidebarWidth);
  const [isWidePresenterLayout, setIsWidePresenterLayout] = useState(
    () => window.innerWidth >= PRESENTER_DESKTOP_BREAKPOINT,
  );
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const shortcutHelpTriggerRef = useRef(createShortcutHelpTriggerState());
  const presenterLayoutRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(PRESENTER_STAGE_SCALE_STORAGE_KEY, String(stageScale));
    } catch {
      // Ignore storage write failures.
    }
  }, [stageScale]);

  useEffect(() => {
    try {
      window.localStorage.setItem(PRESENTER_CURSOR_MODE_STORAGE_KEY, cursorMode);
    } catch {
      // Ignore storage write failures.
    }
  }, [cursorMode]);

  useEffect(() => {
    try {
      window.localStorage.setItem(PRESENTER_SIDEBAR_WIDTH_STORAGE_KEY, String(sidebarWidth));
    } catch {
      // Ignore storage write failures.
    }
  }, [sidebarWidth]);

  useEffect(() => {
    const updatePresenterLayoutMode = () => {
      setIsWidePresenterLayout(window.innerWidth >= PRESENTER_DESKTOP_BREAKPOINT);

      const containerWidth =
        presenterLayoutRef.current?.getBoundingClientRect().width ?? window.innerWidth;
      setSidebarWidth((currentWidth) => clampPresenterSidebarWidth(currentWidth, containerWidth));
    };

    updatePresenterLayoutMode();
    window.addEventListener("resize", updatePresenterLayoutMode);
    return () => window.removeEventListener("resize", updatePresenterLayoutMode);
  }, []);

  const setSidebarWidthFromPointer = useCallback((clientX: number) => {
    const bounds = presenterLayoutRef.current?.getBoundingClientRect();
    if (!bounds) return;

    const nextWidth = clampPresenterSidebarWidth(bounds.right - clientX, bounds.width);
    setSidebarWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth));
  }, []);

  useEffect(() => {
    if (!isResizingSidebar) return;

    const handlePointerMove = (event: PointerEvent) => {
      setSidebarWidthFromPointer(event.clientX);
    };

    const handlePointerUp = () => {
      setIsResizingSidebar(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizingSidebar, setSidebarWidthFromPointer]);

  const handleSidebarResizeStart = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;

      event.preventDefault();
      setSidebarWidthFromPointer(event.clientX);
      setIsResizingSidebar(true);
    },
    [setSidebarWidthFromPointer],
  );

  const handleSidebarResizeKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (!isWidePresenterLayout) return;

      let delta = 0;
      if (event.key === "ArrowLeft") delta = 16;
      if (event.key === "ArrowRight") delta = -16;
      if (event.key === "Home") delta = PRESENTER_SIDEBAR_WIDTH_MIN - sidebarWidth;
      if (event.key === "End") delta = PRESENTER_SIDEBAR_WIDTH_MAX - sidebarWidth;
      if (!delta) return;

      event.preventDefault();
      const containerWidth =
        presenterLayoutRef.current?.getBoundingClientRect().width ?? window.innerWidth;
      setSidebarWidth((currentWidth) =>
        clampPresenterSidebarWidth(currentWidth + delta, containerWidth),
      );
    },
    [isWidePresenterLayout, sidebarWidth],
  );

  const toggleOverlay = useCallback((overlay: Exclude<PresenterOverlay, null>) => {
    setActiveOverlay((value) => (value === overlay ? null : overlay));
  }, []);

  const closeOverlay = useCallback(() => {
    setActiveOverlay(null);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingElement(event.target)) return;

      if (!event.repeat) {
        shortcutHelpTriggerRef.current = registerShortcutHelpKeyDown(
          shortcutHelpTriggerRef.current,
          event.key,
        );
      }

      const key = event.key.toLowerCase();

      if (
        isShortcutHelpOpenKey({
          key: event.key,
          shiftKey: event.shiftKey,
          metaKey: event.metaKey,
          ctrlKey: event.ctrlKey,
          altKey: event.altKey,
        })
      ) {
        event.preventDefault();
        toggleOverlay("shortcuts-help");
        return;
      }

      if (key === "o") {
        if (!canOpenOverview) return;

        event.preventDefault();
        toggleOverlay("quick-overview");
        return;
      }

      if (key === "n") {
        if (!canControl) return;

        event.preventDefault();
        toggleOverlay("notes-overview");
        return;
      }

      if (key === "escape") closeOverlay();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (isTypingElement(event.target)) return;

      const result = registerShortcutHelpKeyUp(
        shortcutHelpTriggerRef.current,
        event.key,
        Date.now(),
      );
      shortcutHelpTriggerRef.current = result.nextState;

      if (!result.shouldToggle) return;

      toggleOverlay("shortcuts-help");
    };

    const onBlur = () => {
      shortcutHelpTriggerRef.current = createShortcutHelpTriggerState();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [canControl, canOpenOverview, closeOverlay, toggleOverlay]);

  const handleStageScaleChange = useCallback((value: number) => {
    setStageScale(parsePersistedPresenterStageScale(String(value)) ?? 1);
  }, []);

  const handleCursorModeChange = useCallback((value: PresenterCursorMode) => {
    setCursorMode(parsePersistedPresenterCursorMode(value) ?? "always");
  }, []);

  const presenterLayoutStyle = useMemo(
    () =>
      isWidePresenterLayout
        ? {
            gridTemplateColumns: `minmax(0, 1fr) ${PRESENTER_DIVIDER_WIDTH}px ${sidebarWidth}px`,
          }
        : undefined,
    [isWidePresenterLayout, sidebarWidth],
  );

  const shortcutHelpSections = useMemo(
    () =>
      buildShortcutHelpSections({
        canControl,
        canOpenOverview,
      }),
    [canControl, canOpenOverview],
  );

  const hideCursor = useIdleCursor({
    enabled: isPresenterRole && canControl && cursorMode === "idle-hide",
  });

  return {
    activeOverlay,
    stageScale,
    cursorMode,
    hideCursor,
    presenterLayoutRef,
    presenterLayoutStyle,
    isResizingSidebar,
    overviewOpen: activeOverlay === "quick-overview",
    notesOverviewOpen: activeOverlay === "notes-overview",
    shortcutsHelpOpen: activeOverlay === "shortcuts-help",
    timelinePreviewOpen: activeOverlay === "timeline-preview",
    shortcutHelpSections,
    handleStageScaleChange,
    handleCursorModeChange,
    handleSidebarResizeStart,
    handleSidebarResizeKeyDown,
    setActiveOverlay,
    toggleOverview: () => {
      if (!canOpenOverview) return;

      toggleOverlay("quick-overview");
    },
    toggleNotes: () => {
      if (!canControl) return;

      toggleOverlay("notes-overview");
    },
    toggleShortcuts: () => toggleOverlay("shortcuts-help"),
    toggleTimelinePreview: () => toggleOverlay("timeline-preview"),
    closeOverlay,
  };
}
