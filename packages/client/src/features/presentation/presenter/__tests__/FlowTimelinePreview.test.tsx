import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vite-plus/test";
import { AddonProvider } from "../../../../addons/AddonProvider";
import { DEFAULT_SLIDES_VIEWPORT } from "@slidev-react/core/slides/viewport";
import { ThemeProvider } from "../../../../theme/ThemeProvider";
import { FlowTimelinePreview } from "../FlowTimelinePreview";
import type { CompiledSlide } from "../types";

const demoSlide: CompiledSlide = {
  id: "timeline-demo",
  component: function DemoSlide() {
    return <div>Timeline Demo</div>;
  },
  meta: {
    title: "Timeline Demo",
  },
};

function renderPreview(props?: Partial<React.ComponentProps<typeof FlowTimelinePreview>>) {
  return renderToStaticMarkup(
    <ThemeProvider>
      <AddonProvider>
        <FlowTimelinePreview
          slide={demoSlide}
          currentClicks={1}
          currentClicksTotal={3}
          slidesConfig={{ slidesViewport: DEFAULT_SLIDES_VIEWPORT }}
          onJumpToCue={vi.fn()}
          {...props}
        />
      </AddonProvider>
    </ThemeProvider>,
  );
}

describe("FlowTimelinePreview", () => {
  it("renders timeline controls and cue nodes for the current slide", () => {
    const html = renderPreview();

    expect(html).toContain("Timeline Preview");
    expect(html).toContain("Start");
    expect(html).toContain("Cue 1");
    expect(html).toContain("Cue 3");
  });

  it("shows an empty-state message when the slide has no cue steps", () => {
    const html = renderPreview({
      currentClicks: 0,
      currentClicksTotal: 0,
    });

    expect(html).toContain("No cue steps detected on this slide yet.");
  });
});
