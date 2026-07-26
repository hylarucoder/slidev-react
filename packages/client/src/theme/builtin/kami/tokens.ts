import type { SlideThemeTokens } from "../../types";

/**
 * Kami's palette and font stacks, ported from https://github.com/tw93/Kami.
 *
 * Kami's print system compresses to: parchment canvas, one ink-blue accent, serif
 * carries hierarchy, warm grays only, no cool tones, no hard shadows, no gradients.
 * The constants below are Kami's registered token set verbatim
 * (`references/tokens.json`); every value this runtime needs but Kami does not
 * register is derived from that ramp and marked inline.
 *
 * This module stays free of React imports so `defaultSlideThemeTokens` can reuse it
 * without pulling components into token-only consumers.
 */

/** Kami registered tokens — do not drift from `references/tokens.json`. */
const PARCHMENT = "#f5f4ed";
const IVORY = "#faf9f5";
const BORDER = "#e8e6dc";
const BRAND = "#1B365D";
const BRAND_TINT = "#EEF2F7";
const NEAR_BLACK = "#141413";
const DARK_WARM = "#3d3d3a";
const OLIVE = "#504e49";
const STONE = "#6b6a64";
const BREAKING_BG = "#f0e0d8";
const BREAKING_FG = "#8b4513";

/** Derived: Kami registers no third surface; one step deeper than parchment. */
const PARCHMENT_DEEP = "#efeee5";
/** Derived: Kami registers no darker brand; ink-blue pushed down for hover/emphasis. */
const BRAND_DEEP = "#12243d";
/** Derived: one step past `--border`, for rules that must read as a real edge. */
const BORDER_STRONG = "#d8d5c7";
/** Derived: one step lighter than `--stone`, still warm. */
const STONE_SOFT = "#93918a";

/**
 * Derived: Kami is a print system with a single accent and registers no 5-state
 * feedback palette. `warning` reuses Kami's own `--breaking-fg`; the rest stay
 * desaturated earth tones so semantic states remain distinguishable on parchment
 * without introducing a second saturated hue.
 */
const POSITIVE = "#4a6b52";
const NEGATIVE = "#8b3a2f";

/**
 * Derived: Kami's "single accent" rule leaves no categorical palette, so series
 * colors are a monochrome ink ramp (brand → brand-light → lighter) closed by stone,
 * rather than a rainbow that would break the one-accent invariant.
 */
const INK_RAMP: [string, string, string, string, string, string] = [
  BRAND,
  "#2d5a8a",
  "#4a7ba7",
  "#7ba0c0",
  "#a9c0d6",
  STONE,
];

/**
 * Kami's CJK-first serif stack. `sans` deliberately equals `serif` — Kami's shipped
 * slides template sets `--sans: var(--serif)`; labels and eyebrows use mono instead.
 * Every stack carries a CJK fallback, including mono (Kami requires it so labels and
 * code comments never render tofu).
 */
export const KAMI_SERIF_STACK = [
  '"TsangerJinKai02"',
  '"Source Han Serif SC"',
  '"Source Han Serif CN"',
  '"Noto Serif CJK SC"',
  '"Noto Serif SC"',
  '"Songti SC"',
  '"STSong"',
  "Charter",
  "Georgia",
  "Palatino",
  '"Times New Roman"',
  "serif",
].join(", ");

export const KAMI_MONO_STACK = [
  '"JetBrains Mono"',
  '"SF Mono"',
  '"SFMono-Regular"',
  '"Fira Code"',
  "Consolas",
  "Monaco",
  '"TsangerJinKai02"',
  '"Source Han Serif SC"',
  "monospace",
].join(", ");

export const kamiThemeTokens: SlideThemeTokens = {
  fonts: {
    sans: KAMI_SERIF_STACK,
    serif: KAMI_SERIF_STACK,
    mono: KAMI_MONO_STACK,
  },
  ui: {
    background: PARCHMENT,
    surface: IVORY,
    surfaceStrong: PARCHMENT_DEEP,
    text: DARK_WARM,
    heading: NEAR_BLACK,
    muted: STONE,
    mutedSoft: STONE_SOFT,
    accent: BRAND,
    accentStrong: BRAND_DEEP,
    accentSoft: BRAND_TINT,
    border: BORDER,
    borderStrong: BORDER_STRONG,
  },
  feedback: {
    positive: POSITIVE,
    negative: NEGATIVE,
    warning: BREAKING_FG,
    info: BRAND,
    neutral: STONE,
  },
  chart: {
    accent: BRAND,
    categorical: INK_RAMP,
    positive: POSITIVE,
    negative: NEGATIVE,
    warning: BREAKING_FG,
    neutral: STONE,
    axis: BORDER_STRONG,
    grid: BORDER,
  },
  diagram: {
    primary: BRAND_TINT,
    primaryBorder: BRAND,
    line: STONE,
    surface: IVORY,
    surfaceAlt: PARCHMENT_DEEP,
    text: NEAR_BLACK,
    note: BREAKING_BG,
    categorical: INK_RAMP,
    accent: BRAND,
  },
  addons: {
    insight: {
      border: "rgba(27, 54, 93, 0.16)",
      background: IVORY,
      title: BRAND,
      text: OLIVE,
      // Kami's whisper shadow — depth is a lift, never a hard drop shadow.
      shadow: "0 4px 24px rgba(20, 20, 19, 0.05)",
    },
  },
};
