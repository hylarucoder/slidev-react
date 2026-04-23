export const SHORTCUT_HELP_DOUBLE_SHIFT_MS = 400;

export type NavigationShortcutAction = "advance" | "retreat" | "first" | "last";

export type DrawShortcutAction =
  | "toggle"
  | "exit"
  | "tool-pen"
  | "tool-eraser"
  | "tool-circle"
  | "tool-rectangle"
  | "clear"
  | "undo";

export function resolveDrawShortcutAction({
  key,
  metaKey,
  ctrlKey,
  altKey,
  drawEnabled,
}: {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  drawEnabled: boolean;
}): DrawShortcutAction | null {
  if ((metaKey || ctrlKey) && !altKey && key.toLowerCase() === "z") return "undo";
  if (metaKey || ctrlKey || altKey) return null;

  const lowered = key.toLowerCase();

  if (lowered === "d") return "toggle";
  if (lowered === "escape" && drawEnabled) return "exit";
  if (lowered === "p") return "tool-pen";
  if (lowered === "e") return "tool-eraser";
  if (lowered === "b") return "tool-circle";
  if (lowered === "r") return "tool-rectangle";
  if (lowered === "c" && drawEnabled) return "clear";

  return null;
}

export type ShortcutHelpItem = {
  keys: string;
  action: string;
};

export type ShortcutHelpSection = {
  title: string;
  description: string;
  items: ShortcutHelpItem[];
};

export type ShortcutHelpTriggerState = {
  shiftPressed: boolean;
  shiftChordActive: boolean;
  lastIsolatedShiftAt: number | null;
};

export function resolveNavigationShortcutAction({
  key,
  shiftKey,
}: {
  key: string;
  shiftKey: boolean;
}): NavigationShortcutAction | null {
  if (key === "ArrowRight" || key === "PageDown") return "advance";
  if (key === "ArrowLeft" || key === "PageUp") return "retreat";
  if (key === "Home") return "first";
  if (key === "End") return "last";
  if (key === " ") return shiftKey ? "retreat" : "advance";

  return null;
}

export function createShortcutHelpTriggerState(): ShortcutHelpTriggerState {
  return {
    shiftPressed: false,
    shiftChordActive: false,
    lastIsolatedShiftAt: null,
  };
}

export function registerShortcutHelpKeyDown(
  state: ShortcutHelpTriggerState,
  key: string,
): ShortcutHelpTriggerState {
  if (key === "Shift") {
    return {
      ...state,
      shiftPressed: true,
      shiftChordActive: false,
    };
  }

  if (!state.shiftPressed) return state;

  return {
    ...state,
    shiftChordActive: true,
  };
}

export function registerShortcutHelpKeyUp(
  state: ShortcutHelpTriggerState,
  key: string,
  releasedAt: number,
  thresholdMs = SHORTCUT_HELP_DOUBLE_SHIFT_MS,
) {
  if (key !== "Shift") {
    return {
      nextState: state,
      shouldToggle: false,
    };
  }

  const isolatedTap = state.shiftPressed && !state.shiftChordActive;
  const shouldToggle =
    isolatedTap &&
    state.lastIsolatedShiftAt != null &&
    releasedAt - state.lastIsolatedShiftAt <= thresholdMs;

  return {
    nextState: {
      shiftPressed: false,
      shiftChordActive: false,
      lastIsolatedShiftAt: isolatedTap
        ? shouldToggle
          ? null
          : releasedAt
        : state.lastIsolatedShiftAt,
    },
    shouldToggle,
  };
}

export function isShortcutHelpOpenKey({
  key,
  shiftKey,
  metaKey,
  ctrlKey,
  altKey,
}: {
  key: string;
  shiftKey: boolean;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
}) {
  if (metaKey || ctrlKey || altKey) return false;

  return key === "?" || (key === "/" && shiftKey);
}

export function buildShortcutHelpSections({
  canControl,
  canOpenOverview,
}: {
  canControl: boolean;
  canOpenOverview: boolean;
}): ShortcutHelpSection[] {
  const sections: ShortcutHelpSection[] = [
    {
      title: "Navigation",
      description: "Move through the slides without leaving the keyboard.",
      items: [
        {
          keys: "Right / Space / PageDown",
          action: "Next cue or next slide",
        },
        {
          keys: "Left / Shift + Space / PageUp",
          action: "Previous cue or previous slide",
        },
        {
          keys: "Home",
          action: "Jump to the first slide",
        },
        {
          keys: "End",
          action: "Jump to the last slide",
        },
      ],
    },
    {
      title: "Overlays",
      description: "Open, switch, and close the main workspaces.",
      items: [
        {
          keys: "?",
          action: "Toggle keyboard shortcuts help",
        },
        {
          keys: "Shift Shift",
          action: "Toggle keyboard shortcuts help",
        },
        {
          keys: "Esc",
          action: "Close the current overlay",
        },
        ...(canOpenOverview
          ? [
              {
                keys: "O",
                action: "Toggle quick overview",
              },
            ]
          : []),
        ...(canControl
          ? [
              {
                keys: "N",
                action: "Toggle notes workspace",
              },
            ]
          : []),
      ],
    },
  ];

  if (canControl) {
    sections.push({
      title: "Draw",
      description: "Control live annotation tools while presenting.",
      items: [
        {
          keys: "D",
          action: "Toggle draw mode",
        },
        {
          keys: "P",
          action: "Switch to pen",
        },
        {
          keys: "B",
          action: "Switch to circle",
        },
        {
          keys: "R",
          action: "Switch to rectangle",
        },
        {
          keys: "E",
          action: "Switch to eraser",
        },
        {
          keys: "C",
          action: "Clear strokes on the current slide",
        },
        {
          keys: "Cmd/Ctrl + Z",
          action: "Undo the last stroke",
        },
      ],
    });
  }

  return sections;
}
