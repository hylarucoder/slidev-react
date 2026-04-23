import { createElement, type ComponentType } from "react"
import { useEffect, useState } from "react"
import { useSlideThemeTokens } from "../../../theme/ThemeProvider"
import type { SlideAddonDefinition } from "../../types"
import { resolveChartFrameSize, resolveChartFrameStyle } from "./chartFrame"

type G2Module = typeof import("./G2Chart")
type G2ComponentName =
  | "Chart"
  | "BarChart"
  | "LineChart"
  | "AreaChart"
  | "ScatterChart"
  | "PieChart"
  | "RadarChart"
  | "HeatmapChart"
  | "FunnelChart"
  | "WordCloudChart"
  | "GaugeChart"
  | "TreemapChart"
  | "WaterfallChart"

function createDeferredG2Component(name: G2ComponentName) {
  const DeferredG2Component = (props: Record<string, unknown>) => {
    const themeTokens = useSlideThemeTokens()
    const frameSize = resolveChartFrameSize(props)
    const frameStyle = resolveChartFrameStyle(themeTokens, frameSize)
    const [LoadedComponent, setLoadedComponent] = useState<ComponentType<Record<string, unknown>> | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
      let cancelled = false

      void import("./G2Chart")
        .then((module: G2Module) => {
          if (cancelled) return
          setLoadedComponent(() => module[name] as ComponentType<Record<string, unknown>>)
        })
        .catch((importError) => {
          if (cancelled) return
          setError(importError instanceof Error ? importError.message : String(importError))
        })

      return () => {
        cancelled = true
      }
    }, [])

    if (error) {
      return createElement(
        "div",
        {
          className: "my-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900",
        },
        `G2 addon failed to load: ${error}`,
      )
    }

    if (!LoadedComponent) {
      return createElement("div", {
        className: "my-3",
        "aria-hidden": "true",
        style: frameStyle,
        children: createElement("div", {
          className: "size-full animate-pulse",
          style: {
            background: `linear-gradient(135deg, color-mix(in srgb, ${themeTokens.ui.surfaceStrong} 82%, transparent) 0%, color-mix(in srgb, ${themeTokens.ui.surface} 92%, transparent) 100%)`,
          },
        }),
      })
    }

    return createElement(LoadedComponent, props)
  }

  DeferredG2Component.displayName = `Deferred${name}`
  return DeferredG2Component
}

const Chart = createDeferredG2Component("Chart")
const BarChart = createDeferredG2Component("BarChart")
const LineChart = createDeferredG2Component("LineChart")
const AreaChart = createDeferredG2Component("AreaChart")
const ScatterChart = createDeferredG2Component("ScatterChart")
const PieChart = createDeferredG2Component("PieChart")
const RadarChart = createDeferredG2Component("RadarChart")
const HeatmapChart = createDeferredG2Component("HeatmapChart")
const FunnelChart = createDeferredG2Component("FunnelChart")
const WordCloudChart = createDeferredG2Component("WordCloudChart")
const GaugeChart = createDeferredG2Component("GaugeChart")
const TreemapChart = createDeferredG2Component("TreemapChart")
const WaterfallChart = createDeferredG2Component("WaterfallChart")

export const addon: SlideAddonDefinition = {
  id: "g2",
  label: "G2 Charts",
  mdxComponents: {
    Chart,
    BarChart,
    LineChart,
    AreaChart,
    ScatterChart,
    PieChart,
    RadarChart,
    HeatmapChart,
    FunnelChart,
    WordCloudChart,
    GaugeChart,
    TreemapChart,
    WaterfallChart,
  },
}
