import { expect, test, vi } from "vite-plus/test";
import { render } from "vitest-browser-react";
import { DiagramFrame } from "../DiagramFrame";

test("renders children in ready state without overlays", async () => {
  await render(
    <DiagramFrame>
      <p data-testid="body">Body</p>
    </DiagramFrame>,
  );

  await expect.poll(() => document.querySelector('[data-testid="body"]')?.textContent).toBe("Body");
  expect(document.querySelector(".slide-diagram-frame__loading")).toBeNull();
  expect(document.querySelector(".slide-diagram-frame__error")).toBeNull();
});

test("shows the loading overlay in loading state", async () => {
  await render(<DiagramFrame state="loading" />);
  expect(document.querySelector(".slide-diagram-frame__loading")).not.toBeNull();
});

test("shows an error message and retry button when in error state", async () => {
  const retry = vi.fn();
  await render(<DiagramFrame state="error" errorMessage="Parse failed" onRetry={retry} />);

  const alert = document.querySelector('[role="alert"]');
  expect(alert?.textContent).toContain("Parse failed");
  document.querySelector<HTMLButtonElement>('[role="alert"] button')?.click();
  expect(retry).toHaveBeenCalledTimes(1);
});
