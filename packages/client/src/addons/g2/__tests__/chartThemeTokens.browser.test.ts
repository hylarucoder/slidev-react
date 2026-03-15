import { expect, test } from "vitest";
import {
  buildSlidevTheme,
  resolveCategoryPalette,
  resolveDivergingPalette,
  resolveSemanticColors,
  resolveSequentialPalette,
} from "../chartThemeTokens";

const themedProperties = [
  "--slide-color-body",
  "--slide-color-muted",
  "--slide-chart-accent",
  "--slide-chart-category-1",
  "--slide-chart-category-2",
  "--slide-chart-category-3",
  "--slide-chart-category-4",
  "--slide-chart-category-5",
  "--slide-chart-category-6",
  "--slide-chart-positive",
  "--slide-chart-negative",
  "--slide-chart-warning",
  "--slide-chart-neutral",
  "--slide-absolutely-line",
  "--slide-diagram-surface",
  "--slide-diagram-surface-alt",
];

function resetThemeProperties() {
  for (const property of themedProperties) {
    document.documentElement.style.removeProperty(property);
  }
}

test("builds chart colors from active theme variables", () => {
  resetThemeProperties();

  try {
    document.documentElement.style.setProperty("--slide-color-body", "#1f1a17");
    document.documentElement.style.setProperty("--slide-color-muted", "#6a6058");
    document.documentElement.style.setProperty("--slide-chart-accent", "#c56e45");
    document.documentElement.style.setProperty("--slide-chart-category-1", "#c56e45");
    document.documentElement.style.setProperty("--slide-chart-category-2", "#7c8a6a");
    document.documentElement.style.setProperty("--slide-chart-category-3", "#9b7e62");
    document.documentElement.style.setProperty("--slide-chart-category-4", "#d08b66");
    document.documentElement.style.setProperty("--slide-chart-category-5", "#b4977c");
    document.documentElement.style.setProperty("--slide-chart-category-6", "#7f6b5d");
    document.documentElement.style.setProperty("--slide-chart-positive", "#7c8a6a");
    document.documentElement.style.setProperty("--slide-chart-negative", "#b25c4f");
    document.documentElement.style.setProperty("--slide-chart-warning", "#d0934f");
    document.documentElement.style.setProperty("--slide-chart-neutral", "#9e8f82");
    document.documentElement.style.setProperty("--slide-absolutely-line", "rgba(31, 26, 23, 0.12)");
    document.documentElement.style.setProperty("--slide-diagram-surface", "#fff8ef");
    document.documentElement.style.setProperty("--slide-diagram-surface-alt", "#f1e6d7");

    expect(resolveCategoryPalette()).toEqual([
      "#c56e45",
      "#7c8a6a",
      "#9b7e62",
      "#d08b66",
      "#b4977c",
      "#7f6b5d",
      "#c56e45",
      "#d0934f",
      "#9e8f82",
      "#475569",
    ]);
    expect(resolveSequentialPalette()).toEqual([
      "#fff8ef",
      "#7c8a6a",
      "#7c8a6a",
      "#c56e45",
      "#7f6b5d",
      "#052e16",
    ]);
    expect(resolveDivergingPalette()).toEqual([
      "#b25c4f",
      "#d08b66",
      "#fff8ef",
      "#7c8a6a",
      "#7c8a6a",
    ]);
    expect(resolveSemanticColors()).toEqual({
      positive: "#7c8a6a",
      negative: "#b25c4f",
      warning: "#d0934f",
      neutral: "#9e8f82",
    });

    const theme = buildSlidevTheme();

    expect(theme.color).toBe("#c56e45");
    expect(theme.category10).toEqual([
      "#c56e45",
      "#7c8a6a",
      "#9b7e62",
      "#d08b66",
      "#b4977c",
      "#7f6b5d",
      "#c56e45",
      "#d0934f",
      "#9e8f82",
      "#475569",
    ]);
    expect(theme.category20).toHaveLength(20);
    expect(theme.axis?.labelFill).toBe("#6a6058");
    expect(theme.axis?.lineStroke).toBe("rgba(31, 26, 23, 0.12)");
    expect(theme.legendCategory?.titleFill).toBe("#1f1a17");
  } finally {
    resetThemeProperties();
  }
});
