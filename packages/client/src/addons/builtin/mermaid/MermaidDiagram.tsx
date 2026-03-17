import mermaid from "mermaid/dist/mermaid.esm.min.mjs";
import { Expand, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useSlideThemeTokens } from "../../../theme/ThemeProvider";
import { serializeThemeTokens } from "../../../theme/themeTokens";
import type { SlideThemeTokens } from "../../../theme/types";

function normalizeDiagramCode(code: string | undefined, children: ReactNode) {
  if (typeof code === "string") return code;

  if (typeof children === "string") return children;

  if (Array.isArray(children)) return children.join("");

  return "";
}

let initialized = false;
let renderQueue = Promise.resolve();

type MermaidRenderVariant = "preview" | "zoom";

function clampAlpha(value: number) {
  return Math.max(0, Math.min(1, Number(value.toFixed(3))));
}

function parseRgbChannels(color: string) {
  const hex = color.trim().match(/^#([\da-f]{3}|[\da-f]{6})$/i);
  if (hex) {
    const normalized =
      hex[1].length === 3
        ? hex[1]
            .split("")
            .map((channel) => channel + channel)
            .join("")
        : hex[1];

    return {
      r: Number.parseInt(normalized.slice(0, 2), 16),
      g: Number.parseInt(normalized.slice(2, 4), 16),
      b: Number.parseInt(normalized.slice(4, 6), 16),
    };
  }

  const rgb = color
    .trim()
    .match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+\s*)?\)$/i);

  if (!rgb) return null;

  return {
    r: Number.parseFloat(rgb[1]),
    g: Number.parseFloat(rgb[2]),
    b: Number.parseFloat(rgb[3]),
  };
}

function withAlpha(color: string, alpha: number) {
  const channels = parseRgbChannels(color);
  if (!channels) return color;

  return `rgba(${channels.r}, ${channels.g}, ${channels.b}, ${clampAlpha(alpha)})`;
}

function repeatPalette(colors: string[], size: number) {
  return Array.from({ length: size }, (_, index) => colors[index % colors.length]);
}

export function resolveMermaidThemeVariables(tokens: SlideThemeTokens): Record<string, string> {
  const accentStroke = tokens.diagram.primaryBorder;
  const neutralStroke = tokens.diagram.line;
  const accentFill = withAlpha(tokens.diagram.accent, 0.16);
  const neutralFill = tokens.diagram.surfaceAlt;
  const neutralFillStrong = tokens.diagram.surface;
  const semanticStrokes = [
    accentStroke,
    tokens.feedback.info,
    tokens.feedback.positive,
    tokens.feedback.warning,
    tokens.feedback.negative,
    tokens.feedback.neutral,
  ];
  const semanticFills = semanticStrokes.map((color, index) =>
    withAlpha(color, index === 3 ? 0.18 : 0.16),
  );
  const extendedSemanticFills = repeatPalette(semanticFills, 12);
  const extendedSemanticStrokes = repeatPalette(semanticStrokes, 12);
  const gitStrokes = repeatPalette([...semanticStrokes, neutralStroke, accentStroke], 8);
  const gitFills = repeatPalette([neutralFillStrong, neutralFill], 8);

  return {
    fontFamily: tokens.fonts.sans,
    fontSize: "19px",
    primaryColor: accentFill,
    primaryTextColor: tokens.diagram.text,
    primaryBorderColor: accentStroke,
    secondaryColor: neutralFill,
    secondaryBorderColor: neutralStroke,
    secondaryTextColor: tokens.diagram.text,
    tertiaryColor: neutralFillStrong,
    tertiaryBorderColor: neutralStroke,
    lineColor: neutralStroke,
    background: neutralFillStrong,
    mainBkg: neutralFillStrong,
    secondBkg: neutralFill,
    textColor: tokens.diagram.text,
    tertiaryTextColor: tokens.diagram.text,
    border1: accentStroke,
    border2: neutralStroke,
    nodeBkg: neutralFill,
    nodeBorder: neutralStroke,
    nodeTextColor: tokens.diagram.text,
    clusterBkg: neutralFillStrong,
    clusterBorder: accentStroke,
    edgeLabelBackground: neutralFillStrong,
    labelBackground: neutralFillStrong,
    arrowheadColor: tokens.diagram.line,
    actorBkg: neutralFillStrong,
    actorBorder: accentStroke,
    actorTextColor: tokens.diagram.text,
    actorLineColor: tokens.diagram.line,
    signalColor: tokens.diagram.line,
    signalTextColor: tokens.diagram.text,
    labelBoxBkgColor: neutralFill,
    labelBoxBorderColor: accentStroke,
    labelTextColor: tokens.diagram.text,
    loopTextColor: tokens.diagram.text,
    noteBkgColor: tokens.diagram.note,
    noteTextColor: tokens.diagram.text,
    noteBorderColor: accentStroke,
    activationBkgColor: accentFill,
    activationBorderColor: accentStroke,
    sequenceNumberColor: tokens.diagram.text,
    sectionBkgColor: neutralFillStrong,
    altSectionBkgColor: neutralFill,
    sectionBkgColor2: accentFill,
    excludeBkgColor: withAlpha(tokens.feedback.negative, 0.16),
    taskBorderColor: neutralStroke,
    taskBkgColor: neutralFill,
    taskTextLightColor: tokens.diagram.text,
    taskTextColor: tokens.diagram.text,
    taskTextDarkColor: tokens.diagram.text,
    taskTextOutsideColor: tokens.diagram.text,
    taskTextClickableColor: tokens.ui.accentStrong,
    activeTaskBorderColor: accentStroke,
    activeTaskBkgColor: accentFill,
    gridColor: tokens.ui.border,
    doneTaskBkgColor: withAlpha(tokens.feedback.positive, 0.16),
    doneTaskBorderColor: tokens.feedback.positive,
    critBorderColor: tokens.feedback.negative,
    critBkgColor: withAlpha(tokens.feedback.negative, 0.18),
    todayLineColor: tokens.feedback.warning,
    vertLineColor: tokens.ui.border,
    personBorder: accentStroke,
    personBkg: accentFill,
    archEdgeColor: neutralStroke,
    archEdgeArrowColor: neutralStroke,
    archGroupBorderColor: accentStroke,
    archGroupBorderWidth: "1",
    rowOdd: neutralFillStrong,
    rowEven: neutralFill,
    labelColor: tokens.diagram.text,
    classText: tokens.diagram.text,
    errorBkgColor: withAlpha(tokens.feedback.negative, 0.16),
    errorTextColor: tokens.feedback.negative,
    cScale0: extendedSemanticFills[0],
    cScale1: extendedSemanticFills[1],
    cScale2: extendedSemanticFills[2],
    cScale3: extendedSemanticFills[3],
    cScale4: extendedSemanticFills[4],
    cScale5: extendedSemanticFills[5],
    cScale6: extendedSemanticFills[6],
    cScale7: extendedSemanticFills[7],
    cScale8: extendedSemanticFills[8],
    cScale9: extendedSemanticFills[9],
    cScale10: extendedSemanticFills[10],
    cScale11: extendedSemanticFills[11],
    cScalePeer0: extendedSemanticStrokes[0],
    cScalePeer1: extendedSemanticStrokes[1],
    cScalePeer2: extendedSemanticStrokes[2],
    cScalePeer3: extendedSemanticStrokes[3],
    cScalePeer4: extendedSemanticStrokes[4],
    cScalePeer5: extendedSemanticStrokes[5],
    cScalePeer6: extendedSemanticStrokes[6],
    cScalePeer7: extendedSemanticStrokes[7],
    cScalePeer8: extendedSemanticStrokes[8],
    cScalePeer9: extendedSemanticStrokes[9],
    cScalePeer10: extendedSemanticStrokes[10],
    cScalePeer11: extendedSemanticStrokes[11],
    git0: gitStrokes[0],
    git1: gitStrokes[1],
    git2: gitStrokes[2],
    git3: gitStrokes[3],
    git4: gitStrokes[4],
    git5: gitStrokes[5],
    git6: gitStrokes[6],
    git7: gitStrokes[7],
    gitInv0: gitFills[0],
    gitInv1: gitFills[1],
    gitInv2: gitFills[2],
    gitInv3: gitFills[3],
    gitInv4: gitFills[4],
    gitInv5: gitFills[5],
    gitInv6: gitFills[6],
    gitInv7: gitFills[7],
    commitLabelColor: tokens.diagram.text,
    commitLabelBackground: neutralFill,
    fillType0: extendedSemanticFills[0],
    fillType1: extendedSemanticFills[1],
    fillType2: extendedSemanticFills[2],
    fillType3: extendedSemanticFills[3],
    fillType4: extendedSemanticFills[4],
    fillType5: extendedSemanticFills[5],
    fillType6: neutralFill,
    fillType7: neutralFillStrong,
    pie1: extendedSemanticFills[0],
    pie2: extendedSemanticFills[1],
    pie3: extendedSemanticFills[2],
    pie4: extendedSemanticFills[3],
    pie5: extendedSemanticFills[4],
    pie6: extendedSemanticFills[5],
    pie7: extendedSemanticFills[6],
    pie8: extendedSemanticFills[7],
    pie9: extendedSemanticFills[8],
    pie10: extendedSemanticFills[9],
    pie11: extendedSemanticFills[10],
    pie12: extendedSemanticFills[11],
  };
}

export function resolveMermaidSurfaceStyle(tokens: SlideThemeTokens) {
  return {
    color: tokens.diagram.text,
    fontFamily: tokens.fonts.sans,
  };
}

export function resolveMermaidFrameStyle(tokens: SlideThemeTokens) {
  return {
    borderColor: tokens.ui.border,
    background: tokens.diagram.surface,
  };
}

export function resolveMermaidMutedSurfaceStyle(tokens: SlideThemeTokens) {
  return {
    borderColor: tokens.ui.border,
    background: tokens.diagram.surfaceAlt,
    color: tokens.diagram.line,
  };
}

function createMermaidConfig(tokens: SlideThemeTokens, variant: MermaidRenderVariant) {
  const themeVariables = resolveMermaidThemeVariables(tokens);
  const fontFamily = themeVariables.fontFamily ?? tokens.fonts.sans;

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

function ensureMermaid(tokens: SlideThemeTokens) {
  if (initialized) return;

  mermaid.initialize(createMermaidConfig(tokens, "zoom"));
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
  tokens: SlideThemeTokens,
) {
  ensureMermaid(tokens);
  mermaid.initialize(createMermaidConfig(tokens, variant));
  const result = await mermaid.render(id, source);
  return result.svg;
}

export function MermaidDiagram({ code, children }: { code?: string; children?: ReactNode }) {
  const tokens = useSlideThemeTokens();
  const themeSignature = useMemo(() => serializeThemeTokens(tokens), [tokens]);
  const source = normalizeDiagramCode(code, children);
  const [previewSvg, setPreviewSvg] = useState<string>("");
  const [zoomSvg, setZoomSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [zoomLoading, setZoomLoading] = useState(false);
  const previewId = useMemo(() => `mermaid-preview-${Math.random().toString(36).slice(2, 10)}`, []);
  const zoomId = useMemo(() => `mermaid-zoom-${Math.random().toString(36).slice(2, 10)}`, []);
  const diagramSurfaceStyle = useMemo(
    () => resolveMermaidSurfaceStyle(tokens),
    [themeSignature, tokens],
  );
  const diagramFrameStyle = useMemo(
    () => resolveMermaidFrameStyle(tokens),
    [themeSignature, tokens],
  );
  const diagramMutedSurfaceStyle = useMemo(
    () => resolveMermaidMutedSurfaceStyle(tokens),
    [themeSignature, tokens],
  );

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      try {
        setPreviewSvg("");
        setZoomSvg("");
        setZoomLoading(false);
        const svg = await enqueueMermaidRender(() =>
          renderMermaidSvg(previewId, source, "preview", tokens),
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
  }, [previewId, source, themeSignature, tokens]);

  useEffect(() => {
    if (!zoomed || zoomSvg) return;

    let cancelled = false;

    const render = async () => {
      try {
        setZoomLoading(true);
        const svg = await enqueueMermaidRender(() =>
          renderMermaidSvg(zoomId, source, "zoom", tokens),
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
  }, [source, themeSignature, tokens, zoomId, zoomSvg, zoomed]);

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
            className="fixed inset-0 z-[120] flex items-center justify-center p-6 backdrop-blur-sm"
            style={{ background: "color-mix(in srgb, var(--slide-ui-surface) 72%, transparent)" }}
            onClick={() => setZoomed(false)}
          >
            <div
              className="relative flex h-[min(92vh,1200px)] w-[min(96vw,1600px)] flex-col overflow-hidden rounded-3xl border"
              style={{
                borderColor: tokens.ui.border,
                background: tokens.diagram.surface,
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div
                className="flex items-center justify-between border-b px-5 py-3 text-sm"
                style={{
                  borderColor: tokens.ui.border,
                  color: tokens.ui.muted,
                }}
              >
                <div>
                  <div
                    className="font-semibold tracking-[0.16em] uppercase"
                    style={{ color: tokens.ui.heading }}
                  >
                    Mermaid
                  </div>
                  <div className="mt-1 text-xs" style={{ color: tokens.ui.muted }}>
                    Esc or click outside to close
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setZoomed(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border transition"
                  style={{
                    borderColor: tokens.ui.border,
                    background: tokens.diagram.surfaceAlt,
                    color: tokens.ui.muted,
                  }}
                  aria-label="Close Mermaid zoom preview"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <div
                className="flex-1 overflow-auto p-6"
                style={{ background: tokens.diagram.surfaceAlt }}
              >
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
            className="absolute top-3 right-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition"
            style={{
              borderColor: tokens.ui.border,
              background: "color-mix(in srgb, var(--slide-diagram-surface) 92%, white 8%)",
              color: tokens.ui.muted,
            }}
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
