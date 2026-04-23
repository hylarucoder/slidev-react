import type { ReactNode } from "react";

export function MoonlitSectionLayout({ children }: { children: ReactNode }) {
  return (
    <section className="slide-layout-section moonlit-layout-section grid size-full">
      <div className="moonlit-section-shell">
        <div className="moonlit-section-head" aria-hidden="true">
          <div className="moonlit-section-dot" />
          <div className="moonlit-section-rule" />
        </div>
        <div className="moonlit-section-body">
          <div className="moonlit-section-content">{children}</div>
          <aside className="moonlit-section-aside" aria-hidden="true">
            <div className="moonlit-section-aside-orbit" />
            <div className="moonlit-section-aside-line" />
          </aside>
        </div>
      </div>
    </section>
  );
}
