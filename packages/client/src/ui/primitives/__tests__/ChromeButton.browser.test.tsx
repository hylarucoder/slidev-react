import { expect, test, vi } from "vite-plus/test";
import { render } from "vitest-browser-react";
import { ChromeButton } from "../ChromeButton";

test("renders leading / label / trailing slots and fires onClick", async () => {
  const handleClick = vi.fn();
  await render(
    <ChromeButton
      tone="active"
      leading={<span data-testid="leading">L</span>}
      trailing={<span data-testid="trailing">T</span>}
      onClick={handleClick}
    >
      Apply
    </ChromeButton>,
  );

  await expect.poll(() => document.querySelector('[data-testid="leading"]')?.textContent).toBe("L");
  await expect
    .poll(() => document.querySelector('[data-testid="trailing"]')?.textContent)
    .toBe("T");

  document.querySelector<HTMLButtonElement>("button")?.click();
  await expect.poll(() => handleClick.mock.calls.length).toBe(1);
});

test("disabled state reports aria-disabled and swallows clicks", async () => {
  const handleClick = vi.fn();
  await render(
    <ChromeButton disabled onClick={handleClick}>
      Stay put
    </ChromeButton>,
  );

  const button = document.querySelector<HTMLButtonElement>("button");
  expect(button?.disabled).toBe(true);

  button?.click();
  expect(handleClick).not.toHaveBeenCalled();
});
