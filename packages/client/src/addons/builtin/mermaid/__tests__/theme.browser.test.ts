import { expect, test } from "vite-plus/test";
import {
  resolveMermaidFrameStyle,
  resolveMermaidMutedSurfaceStyle,
  resolveMermaidSurfaceStyle,
  resolveMermaidThemeVariables,
} from "../MermaidDiagram";
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

test("resolves diagram tokens from theme tokens", () => {
  const themeVariables = resolveMermaidThemeVariables(tokens);
  const surfaceStyle = resolveMermaidSurfaceStyle(tokens);
  const frameStyle = resolveMermaidFrameStyle(tokens);
  const mutedSurfaceStyle = resolveMermaidMutedSurfaceStyle(tokens);

  expect(themeVariables.fontFamily).toBe("Avenir Next");
  expect(themeVariables.primaryColor).toBe("rgba(217, 119, 87, 0.16)");
  expect(themeVariables.primaryBorderColor).toBe("#d97757");
  expect(themeVariables.lineColor).toBe("#7a746a");
  expect(themeVariables.mainBkg).toBe("#f5f0e8");
  expect(themeVariables.noteBkgColor).toBe("#f3e6c8");
  expect(themeVariables.git0).toBe("#d97757");
  expect(themeVariables.git5).toBe("#a9a59c");
  expect(themeVariables.cScale1).toBe("rgba(106, 155, 204, 0.16)");
  expect(themeVariables.fillType6).toBe("#efe9df");
  expect(surfaceStyle).toEqual({
    color: "#141413",
    fontFamily: "Avenir Next",
  });
  expect(frameStyle).toEqual({
    borderColor: "rgba(20, 20, 19, 0.1)",
    background: "#f5f0e8",
  });
  expect(mutedSurfaceStyle).toEqual({
    borderColor: "rgba(20, 20, 19, 0.1)",
    background: "#efe9df",
    color: "#7a746a",
  });
});
