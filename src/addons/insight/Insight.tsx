import type { ReactNode } from "react";

export function Insight({ title = "Insight", children }: { title?: string; children: ReactNode }) {
  return (
    <aside className="slide-insight">
      <div className="slide-insight-title">{title}</div>
      <div className="slide-insight-body">{children}</div>
    </aside>
  );
}
