import { expect, test } from "vitest";
import { resolveMermaidSurfaceStyle, resolveMermaidThemeVariables } from "../MermaidDiagram";

const themedProperties = [
  "--font-sans",
  "--slide-diagram-primary",
  "--slide-diagram-primary-border",
  "--slide-diagram-line",
  "--slide-diagram-surface",
  "--slide-diagram-surface-alt",
  "--slide-diagram-text",
  "--slide-diagram-note",
  "--slide-chart-category-1",
  "--slide-chart-category-2",
  "--slide-chart-category-3",
  "--slide-chart-category-4",
  "--slide-chart-category-5",
  "--slide-chart-category-6",
  "--slide-chart-accent",
];

function resetThemeProperties() {
  for (const property of themedProperties) {
    document.documentElement.style.removeProperty(property);
  }
}

test("resolves diagram tokens from CSS custom properties", () => {
  resetThemeProperties();

  try {
    document.documentElement.style.setProperty("--font-sans", "Avenir Next");
    document.documentElement.style.setProperty("--slide-diagram-primary", "#eacfc0");
    document.documentElement.style.setProperty("--slide-diagram-primary-border", "#c56e45");
    document.documentElement.style.setProperty("--slide-diagram-line", "#6d635d");
    document.documentElement.style.setProperty("--slide-diagram-surface", "#fff8ef");
    document.documentElement.style.setProperty("--slide-diagram-surface-alt", "#f0e7dc");
    document.documentElement.style.setProperty("--slide-diagram-text", "#1f1a17");
    document.documentElement.style.setProperty("--slide-diagram-note", "#f4e4bf");
    document.documentElement.style.setProperty("--slide-chart-category-1", "#c56e45");
    document.documentElement.style.setProperty("--slide-chart-category-2", "#7c8a6a");
    document.documentElement.style.setProperty("--slide-chart-category-3", "#9b7e62");
    document.documentElement.style.setProperty("--slide-chart-category-4", "#d08b66");
    document.documentElement.style.setProperty("--slide-chart-category-5", "#b4977c");
    document.documentElement.style.setProperty("--slide-chart-category-6", "#7f6b5d");
    document.documentElement.style.setProperty("--slide-chart-accent", "#c56e45");

    const themeVariables = resolveMermaidThemeVariables();
    const surfaceStyle = resolveMermaidSurfaceStyle();

    expect(themeVariables.fontFamily).toBe("Avenir Next");
    expect(themeVariables.primaryColor).toBe("#eacfc0");
    expect(themeVariables.primaryBorderColor).toBe("#c56e45");
    expect(themeVariables.lineColor).toBe("#6d635d");
    expect(themeVariables.mainBkg).toBe("#fff8ef");
    expect(themeVariables.noteBkgColor).toBe("#f4e4bf");
    expect(themeVariables.git0).toBe("#c56e45");
    expect(themeVariables.git5).toBe("#7f6b5d");
    expect(themeVariables.fillType6).toBe("#c56e45");
    expect(surfaceStyle).toEqual({
      color: "#1f1a17",
      fontFamily: "Avenir Next",
    });
  } finally {
    resetThemeProperties();
  }
});
