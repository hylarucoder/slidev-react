import { expect, test, vi } from "vite-plus/test";
import { render } from "vitest-browser-react";
import { OverlayShell } from "../OverlayShell";

test("renders dialog with title and description when open", async () => {
  await render(
    <OverlayShell open title="Greeting" description="Say hello" onClose={() => {}}>
      <p data-testid="body">Body</p>
    </OverlayShell>,
  );

  const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
  expect(dialog).not.toBeNull();
  expect(dialog?.getAttribute("aria-modal")).toBe("true");
  await expect.poll(() => document.querySelector('[data-testid="body"]')?.textContent).toBe("Body");
});

test("renders nothing when closed", async () => {
  const result = await render(
    <OverlayShell open={false} title="Hidden" onClose={() => {}}>
      <p>Not visible</p>
    </OverlayShell>,
  );

  expect(result.container.innerHTML).toBe("");
});

test("invokes onClose when Escape is pressed", async () => {
  const onClose = vi.fn();
  await render(
    <OverlayShell open title="Escapable" onClose={onClose}>
      <button type="button" data-testid="inner">
        Inner
      </button>
    </OverlayShell>,
  );

  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  await expect.poll(() => onClose.mock.calls.length).toBe(1);
});
