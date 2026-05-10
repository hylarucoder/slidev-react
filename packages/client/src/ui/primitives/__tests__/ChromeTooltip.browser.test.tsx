import { expect, test } from "vite-plus/test";
import { render } from "vitest-browser-react";
import { ChromeTooltip } from "../ChromeTooltip";

test("shows tooltip on focus and renders label + shortcut", async () => {
  await render(
    <ChromeTooltip label="Toggle draw" shortcut="D" delay={0}>
      <button type="button" data-testid="trigger">
        Draw
      </button>
    </ChromeTooltip>,
  );

  const trigger = document.querySelector<HTMLButtonElement>('[data-testid="trigger"]');
  expect(trigger).not.toBeNull();
  trigger?.focus();

  await expect
    .poll(() => document.querySelector<HTMLElement>('[role="tooltip"]')?.textContent)
    .toContain("Toggle draw");

  const tip = document.querySelector<HTMLElement>('[role="tooltip"]');
  expect(tip?.textContent).toContain("D");
  expect(trigger?.getAttribute("aria-describedby")).toBe(tip?.id ?? "");
});

test("hides tooltip on blur and noop when label is empty", async () => {
  await render(
    <ChromeTooltip label="Hidden" delay={0}>
      <button type="button" data-testid="hoverable">
        Hoverable
      </button>
    </ChromeTooltip>,
  );

  const trigger = document.querySelector<HTMLButtonElement>('[data-testid="hoverable"]');
  trigger?.focus();
  await expect.poll(() => document.querySelector('[role="tooltip"]')).not.toBeNull();

  trigger?.blur();
  await expect.poll(() => document.querySelector('[role="tooltip"]')).toBeNull();
});

test("returns child untouched when label is empty", async () => {
  const result = await render(
    <ChromeTooltip label="">
      <button type="button" data-testid="silent" aria-describedby="keep">
        Silent
      </button>
    </ChromeTooltip>,
  );

  const trigger = result.container.querySelector<HTMLButtonElement>('[data-testid="silent"]');
  expect(trigger?.getAttribute("aria-describedby")).toBe("keep");
  trigger?.focus();
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(document.querySelector('[role="tooltip"]')).toBeNull();
});
