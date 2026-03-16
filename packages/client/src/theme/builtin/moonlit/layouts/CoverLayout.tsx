import type { ReactNode } from "react";

export function MoonlitCoverLayout({ children }: { children: ReactNode }) {
  return (
    <section className="slide-layout-cover moonlit-layout-cover grid size-full">
      <div className="moonlit-cover-shell">
        <div className="moonlit-cover-ornament moonlit-cover-ornament--halo" />
        <div className="moonlit-cover-ornament moonlit-cover-ornament--grain" />
        <div className="moonlit-cover-rail" />
        <div className="moonlit-cover-content">{children}</div>
      </div>
    </section>
  );
}
