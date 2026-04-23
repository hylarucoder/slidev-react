import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vite-plus/test";
import {
  RevealProvider,
  type RevealContextValue,
} from "../../../features/presentation/reveal/RevealContext";
import { Annotate } from "../Annotate";

function createRevealValue(step: number): RevealContextValue {
  return {
    slideId: "slide-annotation",
    step,
    stepTotal: 2,
    setStep: vi.fn(),
    registerStep: vi.fn(() => () => {}),
    advance: vi.fn(),
    retreat: vi.fn(),
    canAdvance: true,
    canRetreat: step > 0,
  };
}

describe("Annotate", () => {
  it("keeps text visible before its reveal step", () => {
    const html = renderToStaticMarkup(
      <RevealProvider value={createRevealValue(0)}>
        <Annotate type="underline" step={1}>
          reveal copy
        </Annotate>
      </RevealProvider>,
    );

    expect(html).toContain("reveal copy");
    expect(html).not.toContain("slide-mark-overlay");
  });

  it("renders an animated mark after the reveal step is reached", () => {
    const html = renderToStaticMarkup(
      <RevealProvider value={createRevealValue(1)}>
        <Annotate type="underline" step={1}>
          reveal copy
        </Annotate>
      </RevealProvider>,
    );

    expect(html).toContain("slide-mark--underline");
    expect(html).toContain("slide-mark--animate");
    expect(html).toContain("slide-mark-overlay");
  });

  it("can reveal instantly without playback animation", () => {
    const html = renderToStaticMarkup(
      <RevealProvider value={createRevealValue(1)}>
        <Annotate type="box" step={1} animate={false}>
          instant reveal
        </Annotate>
      </RevealProvider>,
    );

    expect(html).toContain("slide-mark--box");
    expect(html).not.toContain("slide-mark--animate");
    expect(html).toContain("slide-mark-overlay");
  });
});
