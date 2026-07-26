import type { ReactNode } from "react";

export function KamiCoverLayout({ children }: { children: ReactNode }) {
  return (
    <section className="slide-layout-cover kami-layout-cover grid size-full">
      <div className="kami-cover-shell">
        <div className="kami-cover-content">{children}</div>
        <div className="kami-cover-rule" aria-hidden="true" />
      </div>
    </section>
  );
}
