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

const themeVariables: Record<string, string> = {
  fontFamily: mermaidFontFamily,
  fontSize: "19px",
  primaryColor: "#22C55E",
  primaryTextColor: "#000000",
  primaryBorderColor: "#16A34A",
  lineColor: "#334155",
  background: "#ffffff",
  mainBkg: "#ffffff",
  secondBkg: "#f8fafc",
  tertiaryColor: "#f1f5f9",
  textColor: "#000000",
  secondaryColor: "#475569",
  tertiaryTextColor: "#000000",
  border1: "#cbd5e1",
  border2: "#e2e8f0",
  nodeBkg: "#f8fafc",
  nodeBorder: "#94a3b8",
  nodeTextColor: "#000000",
  clusterBkg: "#f8fafc",
  clusterBorder: "#cbd5e1",
  edgeLabelBackground: "#ffffff",
  arrowheadColor: "#475569",
  actorBkg: "#ffffff",
  actorBorder: "#22C55E",
  actorTextColor: "#000000",
  actorLineColor: "#94a3b8",
  signalColor: "#334155",
  signalTextColor: "#000000",
  labelBoxBkgColor: "#f8fafc",
  labelBoxBorderColor: "#cbd5e1",
  labelTextColor: "#000000",
  loopTextColor: "#000000",
  noteBkgColor: "#fefce8",
  noteTextColor: "#000000",
  noteBorderColor: "#e2e8f0",
  activationBkgColor: "#86efac",
  activationBorderColor: "#22C55E",
  labelColor: "#000000",
  classText: "#000000",
  git0: "#60a5fa",
  git1: "#34d399",
  git2: "#a78bfa",
  git3: "#f472b6",
  git4: "#fbbf24",
  git5: "#f87171",
  git6: "#22d3ee",
  git7: "#fb923c",
  gitInv0: "#ffffff",
  gitInv1: "#ffffff",
  gitInv2: "#ffffff",
  gitInv3: "#ffffff",
  gitInv4: "#ffffff",
  gitInv5: "#ffffff",
  gitInv6: "#ffffff",
  gitInv7: "#ffffff",
  commitLabelColor: "#000000",
  commitLabelBackground: "#f8fafc",
  fillType0: "#22C55E",
  fillType1: "#50e3c2",
  fillType2: "#7928ca",
  fillType3: "#ff0080",
  fillType4: "#f5a623",
  fillType5: "#ff0000",
  fillType6: "#22C55E",
  fillType7: "#50e3c2",
};

type MermaidRenderVariant = "preview" | "zoom";

function createMermaidConfig(variant: MermaidRenderVariant) {
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
          font-family: ${mermaidFontFamily};
        }
        .label,
        .label text,
        .nodeLabel,
        .edgeLabel,
        .cluster-label,
        .stateLabel text,
        foreignObject div {
          font-family: ${mermaidFontFamily};
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
        font-family: ${mermaidFontFamily};
      }
      .label,
      .label text,
      .nodeLabel,
      .edgeLabel,
      .cluster-label,
      .stateLabel text,
      foreignObject div {
        font-family: ${mermaidFontFamily};
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

async function renderMermaidSvg(
  id: string,
  source: string,
  variant: MermaidRenderVariant,
) {
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
  const diagramSurfaceStyle = useMemo(
    () => ({ color: "#000000", fontFamily: mermaidFontFamily }),
    [],
  );

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
        const svg = await enqueueMermaidRender(() =>
          renderMermaidSvg(zoomId, source, "zoom"),
        );
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
      <div className="my-3 rounded-xl border border-slate-300 bg-white/70 p-3 text-sm text-slate-700">
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
                  <div className="font-semibold tracking-[0.16em] text-slate-900 uppercase">Mermaid</div>
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
                    className="inline-block min-w-full rounded-2xl border border-slate-200 bg-white p-6  [&_svg]:h-auto [&_svg]:max-w-none [&_svg_tspan]:fill-current [&_svg_text]:fill-current"
                    style={diagramSurfaceStyle}
                    dangerouslySetInnerHTML={{ __html: zoomSvg }}
                  />
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 ">
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
        <div className="relative w-full overflow-hidden rounded-xl border border-slate-300 bg-white p-3 shadow-sm">
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
