import type { G2Theme } from "@antv/g2/esm/runtime/types/theme";

// ---------------------------------------------------------------------------
// Color palettes
// ---------------------------------------------------------------------------

const defaultCategoryPalette = [
  "#60a5fa",
  "#34d399",
  "#a78bfa",
  "#f472b6",
  "#fbbf24",
  "#f87171",
  "#22c55e",
  "#f59e0b",
  "#94a3b8",
  "#475569",
];

const defaultSequentialPalette = ["#dcfce7", "#86efac", "#4ade80", "#22c55e", "#15803d", "#052e16"];

const defaultDivergingPalette = ["#ef4444", "#fca5a5", "#fefce8", "#86efac", "#22c55e"];

const defaultSemanticColors = {
  positive: "#22c55e",
  negative: "#ef4444",
  warning: "#f59e0b",
  neutral: "#94a3b8",
};

// ---------------------------------------------------------------------------
// Resolve CSS variables at runtime
// ---------------------------------------------------------------------------

function resolveVar(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function resolvePaletteEntry(name: string, fallback: string) {
  return resolveVar(name, fallback);
}

export function resolveChartFont(): string {
  return resolveVar(
    "--font-sans",
    'Inter, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  );
}

export function resolveCategoryPalette() {
  return [
    resolvePaletteEntry("--slide-chart-category-1", defaultCategoryPalette[0]),
    resolvePaletteEntry("--slide-chart-category-2", defaultCategoryPalette[1]),
    resolvePaletteEntry("--slide-chart-category-3", defaultCategoryPalette[2]),
    resolvePaletteEntry("--slide-chart-category-4", defaultCategoryPalette[3]),
    resolvePaletteEntry("--slide-chart-category-5", defaultCategoryPalette[4]),
    resolvePaletteEntry("--slide-chart-category-6", defaultCategoryPalette[5]),
    resolvePaletteEntry("--slide-chart-accent", defaultCategoryPalette[6]),
    resolvePaletteEntry("--slide-chart-warning", defaultCategoryPalette[7]),
    resolvePaletteEntry("--slide-chart-neutral", defaultCategoryPalette[8]),
    defaultCategoryPalette[9],
  ];
}

export function resolveSequentialPalette() {
  return [
    resolvePaletteEntry("--slide-diagram-surface", defaultSequentialPalette[0]),
    resolvePaletteEntry("--slide-chart-category-2", defaultSequentialPalette[1]),
    resolvePaletteEntry("--slide-chart-positive", defaultSequentialPalette[2]),
    resolvePaletteEntry("--slide-chart-accent", defaultSequentialPalette[3]),
    resolvePaletteEntry("--slide-chart-category-6", defaultSequentialPalette[4]),
    defaultSequentialPalette[5],
  ];
}

export function resolveDivergingPalette() {
  return [
    resolvePaletteEntry("--slide-chart-negative", defaultDivergingPalette[0]),
    resolvePaletteEntry("--slide-chart-category-4", defaultDivergingPalette[1]),
    resolvePaletteEntry("--slide-diagram-surface", defaultDivergingPalette[2]),
    resolvePaletteEntry("--slide-chart-category-2", defaultDivergingPalette[3]),
    resolvePaletteEntry("--slide-chart-positive", defaultDivergingPalette[4]),
  ];
}

export function resolveSemanticColors() {
  return {
    positive: resolvePaletteEntry("--slide-chart-positive", defaultSemanticColors.positive),
    negative: resolvePaletteEntry("--slide-chart-negative", defaultSemanticColors.negative),
    warning: resolvePaletteEntry("--slide-chart-warning", defaultSemanticColors.warning),
    neutral: resolvePaletteEntry("--slide-chart-neutral", defaultSemanticColors.neutral),
  };
}

// ---------------------------------------------------------------------------
// Build G2 theme
// ---------------------------------------------------------------------------

export function buildSlidevTheme(): G2Theme {
  const font = resolveChartFont();
  const textColor = resolveVar("--slide-color-body", "#0f172a");
  const mutedColor = resolveVar("--slide-color-muted", "#475569");
  const accent = resolveVar("--slide-chart-accent", "#22c55e");
  const categoryPalette = resolveCategoryPalette();
  const semanticColors = resolveSemanticColors();
  const axisStroke = resolveVar("--slide-absolutely-line", "#dfe4ea");
  const axisGrid = resolveVar("--slide-diagram-surface-alt", "#e8ecf1");

  return {
    color: accent,
    category10: categoryPalette,
    category20: [...categoryPalette, ...categoryPalette],
    axis: {
      labelFontSize: 12,
      labelFill: mutedColor,
      labelFontFamily: font,
      titleFontSize: 13,
      titleFill: mutedColor,
      titleFontFamily: font,
      titleFontWeight: "normal",
      gridStroke: axisGrid,
      gridStrokeOpacity: 0.6,
      lineStroke: axisStroke,
      lineLineWidth: 1,
      tickStroke: axisStroke,
    },
    legendCategory: {
      itemLabelFontSize: 13,
      itemLabelFill: mutedColor,
      itemLabelFontFamily: font,
      titleFontSize: 14,
      titleFill: textColor,
      titleFontFamily: font,
      titleFontWeight: "bold",
    },
    title: {
      titleFontSize: 18,
      titleFill: textColor,
      titleFontFamily: font,
      titleFontWeight: "bold",
      subtitleFontSize: 14,
      subtitleFill: mutedColor,
      subtitleFontFamily: font,
    },
    label: {
      fontSize: 12,
      fontFamily: font,
      fill: mutedColor,
    },
    point: {
      fillOpacity: 0.92,
    },
    interval: {
      fillOpacity: 0.94,
    },
    area: {
      fillOpacity: 0.72,
    },
    line: {
      lineWidth: 2.5,
    },
    annotationBadge: {
      backgroundFill: semanticColors.neutral,
      textFill: "#ffffff",
    },
  };
}

// ---------------------------------------------------------------------------
// Default sizes
// ---------------------------------------------------------------------------

export type ChartSize = "full" | "wide" | "half" | "compact" | "mini";

export const sizePresets: Record<ChartSize, { width: number; height: number }> = {
  full: { width: 1280, height: 600 },
  wide: { width: 1280, height: 500 },
  half: { width: 600, height: 400 },
  compact: { width: 400, height: 300 },
  mini: { width: 200, height: 80 },
};
