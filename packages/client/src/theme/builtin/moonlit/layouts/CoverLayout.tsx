import type { ReactNode } from "react";

export function MoonlitCoverLayout({ children }: { children: ReactNode }) {
  return (
    <section className="slide-layout-cover moonlit-layout-cover grid size-full">
      <div className="moonlit-cover-shell">
        <div className="moonlit-cover-ornament moonlit-cover-ornament--halo" />
        <div className="moonlit-cover-ornament moonlit-cover-ornament--grain" />
        <div className="moonlit-cover-frame">
          <div className="moonlit-cover-rail" />
          <div className="moonlit-cover-main">
            <div className="moonlit-cover-heading-row" aria-hidden="true">
              <div className="moonlit-cover-heading-dot" />
              <div className="moonlit-cover-heading-rule" />
            </div>
            <div className="moonlit-cover-content">{children}</div>
          </div>
          <aside className="moonlit-cover-aside" aria-hidden="true">
            <div className="moonlit-cover-icon-box">
              <div className="moonlit-cover-icon-inner">
                <div className="moonlit-cover-icon-mark" />
              </div>
            </div>
            <div className="moonlit-cover-aside-divider" />
            <div className="moonlit-cover-aside-stack">
              <span />
              <span />
              <span />
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
