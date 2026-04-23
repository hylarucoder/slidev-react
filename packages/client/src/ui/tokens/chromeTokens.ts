/**
 * UI 外壳色板（演示运行时的状态栏、按钮、面板等 Chrome UI）。
 *
 * 与 `theme/themeTokens.ts` 的 `--slide-*` 系列并列而不重叠：
 * - `theme/themeTokens.ts`：幻灯片**内容**的语义色（主题可切换）
 * - 本文件：演示运行时的**UI 外壳**色（跟随用户系统偏好，但不受主题切换影响）
 */

export const CHROME_TONE = {
  surface: 'rgba(255, 255, 255, 0.82)',
  surfaceRaised: 'rgba(255, 255, 255, 0.95)',
  surfaceSunken: 'rgba(248, 250, 252, 0.72)',
  border: 'rgba(226, 232, 240, 0.8)',
  borderStrong: 'rgba(148, 163, 184, 0.7)',
  divider: '#e2e8f0',
  fg: '#0f172a',
  fgMuted: '#475569',
  fgSubtle: '#94a3b8',
  accent: '#22c55e',
  accentSoft: '#dcfce7',
  danger: '#ef4444',
  dangerSoft: '#fee2e2',
  warning: '#f59e0b',
  warningSoft: '#fef3c7',
  info: '#0ea5e9',
  infoSoft: '#e0f2fe',
  violet: '#8b5cf6',
  violetSoft: '#ede9fe',
} as const

export type ChromeToneKey = keyof typeof CHROME_TONE

export const CHROME_RADIUS = {
  sm: 4,
  md: 6,
  lg: 8,
  full: 9999,
} as const

export type ChromeRadiusKey = keyof typeof CHROME_RADIUS
