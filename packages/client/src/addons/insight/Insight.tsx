import type { ReactNode } from "react";

export function Insight({ title = "Insight", children }: { title?: string; children: ReactNode }) {
  return (
    <aside
      className="mt-5 rounded-[1.25rem] border border-[var(--slide-insight-border)] bg-[var(--slide-insight-bg)] px-[1.1rem] py-4"
      style={{ boxShadow: "var(--slide-insight-shadow)" }}
    >
      <div className="mb-[0.45rem] text-[0.78rem] font-bold uppercase tracking-[0.14em] text-[var(--slide-insight-title)]">
        {title}
      </div>
      <div className="text-[var(--slide-insight-text)]">{children}</div>
    </aside>
  );
}
