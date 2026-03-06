import mermaid from "mermaid";
import { useEffect, useMemo, useState, type ReactNode } from "react";

function normalizeDiagramCode(code: string | undefined, children: ReactNode) {
  if (typeof code === "string") return code;

  if (typeof children === "string") return children;

  if (Array.isArray(children)) return children.join("");

  return "";
}

let initialized = false;

const themeVariables: Record<string, string> = {
  primaryColor: "#22C55E",
  primaryTextColor: "#ffffff",
  primaryBorderColor: "#16A34A",
  lineColor: "#334155",
  background: "#ffffff",
  mainBkg: "#ffffff",
  secondBkg: "#f8fafc",
  tertiaryColor: "#f1f5f9",
  textColor: "#0f172a",
  secondaryColor: "#475569",
  tertiaryTextColor: "#64748b",
  border1: "#cbd5e1",
  border2: "#e2e8f0",
  nodeBkg: "#f8fafc",
  nodeBorder: "#94a3b8",
  nodeTextColor: "#0f172a",
  clusterBkg: "#f8fafc",
  clusterBorder: "#cbd5e1",
  edgeLabelBackground: "#ffffff",
  arrowheadColor: "#475569",
  actorBkg: "#ffffff",
  actorBorder: "#22C55E",
  actorTextColor: "#0f172a",
  actorLineColor: "#94a3b8",
  signalColor: "#334155",
  signalTextColor: "#0f172a",
  labelBoxBkgColor: "#f8fafc",
  labelBoxBorderColor: "#cbd5e1",
  labelTextColor: "#0f172a",
  loopTextColor: "#0f172a",
  noteBkgColor: "#fefce8",
  noteTextColor: "#1e293b",
  noteBorderColor: "#e2e8f0",
  activationBkgColor: "#86efac",
  activationBorderColor: "#22C55E",
  labelColor: "#0f172a",
  classText: "#0f172a",
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
  commitLabelColor: "#0f172a",
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

function ensureMermaid() {
  if (initialized) return;

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: "base",
    themeVariables,
    flowchart: {
      curve: "basis",
      padding: 15,
    },
  });

  initialized = true;
}

export function MermaidDiagram({ code, children }: { code?: string; children?: ReactNode }) {
  const source = normalizeDiagramCode(code, children);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const id = useMemo(() => `mermaid-${Math.random().toString(36).slice(2, 10)}`, []);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      try {
        ensureMermaid();
        const result = await mermaid.render(id, source);
        if (!cancelled) {
          setSvg(result.svg);
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
  }, [id, source]);

  if (error) {
    return (
      <div className="my-3 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900">
        Mermaid render error: {error}
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-3 rounded-xl border border-slate-300 bg-white/70 p-3 text-sm text-slate-700">
        Rendering Mermaid...
      </div>
    );
  }

  return (
    <div
      className="my-3 overflow-x-auto rounded-xl border border-slate-300 bg-white p-3"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
