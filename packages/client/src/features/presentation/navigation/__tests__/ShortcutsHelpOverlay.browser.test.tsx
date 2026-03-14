import { expect, test } from "vitest";
import { page } from "@vitest/browser/context";
import { render } from "vitest-browser-react";
import { ShortcutsHelpOverlay } from "../ShortcutsHelpOverlay";
import { buildShortcutHelpSections } from "../keyboardShortcuts";

test("renders keyboard shortcuts overlay in a real browser", async () => {
  const sections = buildShortcutHelpSections({
    canControl: true,
    canOpenOverview: true,
  });

  render(<ShortcutsHelpOverlay open sections={sections} onClose={() => {}} />);

  await expect
    .element(page.getByRole("heading", { name: /everything the runtime can do/i }))
    .toBeInTheDocument();
  await expect.element(page.getByText(/Toggle quick overview/)).toBeInTheDocument();
  await expect.element(page.getByText(/Toggle draw mode/)).toBeInTheDocument();
});

test("does not render content when closed", async () => {
  const sections = buildShortcutHelpSections({
    canControl: true,
    canOpenOverview: true,
  });

  const result = await render(
    <ShortcutsHelpOverlay open={false} sections={sections} onClose={() => {}} />,
  );

  expect(result.container.innerHTML).toBe("");
});
