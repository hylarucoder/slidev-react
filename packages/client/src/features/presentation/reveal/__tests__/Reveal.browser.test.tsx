import { expect, test, vi } from "vite-plus/test";
import { render } from "vitest-browser-react";
import { RevealProvider, type RevealContextValue } from "../RevealContext";
import { Step } from "../Reveal";

function createRevealValue(step: number, disableAnimation = true): RevealContextValue {
  return {
    slideId: "reveal-browser",
    step,
    stepTotal: 2,
    disableAnimation,
    setStep: vi.fn(),
    registerStep: vi.fn(() => () => {}),
    advance: vi.fn(),
    retreat: vi.fn(),
    canAdvance: step < 2,
    canRetreat: step > 0,
  };
}

test("mounts and unmounts step content as steps advance and retreat", async () => {
  const result = await render(
    <RevealProvider value={createRevealValue(0)}>
      <Step step={1} variant="slide-up" asChild>
        <p data-testid="step-node">First reveal</p>
      </Step>
    </RevealProvider>,
  );

  await expect.poll(() => document.querySelector('[data-testid="step-node"]')).toBeNull();

  await result.rerender(
    <RevealProvider value={createRevealValue(1)}>
      <Step step={1} variant="slide-up" asChild>
        <p data-testid="step-node">First reveal</p>
      </Step>
    </RevealProvider>,
  );

  await expect
    .poll(() =>
      document.querySelector('[data-testid="step-node"]')?.getAttribute("data-reveal-state"),
    )
    .toBe("visible");
  await expect
    .poll(() =>
      document.querySelector('[data-testid="step-node"]')?.getAttribute("data-reveal-variant"),
    )
    .toBe("slide-up");

  await result.rerender(
    <RevealProvider value={createRevealValue(0)}>
      <Step step={1} variant="slide-up" asChild>
        <p data-testid="step-node">First reveal</p>
      </Step>
    </RevealProvider>,
  );

  await expect.poll(() => document.querySelector('[data-testid="step-node"]')).toBeNull();
});

test("keeps reserve-space content mounted before its step and maps preset to the new variant model", async () => {
  await render(
    <RevealProvider value={createRevealValue(0)}>
      <Step step={1} preset="scale-in" reserveSpace asChild>
        <p data-testid="reserve-node">Reserved reveal</p>
      </Step>
    </RevealProvider>,
  );

  await expect
    .poll(() =>
      document.querySelector('[data-testid="reserve-node"]')?.getAttribute("data-reveal-state"),
    )
    .toBe("hidden");
  await expect
    .poll(() =>
      document.querySelector('[data-testid="reserve-node"]')?.getAttribute("data-reveal-variant"),
    )
    .toBe("scale-in");
  await expect
    .poll(() => document.querySelector('[data-testid="reserve-node"]')?.getAttribute("aria-hidden"))
    .toBe("true");
});
