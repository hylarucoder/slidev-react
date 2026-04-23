import type { CSSProperties } from 'react'
import type { SlideThemeTokens } from '../../../theme/types'
import { sizePresets, type ChartSize } from './chartThemeTokens'

export function resolveChartFrameSize({
  width,
  height,
  size,
}: {
  width?: unknown
  height?: unknown
  size?: unknown
}) {
  const resolvedSize =
    typeof size === 'string' && size in sizePresets ? sizePresets[size as ChartSize] : sizePresets.full

  return {
    width: typeof width === 'number' ? width : resolvedSize.width,
    height: typeof height === 'number' ? height : resolvedSize.height,
  }
}

export function resolveChartFrameStyle(
  themeTokens: SlideThemeTokens,
  dimensions: { width: number; height: number },
): CSSProperties {
  return {
    width: dimensions.width,
    height: dimensions.height,
    borderRadius: '1rem',
    overflow: 'hidden',
    border: `1px solid ${themeTokens.ui.border}`,
    background: `color-mix(in srgb, ${themeTokens.ui.surface} 84%, transparent)`,
    boxShadow: `inset 0 1px 0 color-mix(in srgb, ${themeTokens.ui.heading} 6%, transparent)`,
  }
}
