import { describe, expect, it } from "vite-plus/test";
import {
  buildShortcutHelpSections,
  createShortcutHelpTriggerState,
  isShortcutHelpOpenKey,
  registerShortcutHelpKeyDown,
  registerShortcutHelpKeyUp,
  resolveNavigationShortcutAction,
} from "../keyboardShortcuts";

describe("keyboardShortcuts", () => {
  it("treats shift+space as retreat and plain space as advance", () => {
    expect(resolveNavigationShortcutAction({ key: " ", shiftKey: false })).toBe("advance");
    expect(resolveNavigationShortcutAction({ key: " ", shiftKey: true })).toBe("retreat");
  });

  it("detects question-mark help shortcut without modifiers", () => {
    expect(
      isShortcutHelpOpenKey({
        key: "?",
        shiftKey: true,
        metaKey: false,
        ctrlKey: false,
        altKey: false,
      }),
    ).toBe(true);

    expect(
      isShortcutHelpOpenKey({
        key: "?",
        shiftKey: true,
        metaKey: true,
        ctrlKey: false,
        altKey: false,
      }),
    ).toBe(false);
  });

  it("toggles on an isolated double shift tap", () => {
    let state = createShortcutHelpTriggerState();

    state = registerShortcutHelpKeyDown(state, "Shift");
    let result = registerShortcutHelpKeyUp(state, "Shift", 100);
    expect(result.shouldToggle).toBe(false);

    state = registerShortcutHelpKeyDown(result.nextState, "Shift");
    result = registerShortcutHelpKeyUp(state, "Shift", 320);
    expect(result.shouldToggle).toBe(true);
  });

  it("does not toggle when shift was used as part of another shortcut chord", () => {
    let state = createShortcutHelpTriggerState();

    state = registerShortcutHelpKeyDown(state, "Shift");
    state = registerShortcutHelpKeyDown(state, "/");

    const result = registerShortcutHelpKeyUp(state, "Shift", 220);
    expect(result.shouldToggle).toBe(false);
  });

  it("only includes draw shortcuts when local control is available", () => {
    const viewerSections = buildShortcutHelpSections({
      canControl: false,
      canOpenOverview: true,
    });
    const presenterSections = buildShortcutHelpSections({
      canControl: true,
      canOpenOverview: true,
    });

    expect(viewerSections.some((section) => section.title === "Draw")).toBe(false);
    expect(presenterSections.some((section) => section.title === "Draw")).toBe(true);
  });
});
