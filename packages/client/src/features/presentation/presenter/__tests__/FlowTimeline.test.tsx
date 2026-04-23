import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vite-plus/test";
import { AddonProvider } from "../../../../addons/AddonProvider";
import { DEFAULT_SLIDES_VIEWPORT } from "@slidev-react/core/slides/viewport";
import { ThemeProvider } from "../../../../theme/ThemeProvider";
import { FlowTimeline } from "../panels/FlowTimeline";
import type { CompiledSlide } from "../model/types";

const demoSlide: CompiledSlide = {
  id: "timeline-demo",
  component: function DemoSlide() {
    return <div>Timeline Demo</div>;
  },
  meta: {
    title: "Timeline Demo",
  },
};

function renderPreview(props?: Partial<React.ComponentProps<typeof FlowTimeline>>) {
  return renderToStaticMarkup(
    <ThemeProvider>
      <AddonProvider>
        <FlowTimeline
          slide={demoSlide}
          currentStep={1}
          currentStepTotal={3}
          slidesConfig={{ slidesViewport: DEFAULT_SLIDES_VIEWPORT }}
          onJumpToStep={vi.fn()}
          {...props}
        />
      </AddonProvider>
    </ThemeProvider>,
  );
}

describe("FlowTimeline", () => {
  it("renders timeline controls and step nodes for the current slide", () => {
    const html = renderPreview();

    expect(html).toContain("Timeline Preview");
    expect(html).toContain("Start");
    expect(html).toContain("Step 1");
    expect(html).toContain("Step 3");
  });

  it("shows an empty-state message when the slide has no reveal steps", () => {
    const html = renderPreview({
      currentStep: 0,
      currentStepTotal: 0,
    });

    expect(html).toContain("No reveal steps detected on this slide yet.");
  });
});
