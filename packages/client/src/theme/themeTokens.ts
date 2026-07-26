import { kamiThemeTokens } from "./builtin/kami/tokens";
import type { SlideThemeTokens } from "./types";

/**
 * Kami is the default design language, so the fallback tokens are Kami's own.
 * Keep this an alias rather than a copy — a second palette here would drift.
 * The matching CSS-level fallbacks live in the `:root` block of `tokens.css`.
 */
export const defaultSlideThemeTokens: SlideThemeTokens = kamiThemeTokens;

export function themeTokensToCssVars(tokens: SlideThemeTokens): Record<string, string> {
  return {
    "--font-sans": tokens.fonts.sans,
    "--font-serif": tokens.fonts.serif,
    "--font-mono": tokens.fonts.mono,
    "--slide-ui-background": tokens.ui.background,
    "--slide-ui-surface": tokens.ui.surface,
    "--slide-ui-surface-strong": tokens.ui.surfaceStrong,
    "--slide-ui-text": tokens.ui.text,
    "--slide-ui-heading": tokens.ui.heading,
    "--slide-ui-muted": tokens.ui.muted,
    "--slide-ui-muted-soft": tokens.ui.mutedSoft,
    "--slide-ui-accent": tokens.ui.accent,
    "--slide-ui-accent-strong": tokens.ui.accentStrong,
    "--slide-ui-accent-soft": tokens.ui.accentSoft,
    "--slide-ui-border": tokens.ui.border,
    "--slide-ui-border-strong": tokens.ui.borderStrong,
    "--slide-feedback-positive": tokens.feedback.positive,
    "--slide-feedback-negative": tokens.feedback.negative,
    "--slide-feedback-warning": tokens.feedback.warning,
    "--slide-feedback-info": tokens.feedback.info,
    "--slide-feedback-neutral": tokens.feedback.neutral,
    "--slide-chart-accent": tokens.chart.accent,
    "--slide-chart-category-1": tokens.chart.categorical[0],
    "--slide-chart-category-2": tokens.chart.categorical[1],
    "--slide-chart-category-3": tokens.chart.categorical[2],
    "--slide-chart-category-4": tokens.chart.categorical[3],
    "--slide-chart-category-5": tokens.chart.categorical[4],
    "--slide-chart-category-6": tokens.chart.categorical[5],
    "--slide-chart-positive": tokens.chart.positive,
    "--slide-chart-negative": tokens.chart.negative,
    "--slide-chart-warning": tokens.chart.warning,
    "--slide-chart-neutral": tokens.chart.neutral,
    "--slide-chart-axis": tokens.chart.axis,
    "--slide-chart-grid": tokens.chart.grid,
    "--slide-diagram-primary": tokens.diagram.primary,
    "--slide-diagram-primary-border": tokens.diagram.primaryBorder,
    "--slide-diagram-line": tokens.diagram.line,
    "--slide-diagram-surface": tokens.diagram.surface,
    "--slide-diagram-surface-alt": tokens.diagram.surfaceAlt,
    "--slide-diagram-text": tokens.diagram.text,
    "--slide-diagram-note": tokens.diagram.note,
    "--slide-diagram-category-1": tokens.diagram.categorical[0],
    "--slide-diagram-category-2": tokens.diagram.categorical[1],
    "--slide-diagram-category-3": tokens.diagram.categorical[2],
    "--slide-diagram-category-4": tokens.diagram.categorical[3],
    "--slide-diagram-category-5": tokens.diagram.categorical[4],
    "--slide-diagram-category-6": tokens.diagram.categorical[5],
    "--slide-diagram-accent": tokens.diagram.accent,
    "--slide-insight-border": tokens.addons.insight.border,
    "--slide-insight-bg": tokens.addons.insight.background,
    "--slide-insight-title": tokens.addons.insight.title,
    "--slide-insight-text": tokens.addons.insight.text,
    "--slide-insight-shadow": tokens.addons.insight.shadow,
    "--slide-color-body": "var(--slide-ui-text)",
    "--slide-color-heading": "var(--slide-ui-heading)",
    "--slide-color-muted": "var(--slide-ui-muted)",
    "--slide-link-decoration-color": "color-mix(in srgb, var(--slide-ui-accent) 28%, transparent)",
    "--slide-link-decoration-color-hover":
      "color-mix(in srgb, var(--slide-ui-accent) 52%, transparent)",
    /*
     * These derivations land as inline styles on <html>, which no theme stylesheet
     * rule can outrank at :root. So they must express the default design language
     * rather than decoration a theme has to fight: Kami wants flat brand markers, an
     * unfilled quote, and no gradients or glow. A theme that wants ornament back adds
     * it on a descendant selector (see moonlit's `.slide-prose blockquote`).
     */
    "--slide-list-bullet-bg": "none",
    "--slide-list-bullet-shadow": "none",
    "--slide-list-bullet-color": "var(--slide-ui-accent)",
    "--slide-ol-badge-bg": "transparent",
    "--slide-ol-badge-color": "var(--slide-ui-accent)",
    "--slide-blockquote-border-color": "var(--slide-ui-accent)",
    "--slide-blockquote-bg": "transparent",
    "--slide-blockquote-color": "var(--slide-ui-text)",
    "--slide-table-head-bg": "color-mix(in srgb, var(--slide-ui-heading) 3.5%, transparent)",
    "--slide-inline-code-bg": "color-mix(in srgb, var(--slide-ui-heading) 6%, transparent)",
    "--slide-badge-bg":
      "color-mix(in srgb, var(--slide-ui-accent-soft) 72%, var(--slide-ui-surface) 28%)",
    "--slide-badge-color":
      "color-mix(in srgb, var(--slide-ui-accent) 74%, var(--slide-ui-heading) 26%)",
    "--slide-badge-border": "1px solid color-mix(in srgb, var(--slide-ui-accent) 16%, transparent)",
  };
}

export function serializeThemeTokens(tokens: SlideThemeTokens) {
  return JSON.stringify(tokens);
}
