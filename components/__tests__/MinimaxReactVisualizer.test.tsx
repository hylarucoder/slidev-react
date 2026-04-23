import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vite-plus/test";
import {
  RevealProvider,
  type RevealContextValue,
} from "@/features/presentation/reveal/RevealContext";
import { MinimaxReactVisualizer } from "../MinimaxReactVisualizer";

function createRevealValue(step: number): RevealContextValue {
  return {
    slideId: "slide-visualizer",
    step,
    stepTotal: 4,
    setStep: vi.fn(),
    registerStep: vi.fn(() => () => {}),
    advance: vi.fn(),
    retreat: vi.fn(),
    canAdvance: step < 4,
    canRetreat: step > 0,
  };
}

describe("MinimaxReactVisualizer", () => {
  it("starts from the browser environment before reveal advances", () => {
    const html = renderToStaticMarkup(
      <RevealProvider value={createRevealValue(0)}>
        <MinimaxReactVisualizer />
      </RevealProvider>,
    );

    expect(html).toContain("浏览器运行时");
    expect(html).toContain(">42<");
  });

  it("advances to the state layer based on reveal steps", () => {
    const html = renderToStaticMarkup(
      <RevealProvider value={createRevealValue(4)}>
        <MinimaxReactVisualizer />
      </RevealProvider>,
    );

    expect(html).toContain("数据状态层");
    expect(html).toContain(">44<");
  });
});
