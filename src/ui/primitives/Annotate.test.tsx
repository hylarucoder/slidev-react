import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { RevealProvider, type RevealContextValue } from "../../features/reveal/RevealContext";
import { Annotate } from "./Annotate";

function createRevealValue(clicks: number): RevealContextValue {
  return {
    slideId: "slide-annotation",
    clicks,
    clicksTotal: 2,
    setClicks: vi.fn(),
    registerStep: vi.fn(() => () => {}),
    advance: vi.fn(),
    retreat: vi.fn(),
    canAdvance: true,
    canRetreat: clicks > 0,
  };
}

describe("Annotate", () => {
  it("keeps text visible before its reveal step", () => {
    const html = renderToStaticMarkup(
      <RevealProvider value={createRevealValue(0)}>
        <Annotate type="underline" revealStep={1}>
          reveal copy
        </Annotate>
      </RevealProvider>,
    );

    expect(html).toContain("reveal copy");
    expect(html).not.toContain("slide-mark-overlay");
    expect(html).not.toContain("slide-mark-bracket");
  });

  it("renders an animated mark after the reveal step is reached", () => {
    const html = renderToStaticMarkup(
      <RevealProvider value={createRevealValue(1)}>
        <Annotate type="underline" revealStep={1}>
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
        <Annotate type="box" revealStep={1} animate={false}>
          instant reveal
        </Annotate>
      </RevealProvider>,
    );

    expect(html).toContain("slide-mark--box");
    expect(html).not.toContain("slide-mark--animate");
    expect(html).toContain("slide-mark-overlay");
  });
});
