import { expect, test } from "vite-plus/test";
import {
  buildSlideTheme,
  resolveCategoryPalette,
  resolveDivergingPalette,
  resolveHeatmapPalette,
  resolveSemanticColors,
  resolveSequentialPalette,
} from "../chartThemeTokens";
import type { SlideThemeTokens } from "../../../../theme/types";

const tokens: SlideThemeTokens = {
  fonts: {
    sans: "Avenir Next",
    serif: "Iowan Old Style",
    mono: "JetBrains Mono",
  },
  ui: {
    background: "#faf9f5",
    surface: "#f5f0e8",
    surfaceStrong: "#ede8df",
    text: "#141413",
    heading: "#141413",
    muted: "#6b5f4e",
    mutedSoft: "#b0aea5",
    accent: "#d97757",
    accentStrong: "#d4722b",
    accentSoft: "#ebd4cb",
    border: "rgba(20, 20, 19, 0.1)",
    borderStrong: "rgba(20, 20, 19, 0.16)",
  },
  feedback: {
    positive: "#788c5d",
    negative: "#b55a4e",
    warning: "#d4722b",
    info: "#6a9bcc",
    neutral: "#a9a59c",
  },
  chart: {
    accent: "#d97757",
    categorical: ["#d97757", "#6a9bcc", "#788c5d", "#c78b72", "#9f8d79", "#b8b2a6"],
    positive: "#788c5d",
    negative: "#b55a4e",
    warning: "#d4722b",
    neutral: "#a9a59c",
    axis: "rgba(20, 20, 19, 0.1)",
    grid: "#efe9df",
  },
  diagram: {
    primary: "#ebd4cb",
    primaryBorder: "#d97757",
    line: "#7a746a",
    surface: "#f5f0e8",
    surfaceAlt: "#efe9df",
    text: "#141413",
    note: "#f3e6c8",
    categorical: ["#d97757", "#6a9bcc", "#788c5d", "#c78b72", "#9f8d79", "#b8b2a6"],
    accent: "#d97757",
  },
  addons: {
    insight: {
      border: "rgba(120, 140, 93, 0.22)",
      background: "rgba(245, 240, 232, 0.96)",
      title: "#5a6349",
      text: "#2d2b28",
      shadow: "0 16px 38px rgba(72, 58, 43, 0.07)",
    },
  },
};

test("builds chart colors from theme tokens", () => {
  expect(resolveCategoryPalette(tokens)).toEqual([
    "#d97757",
    "#6a9bcc",
    "#788c5d",
    "#c78b72",
    "#9f8d79",
    "#b8b2a6",
    "#d97757",
    "#d4722b",
    "#a9a59c",
    "#6b5f4e",
  ]);
  expect(resolveSequentialPalette(tokens)).toEqual([
    "#f5f0e8",
    "#6a9bcc",
    "#788c5d",
    "#d97757",
    "#b8b2a6",
    "#b55a4e",
  ]);
  expect(resolveHeatmapPalette(tokens)).toEqual([
    "#f5f0e8",
    "#ebd4cb",
    "#6a9bcc",
    "#d97757",
    "#d4722b",
  ]);
  expect(resolveDivergingPalette(tokens)).toEqual([
    "#b55a4e",
    "#c78b72",
    "#f5f0e8",
    "#6a9bcc",
    "#788c5d",
  ]);
  expect(resolveSemanticColors(tokens)).toEqual({
    positive: "#788c5d",
    negative: "#b55a4e",
    warning: "#d4722b",
    neutral: "#a9a59c",
  });

  const theme = buildSlideTheme(tokens);

  expect(theme.color).toBe("#d97757");
  expect(theme.category10).toEqual([
    "#d97757",
    "#6a9bcc",
    "#788c5d",
    "#c78b72",
    "#9f8d79",
    "#b8b2a6",
    "#d97757",
    "#d4722b",
    "#a9a59c",
    "#6b5f4e",
  ]);
  expect(theme.category20).toHaveLength(20);
  expect(theme.axis?.labelFill).toBe("#6b5f4e");
  expect(theme.axis?.lineStroke).toBe("rgba(20, 20, 19, 0.1)");
  expect(theme.legendCategory?.titleFill).toBe("#141413");
});
