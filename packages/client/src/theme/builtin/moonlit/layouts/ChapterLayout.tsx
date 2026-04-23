import type { ReactNode } from "react";

export function MoonlitChapterLayout({ children }: { children: ReactNode }) {
  return (
    <section className="slide-layout-chapter moonlit-layout-chapter grid size-full">
      <div className="moonlit-chapter-shell">
        <div className="moonlit-chapter-content">{children}</div>
        <aside className="moonlit-chapter-aside" aria-hidden="true">
          <div className="moonlit-chapter-icon-box">
            <div className="moonlit-chapter-icon-inner">
              <div className="moonlit-chapter-icon-mark" />
            </div>
          </div>
          <div className="moonlit-chapter-divider" />
          <div className="moonlit-chapter-rhythm">
            <span />
            <span />
            <span />
            <span />
          </div>
        </aside>
      </div>
    </section>
  );
}
