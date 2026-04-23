import { describe, expect, it } from "vite-plus/test";
import {
  DEFAULT_SLIDES_VIEWPORT,
  resolveSlidesViewportMeta,
} from "@slidev-react/core/slides/viewport";
import { resolveSlideTheme } from "../registry";
import { resolveThemeRootAttributes } from "../ThemeProvider";
import { defaultSlideThemeTokens, themeTokensToCssVars } from "../themeTokens";

describe("ThemeProvider root attributes", () => {
  it("keeps theme attributes when no viewport is provided", () => {
    const theme = resolveSlideTheme();

    expect(resolveThemeRootAttributes(theme)).toEqual({
      "data-slide-color-scheme": "light",
      "data-slide-theme": "default",
    });
  });

  it("adds a portrait orientation attribute for vertical decks", () => {
    const theme = resolveSlideTheme();
    const portraitViewport = resolveSlidesViewportMeta("3/4").viewport;

    expect(resolveThemeRootAttributes(theme, portraitViewport)).toEqual({
      "data-slide-color-scheme": "light",
      "data-slide-theme": "default",
      "data-slide-viewport-orientation": "portrait",
    });
  });

  it("adds a landscape orientation attribute for standard decks", () => {
    const theme = resolveSlideTheme();

    expect(resolveThemeRootAttributes(theme, DEFAULT_SLIDES_VIEWPORT)).toEqual({
      "data-slide-color-scheme": "light",
      "data-slide-theme": "default",
      "data-slide-viewport-orientation": "landscape",
    });
  });

  it("serializes theme tokens into shared css vars", () => {
    expect(themeTokensToCssVars(defaultSlideThemeTokens)).toMatchObject({
      "--font-sans": defaultSlideThemeTokens.fonts.sans,
      "--slide-ui-accent": defaultSlideThemeTokens.ui.accent,
      "--slide-color-body": "var(--slide-ui-text)",
      "--slide-chart-category-4": defaultSlideThemeTokens.chart.categorical[3],
      "--slide-diagram-primary": defaultSlideThemeTokens.diagram.primary,
      "--slide-insight-bg": defaultSlideThemeTokens.addons.insight.background,
    });
  });
});
