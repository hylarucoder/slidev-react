import { Chart as G2Chart, type G2Spec } from "@antv/g2"
import type { G2Theme } from "@antv/g2/esm/runtime/types/theme"
import { Renderer as SvgRenderer } from "@antv/g-svg"
import { useEffect, useRef, useState } from "react"

const chartFontFamily =
  'Inter, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'

const slidevPalette = [
  '#60a5fa', '#34d399', '#a78bfa', '#f472b6', '#fbbf24',
  '#f87171', '#22d3ee', '#fb923c', '#4e79a7', '#9c755f',
]

const slidevTheme: G2Theme = {
  color: '#22C55E',
  category10: slidevPalette,
  category20: slidevPalette,
  axis: {
    labelFontSize: 17,
    labelFill: '#334155',
    labelFontFamily: chartFontFamily,
    titleFontSize: 19,
    titleFill: '#0f172a',
    titleFontFamily: chartFontFamily,
    titleFontWeight: 'bold',
    gridStroke: '#e2e8f0',
    gridStrokeOpacity: 1,
    lineStroke: '#94a3b8',
    lineLineWidth: 1,
    tickStroke: '#94a3b8',
  },
  legendCategory: {
    itemLabelFontSize: 18,
    itemLabelFill: '#334155',
    itemLabelFontFamily: chartFontFamily,
    titleFontSize: 19,
    titleFill: '#0f172a',
    titleFontFamily: chartFontFamily,
    titleFontWeight: 'bold',
  },
  title: {
    titleFontSize: 22,
    titleFill: '#0f172a',
    titleFontFamily: chartFontFamily,
    titleFontWeight: 'bold',
    subtitleFontSize: 17,
    subtitleFill: '#475569',
    subtitleFontFamily: chartFontFamily,
  },
  label: {
    fontSize: 18,
    fontFamily: chartFontFamily,
    fill: '#334155',
  },
}

type ChartProps = G2Spec & {
  width?: number
  height?: number
}

export function Chart({ width = 720, height = 400, ...spec }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<G2Chart | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let cancelled = false

    const render = async () => {
      try {
        setError(null)

        if (chartRef.current) {
          try { chartRef.current.destroy() } catch { /* noop */ }
          chartRef.current = null
        }

        const chart = new G2Chart({
          container: el,
          renderer: new SvgRenderer(),
          width,
          height,
        })

        const userTheme = typeof spec.theme === 'object' ? spec.theme : {}
        chart.options({
          ...spec,
          width,
          height,
          theme: { type: 'classic', ...slidevTheme, ...userTheme },
        })

        if (cancelled) { chart.destroy(); return }

        chartRef.current = chart
        await chart.render()

        if (cancelled) {
          chart.destroy()
          chartRef.current = null
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err))
        }
      }
    }

    void render()

    return () => {
      cancelled = true
      if (chartRef.current) {
        try { chartRef.current.destroy() } catch { /* noop */ }
        chartRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, JSON.stringify(spec)])

  if (error) {
    return (
      <div className="my-3 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900">
        Chart render error: {error}
      </div>
    )
  }

  return (
    <div ref={containerRef} style={{ width, height }} />
  )
}
