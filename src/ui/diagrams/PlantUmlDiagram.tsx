import type { ReactNode } from "react";
import plantumlEncoder from "plantuml-encoder";

const DEFAULT_SERVER = "https://www.plantuml.com/plantuml/svg/";

function normalizeDiagramCode(code: string | undefined, children: ReactNode) {
  if (typeof code === "string") return code;

  if (typeof children === "string") return children;

  if (Array.isArray(children)) return children.join("");

  return "";
}

export function PlantUmlDiagram({
  code,
  children,
  server = DEFAULT_SERVER,
}: {
  code?: string;
  children?: ReactNode;
  server?: string;
}) {
  const encoded = plantumlEncoder.encode(normalizeDiagramCode(code, children));
  const src = `${server}${encoded}`;

  return (
    <div className="my-3 overflow-x-auto rounded-xl border border-slate-300 bg-white p-3">
      <img src={src} alt="PlantUML diagram" className="max-w-full" loading="lazy" />
    </div>
  );
}
