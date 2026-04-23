export const DRAW_COLORS: readonly string[] = [
  '#ef4444',
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#111827',
]

export const DRAW_WIDTHS: readonly number[] = [3, 5, 8]

export const STAGE_SCALE_OPTIONS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 0.9, label: '90%' },
  { value: 1, label: '100%' },
  { value: 1.08, label: '108%' },
]

export const CURSOR_MODE_OPTIONS: ReadonlyArray<{ value: 'always' | 'idle-hide'; label: string }> = [
  { value: 'always', label: 'always visible' },
  { value: 'idle-hide', label: 'hide when idle' },
]

export type CursorModeOption = (typeof CURSOR_MODE_OPTIONS)[number]['value']
