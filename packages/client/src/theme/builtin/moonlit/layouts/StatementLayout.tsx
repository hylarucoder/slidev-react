import type { ReactNode } from "react";

export function MoonlitStatementLayout({ children }: { children: ReactNode }) {
  return (
    <section className="slide-layout-statement moonlit-layout-statement grid size-full">
      <div className="moonlit-statement-shell">
        <div className="moonlit-statement-content">{children}</div>
        <div className="moonlit-statement-underline" />
      </div>
    </section>
  );
}
