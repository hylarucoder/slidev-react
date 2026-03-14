import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import { ShortcutsHelpOverlay } from "../ShortcutsHelpOverlay";
import { buildShortcutHelpSections } from "../keyboardShortcuts";

describe("ShortcutsHelpOverlay", () => {
  it("renders the supported shortcut groups and help triggers", () => {
    const html = renderToStaticMarkup(
      <ShortcutsHelpOverlay
        open
        sections={buildShortcutHelpSections({
          canControl: true,
          canOpenOverview: true,
        })}
        onClose={() => {}}
      />,
    );

    expect(html).toContain("Keyboard Shortcuts");
    expect(html).toContain("Shift Shift");
    expect(html).toContain("Toggle quick overview");
    expect(html).toContain("Toggle draw mode");
  });
});
