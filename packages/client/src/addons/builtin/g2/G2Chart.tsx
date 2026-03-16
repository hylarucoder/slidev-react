import { useEffect, useMemo, useRef, useState } from "react";
import type { G2Spec } from "@antv/g2";

import { useSlideThemeTokens } from "../../../theme/ThemeProvider";
import {
  buildSlideTheme,
  resolveHeatmapPalette,
  sizePresets,
  type ChartSize,
} from "./chartThemeTokens";
import { chartPresets, type PresetName } from "./chartPresets";

type G2RuntimeModule = typeof import("@antv/g2");
type G2PlotModule = typeof import("@antv/g2/esm/lib/plot");
type G2SvgModule = typeof import("@antv/g-svg");
type G2ChartInstance = InstanceType<G2RuntimeModule["Chart"]>;

let g2RuntimePromise:
  | Promise<{
      Chart: G2RuntimeModule["Chart"];
      register: G2RuntimeModule["register"];
      SvgRenderer: G2SvgModule["Renderer"];
    }>
  | undefined;

function loadG2Runtime() {
  g2RuntimePromise ??= Promise.all([
    import("@antv/g2"),
    import("@antv/g-svg"),
    import("@antv/g2/esm/lib/plot"),
  ]).then(([g2Module, gSvgModule, plotModule]) => {
    registerPlotlib(g2Module, plotModule);

    return {
      Chart: g2Module.Chart,
      register: g2Module.register,
      SvgRenderer: gSvgModule.Renderer,
    };
  });

  return g2RuntimePromise;
}

let hasRegisteredPlotlib = false;

function registerPlotlib(g2Module: G2RuntimeModule, plotModule: G2PlotModule) {
  if (hasRegisteredPlotlib) return;

  for (const [key, value] of Object.entries(plotModule.plotlib())) {
    g2Module.register(
      key as Parameters<G2RuntimeModule["register"]>[0],
      value as Parameters<G2RuntimeModule["register"]>[1],
    );
  }

  hasRegisteredPlotlib = true;
}

// ---------------------------------------------------------------------------
// Base Chart — L1 (G2Spec passthrough with theme/preset support)
// ---------------------------------------------------------------------------

type ChartProps = G2Spec & {
  width?: number;
  height?: number;
  /** Named size preset */
  size?: ChartSize;
  /** Named chart preset */
  preset?: PresetName;
};

export function Chart({ width, height, size, preset, ...spec }: ChartProps) {
  const resolved = resolveSize(width, height, size);
  const themeTokens = useSlideThemeTokens();
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<G2ChartInstance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const userTheme = useMemo(() => (typeof spec.theme === "object" ? spec.theme : {}), [spec.theme]);
  const themeSignature = useMemo(() => JSON.stringify(themeTokens), [themeTokens]);
  const slideTheme = useMemo(() => buildSlideTheme(themeTokens), [themeSignature, themeTokens]);
  const specSignature = useMemo(() => JSON.stringify(spec), [spec]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;

    const render = async () => {
      try {
        setError(null);
        const runtime = await loadG2Runtime();

        if (chartRef.current) {
          try {
            chartRef.current.destroy();
          } catch {
            /* noop */
          }
          chartRef.current = null;
        }

        const chart = new runtime.Chart({
          container: el,
          renderer: new runtime.SvgRenderer(),
          width: resolved.width,
          height: resolved.height,
        });

        // Merge: preset defaults → user spec → theme
        const presetSpec = preset ? (chartPresets[preset] ?? {}) : {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- G2Spec is a huge union; casting is the pragmatic escape
        chart.options({
          ...presetSpec,
          ...spec,
          width: resolved.width,
          height: resolved.height,
          theme: { type: "classic", ...slideTheme, ...userTheme },
        } as any);

        if (cancelled) {
          chart.destroy();
          return;
        }

        chartRef.current = chart;
        await chart.render();

        if (cancelled) {
          chart.destroy();
          chartRef.current = null;
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    };

    void render();

    return () => {
      cancelled = true;
      if (chartRef.current) {
        try {
          chartRef.current.destroy();
        } catch {
          /* noop */
        }
        chartRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved.width, resolved.height, preset, slideTheme, specSignature, userTheme]);

  if (error) {
    return (
      <div className="my-3 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900">
        Chart render error: {error}
      </div>
    );
  }

  return <div ref={containerRef} style={{ width: resolved.width, height: resolved.height }} />;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveSize(
  width: number | undefined,
  height: number | undefined,
  size: ChartSize | undefined,
) {
  if (width !== undefined || height !== undefined) {
    return {
      width: width ?? sizePresets.full.width,
      height: height ?? sizePresets.full.height,
    };
  }
  const preset = size ? sizePresets[size] : sizePresets.full;
  return { width: preset.width, height: preset.height };
}

// ---------------------------------------------------------------------------
// Semantic chart components — L3
// ---------------------------------------------------------------------------

type SemanticBase = {
  data: Record<string, unknown>[];
  width?: number;
  height?: number;
  size?: ChartSize;
};

/* ─── BarChart ─── */

type BarChartProps = SemanticBase & {
  x: string;
  y: string;
  color?: string;
  group?: string;
  stack?: boolean;
};

export function BarChart({ data, x, y, color, group, stack, ...rest }: BarChartProps) {
  const encode: Record<string, unknown> = { x, y };
  if (color) encode.color = color;
  if (group) encode.color = group;
  const transform = stack ? [{ type: "stackY" as const }] : undefined;
  return <Chart type="interval" data={data} encode={encode} transform={transform} {...rest} />;
}

/* ─── LineChart ─── */

type LineChartProps = SemanticBase & {
  x: string;
  y: string;
  color?: string;
  curve?: boolean;
};

export function LineChart({ data, x, y, color, ...rest }: LineChartProps) {
  const encode: Record<string, unknown> = { x, y };
  if (color) encode.color = color;
  return <Chart type="line" data={data} encode={encode} {...rest} />;
}

/* ─── AreaChart ─── */

type AreaChartProps = SemanticBase & {
  x: string;
  y: string;
  color?: string;
  stack?: boolean;
};

export function AreaChart({ data, x, y, color, stack, ...rest }: AreaChartProps) {
  const encode: Record<string, unknown> = { x, y };
  if (color) encode.color = color;
  const transform = stack ? [{ type: "stackY" as const }] : undefined;
  return <Chart type="area" data={data} encode={encode} transform={transform} {...rest} />;
}

/* ─── ScatterChart ─── */

type ScatterChartProps = SemanticBase & {
  x: string;
  y: string;
  color?: string;
  sizeField?: string;
  shape?: string;
};

export function ScatterChart({ data, x, y, color, sizeField, shape, ...rest }: ScatterChartProps) {
  const encode: Record<string, unknown> = { x, y };
  if (color) encode.color = color;
  if (sizeField) encode.size = sizeField;
  if (shape) encode.shape = shape;
  return <Chart type="point" data={data} encode={encode} {...rest} />;
}

/* ─── PieChart ─── */

type PieChartProps = SemanticBase & {
  value: string;
  label: string;
  color?: string;
  donut?: boolean;
};

export function PieChart({ data, value, label, color, donut, ...rest }: PieChartProps) {
  const encode: Record<string, unknown> = { y: value, color: color ?? label };
  const innerRadius = donut ? 0.6 : undefined;
  return (
    <Chart
      type="interval"
      data={data}
      encode={encode}
      coordinate={{ type: "theta" }}
      style={{
        stroke: "#fff",
        lineWidth: 1,
        ...(innerRadius !== undefined ? { innerRadius } : {}),
      }}
      {...rest}
    />
  );
}

/* ─── RadarChart ─── */

type RadarChartProps = SemanticBase & {
  x: string;
  y: string;
  color?: string;
  area?: boolean;
};

export function RadarChart({ data, x, y, color, area, ...rest }: RadarChartProps) {
  const encode: Record<string, unknown> = { x, y };
  if (color) encode.color = color;
  if (area) {
    return (
      <Chart
        type="area"
        data={data}
        encode={encode}
        coordinate={{ type: "polar" }}
        style={{ fillOpacity: 0.5 }}
        axis={{ x: { grid: true }, y: { zIndex: 1, title: false } }}
        {...rest}
      />
    );
  }
  return (
    <Chart
      type="line"
      data={data}
      encode={encode}
      coordinate={{ type: "polar" }}
      axis={{ x: { grid: true }, y: { zIndex: 1, title: false } }}
      {...rest}
    />
  );
}

/* ─── HeatmapChart ─── */

type HeatmapChartProps = SemanticBase & {
  x: string;
  y: string;
  color: string;
};

export function HeatmapChart({ data, x, y, color, ...rest }: HeatmapChartProps) {
  const themeTokens = useSlideThemeTokens();
  const colorRange = useMemo(() => resolveHeatmapPalette(themeTokens), [themeTokens]);

  return (
    <Chart
      type="cell"
      data={data}
      encode={{ x, y, color }}
      scale={{ color: { range: colorRange } }}
      style={{ inset: 0.5 }}
      {...rest}
    />
  );
}

/* ─── FunnelChart ─── */

type FunnelChartProps = SemanticBase & {
  x: string;
  y: string;
  color?: string;
};

export function FunnelChart({ data, x, y, color, ...rest }: FunnelChartProps) {
  const encode: Record<string, unknown> = { x, y, color: color ?? x, shape: "funnel" };
  return (
    <Chart
      type="interval"
      data={data}
      encode={encode}
      coordinate={{ transform: [{ type: "transpose" }] }}
      {...rest}
    />
  );
}

/* ─── WordCloud ─── */

type WordCloudProps = SemanticBase & {
  text: string;
  value: string;
  color?: string;
};

export function WordCloudChart({ data, text, value, color, ...rest }: WordCloudProps) {
  const encode: Record<string, unknown> = { text, value };
  if (color) encode.color = color;
  return <Chart type="wordCloud" data={data} encode={encode} legend={false} {...rest} />;
}

/* ─── GaugeChart ─── */

type GaugeChartProps = {
  value: number;
  min?: number;
  max?: number;
  width?: number;
  height?: number;
  size?: ChartSize;
};

export function GaugeChart({ value, min = 0, max = 100, ...rest }: GaugeChartProps) {
  const data = { value: { target: value, total: max - min, name: "" } };
  return <Chart type="gauge" data={data} {...rest} />;
}

/* ─── TreemapChart ─── */

type TreemapChartProps = {
  data: Record<string, unknown>;
  value: string;
  width?: number;
  height?: number;
  size?: ChartSize;
};

export function TreemapChart({ data, value, ...rest }: TreemapChartProps) {
  return <Chart type="treemap" data={{ value: data }} encode={{ value }} {...rest} />;
}

/* ─── WaterfallChart ─── */

type WaterfallChartProps = SemanticBase & {
  x: string;
  y: string;
  color?: string;
};

export function WaterfallChart({ data, x, y, color, ...rest }: WaterfallChartProps) {
  const encode: Record<string, unknown> = { x, y };
  if (color) encode.color = color;
  return (
    <Chart
      type="interval"
      data={data}
      encode={encode}
      transform={[{ type: "diffY" as const }]}
      {...rest}
    />
  );
}
