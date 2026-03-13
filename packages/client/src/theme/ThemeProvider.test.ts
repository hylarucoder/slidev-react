import { describe, expect, it } from "vitest";
import {
  DEFAULT_SLIDES_VIEWPORT,
  resolveSlidesViewportMeta,
} from "@slidev-react/core/slides/viewport";
import { resolveSlideTheme } from "./registry";
import { resolveThemeRootAttributes } from "./ThemeProvider";

describe("ThemeProvider root attributes", () => {
  it("keeps theme attributes when no viewport is provided", () => {
    const theme = resolveSlideTheme();

    expect(resolveThemeRootAttributes(theme)).toEqual({
      "data-slide-theme": "default",
    });
  });

  it("adds a portrait orientation attribute for vertical decks", () => {
    const theme = resolveSlideTheme();
    const portraitViewport = resolveSlidesViewportMeta("3/4").viewport;

    expect(resolveThemeRootAttributes(theme, portraitViewport)).toEqual({
      "data-slide-theme": "default",
      "data-slide-viewport-orientation": "portrait",
    });
  });

  it("adds a landscape orientation attribute for standard decks", () => {
    const theme = resolveSlideTheme();

    expect(resolveThemeRootAttributes(theme, DEFAULT_SLIDES_VIEWPORT)).toEqual({
      "data-slide-theme": "default",
      "data-slide-viewport-orientation": "landscape",
    });
  });
});
