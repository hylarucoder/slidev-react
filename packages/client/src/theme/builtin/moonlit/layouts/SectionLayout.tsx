import type { ReactNode } from "react";

export function MoonlitSectionLayout({ children }: { children: ReactNode }) {
  return (
    <section className="slide-layout-section moonlit-layout-section grid size-full">
      <div className="moonlit-section-shell">
        <div className="moonlit-section-rule" />
        <div className="moonlit-section-content">{children}</div>
      </div>
    </section>
  );
}
