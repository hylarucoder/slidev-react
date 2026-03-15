import mermaid from "mermaid";
import { Expand, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

function normalizeDiagramCode(code: string | undefined, children: ReactNode) {
  if (typeof code === "string") return code;

  if (typeof children === "string") return children;

  if (Array.isArray(children)) return children.join("");

  return "";
}

let initialized = false;
let renderQueue = Promise.resolve();
const mermaidFontFamily =
  'Inter, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';

function resolveThemeVar(name: string, fallback: string) {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export function resolveMermaidThemeVariables(): Record<string, string> {
  const fontFamily = resolveThemeVar("--font-sans", mermaidFontFamily);
  const primary = resolveThemeVar("--slide-diagram-primary", "#22C55E");
  const primaryBorder = resolveThemeVar("--slide-diagram-primary-border", "#16A34A");
  const line = resolveThemeVar("--slide-diagram-line", "#334155");
  const surface = resolveThemeVar("--slide-diagram-surface", "#ffffff");
  const surfaceAlt = resolveThemeVar("--slide-diagram-surface-alt", "#f8fafc");
  const text = resolveThemeVar("--slide-diagram-text", "#000000");
  const note = resolveThemeVar("--slide-diagram-note", "#fefce8");
  const chartOne = resolveThemeVar("--slide-chart-category-1", "#60a5fa");
  const chartTwo = resolveThemeVar("--slide-chart-category-2", "#34d399");
  const chartThree = resolveThemeVar("--slide-chart-category-3", "#a78bfa");
  const chartFour = resolveThemeVar("--slide-chart-category-4", "#f472b6");
  const chartFive = resolveThemeVar("--slide-chart-category-5", "#fbbf24");
  const chartSix = resolveThemeVar("--slide-chart-category-6", "#f87171");
  const chartAccent = resolveThemeVar("--slide-chart-accent", primaryBorder);

  return {
    fontFamily,
    fontSize: "19px",
    primaryColor: primary,
    primaryTextColor: text,
    primaryBorderColor: primaryBorder,
    lineColor: line,
    background: surface,
    mainBkg: surface,
    secondBkg: surfaceAlt,
    tertiaryColor: surfaceAlt,
    textColor: text,
    secondaryColor: line,
    tertiaryTextColor: text,
    border1: primaryBorder,
    border2: line,
    nodeBkg: surfaceAlt,
    nodeBorder: line,
    nodeTextColor: text,
    clusterBkg: surfaceAlt,
    clusterBorder: primaryBorder,
    edgeLabelBackground: surface,
    arrowheadColor: line,
    actorBkg: surface,
    actorBorder: primaryBorder,
    actorTextColor: text,
    actorLineColor: line,
    signalColor: line,
    signalTextColor: text,
    labelBoxBkgColor: surfaceAlt,
    labelBoxBorderColor: primaryBorder,
    labelTextColor: text,
    loopTextColor: text,
    noteBkgColor: note,
    noteTextColor: text,
    noteBorderColor: primaryBorder,
    activationBkgColor: primary,
    activationBorderColor: primaryBorder,
    labelColor: text,
    classText: text,
    git0: chartOne,
    git1: chartTwo,
    git2: chartThree,
    git3: chartFour,
    git4: chartFive,
    git5: chartSix,
    git6: chartAccent,
    git7: line,
    gitInv0: surface,
    gitInv1: surface,
    gitInv2: surface,
    gitInv3: surface,
    gitInv4: surface,
    gitInv5: surface,
    gitInv6: surface,
    gitInv7: surface,
    commitLabelColor: text,
    commitLabelBackground: surfaceAlt,
    fillType0: chartAccent,
    fillType1: chartTwo,
    fillType2: chartThree,
    fillType3: chartFour,
    fillType4: chartFive,
    fillType5: chartSix,
    fillType6: primaryBorder,
    fillType7: line,
  };
}

export function resolveMermaidSurfaceStyle() {
  return {
    color: resolveThemeVar("--slide-diagram-text", "#000000"),
    fontFamily: resolveThemeVar("--font-sans", mermaidFontFamily),
  };
}

function resolveMermaidFrameStyle() {
  return {
    borderColor: resolveThemeVar("--slide-absolutely-line", "#cbd5e1"),
    background: resolveThemeVar("--slide-diagram-surface", "#ffffff"),
  };
}

function resolveMermaidMutedSurfaceStyle() {
  return {
    borderColor: resolveThemeVar("--slide-absolutely-line", "#cbd5e1"),
    background: resolveThemeVar("--slide-diagram-surface-alt", "#f8fafc"),
    color: resolveThemeVar("--slide-diagram-line", "#475569"),
  };
}

type MermaidRenderVariant = "preview" | "zoom";

function createMermaidConfig(variant: MermaidRenderVariant) {
  const themeVariables = resolveMermaidThemeVariables();
  const fontFamily = themeVariables.fontFamily ?? mermaidFontFamily;

  if (variant === "preview") {
    return {
      startOnLoad: false,
      securityLevel: "loose" as const,
      theme: "base" as const,
      htmlLabels: false,
      themeVariables: {
        ...themeVariables,
        fontSize: "17px",
      },
      themeCSS: `
        svg, svg * {
          font-family: ${fontFamily};
        }
        .label,
        .label text,
        .nodeLabel,
        .edgeLabel,
        .cluster-label,
        .stateLabel text,
        foreignObject div {
          font-family: ${fontFamily};
        }
      `,
      flowchart: {
        curve: "basis" as const,
        padding: 15,
        htmlLabels: false,
      },
      state: {} as Record<string, unknown>,
      sequence: {
        actorFontSize: 17,
        noteFontSize: 16,
        messageFontSize: 16,
      },
      gantt: {
        fontSize: 16,
      },
      journey: {
        taskFontSize: 16,
        titleFontSize: "19px",
      },
    };
  }

  return {
    startOnLoad: false,
    securityLevel: "loose" as const,
    theme: "base" as const,
    htmlLabels: false,
    themeVariables,
    themeCSS: `
      svg, svg * {
        font-family: ${fontFamily};
      }
      .label,
      .label text,
      .nodeLabel,
      .edgeLabel,
      .cluster-label,
      .stateLabel text,
      foreignObject div {
        font-family: ${fontFamily};
      }
    `,
    flowchart: {
      curve: "basis" as const,
      padding: 15,
      htmlLabels: false,
    },
    state: {} as Record<string, unknown>,
    sequence: {
      actorFontSize: 19,
      noteFontSize: 18,
      messageFontSize: 18,
    },
    gantt: {
      fontSize: 18,
    },
    journey: {
      taskFontSize: 18,
      titleFontSize: "21px",
    },
  };
}

function ensureMermaid() {
  if (initialized) return;

  mermaid.initialize(createMermaidConfig("zoom"));

  initialized = true;
}

async function enqueueMermaidRender<T>(task: () => Promise<T>) {
  const next = renderQueue.then(task, task);
  renderQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

async function renderMermaidSvg(id: string, source: string, variant: MermaidRenderVariant) {
  ensureMermaid();
  mermaid.initialize(createMermaidConfig(variant));
  const result = await mermaid.render(id, source);
  return result.svg;
}

export function MermaidDiagram({ code, children }: { code?: string; children?: ReactNode }) {
  const source = normalizeDiagramCode(code, children);
  const [previewSvg, setPreviewSvg] = useState<string>("");
  const [zoomSvg, setZoomSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [zoomLoading, setZoomLoading] = useState(false);
  const previewId = useMemo(() => `mermaid-preview-${Math.random().toString(36).slice(2, 10)}`, []);
  const zoomId = useMemo(() => `mermaid-zoom-${Math.random().toString(36).slice(2, 10)}`, []);
  const diagramSurfaceStyle = useMemo(() => resolveMermaidSurfaceStyle(), []);
  const diagramFrameStyle = useMemo(() => resolveMermaidFrameStyle(), []);
  const diagramMutedSurfaceStyle = useMemo(() => resolveMermaidMutedSurfaceStyle(), []);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      try {
        setPreviewSvg("");
        setZoomSvg("");
        setZoomLoading(false);
        const svg = await enqueueMermaidRender(() =>
          renderMermaidSvg(previewId, source, "preview"),
        );
        if (!cancelled) {
          setPreviewSvg(svg);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    };

    void render();

    return () => {
      cancelled = true;
    };
  }, [previewId, source]);

  useEffect(() => {
    if (!zoomed || zoomSvg) return;

    let cancelled = false;

    const render = async () => {
      try {
        setZoomLoading(true);
        const svg = await enqueueMermaidRender(() => renderMermaidSvg(zoomId, source, "zoom"));
        if (!cancelled) {
          setZoomSvg(svg);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setZoomLoading(false);
      }
    };

    void render();

    return () => {
      cancelled = true;
    };
  }, [source, zoomId, zoomSvg, zoomed]);

  useEffect(() => {
    if (!zoomed) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoomed(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [zoomed]);

  if (error) {
    return (
      <div className="my-3 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900">
        Mermaid render error: {error}
      </div>
    );
  }

  if (!previewSvg) {
    return (
      <div className="my-3 rounded-xl border p-3 text-sm" style={diagramMutedSurfaceStyle}>
        Rendering Mermaid...
      </div>
    );
  }

  const zoomOverlay =
    zoomed && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-100/82 p-6 backdrop-blur-sm"
            onClick={() => setZoomed(false)}
          >
            <div
              className="relative flex h-[min(92vh,1200px)] w-[min(96vw,1600px)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white "
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 text-sm text-slate-700">
                <div>
                  <div className="font-semibold tracking-[0.16em] text-slate-900 uppercase">
                    Mermaid
                  </div>
                  <div className="mt-1 text-xs text-slate-500">Esc or click outside to close</div>
                </div>
                <button
                  type="button"
                  onClick={() => setZoomed(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Close Mermaid zoom preview"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-auto bg-slate-50 p-6">
                {zoomSvg ? (
                  <div
                    className="inline-block min-w-full rounded-2xl border p-6 [&_svg]:h-auto [&_svg]:max-w-none [&_svg_tspan]:fill-current [&_svg_text]:fill-current"
                    style={{ ...diagramSurfaceStyle, ...diagramFrameStyle }}
                    dangerouslySetInnerHTML={{ __html: zoomSvg }}
                  />
                ) : (
                  <div className="rounded-2xl border p-6 text-sm" style={diagramMutedSurfaceStyle}>
                    {zoomLoading ? "Preparing Mermaid preview..." : "Rendering Mermaid..."}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div className="my-3">
        <div
          className="relative w-full overflow-hidden rounded-xl border p-3 shadow-sm"
          style={diagramFrameStyle}
        >
          <button
            type="button"
            onClick={() => setZoomed(true)}
            className="absolute top-3 right-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300/80 bg-white/92 text-slate-700 shadow-sm transition hover:bg-white hover:text-slate-950"
            aria-label="Open Mermaid zoom preview"
            title="Zoom Mermaid diagram"
          >
            <Expand size={16} />
          </button>
          <div className="max-w-full overflow-x-auto pr-12">
            <div
              className="w-full [&_svg]:block [&_svg]:h-auto [&_svg]:w-full [&_svg]:max-w-full [&_svg_tspan]:fill-current [&_svg_text]:fill-current"
              style={diagramSurfaceStyle}
              dangerouslySetInnerHTML={{ __html: previewSvg }}
            />
          </div>
        </div>
      </div>
      {zoomOverlay}
    </>
  );
}
