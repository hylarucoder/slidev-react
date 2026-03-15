import type { ReactNode } from "react";

export function AbsolutelyStatementLayout({ children }: { children: ReactNode }) {
  return (
    <section className="slide-layout-statement absolutely-layout-statement grid size-full">
      <div className="absolutely-statement-shell">
        <div className="absolutely-statement-content">{children}</div>
        <div className="absolutely-statement-underline" />
      </div>
    </section>
  );
}
