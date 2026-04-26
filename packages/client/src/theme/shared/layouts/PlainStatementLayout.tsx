import type { ReactNode } from "react";

export function PlainStatementLayout({ children }: { children: ReactNode }) {
  return (
    <section className="slide-layout-statement grid size-full">
      <div className="slide-statement-shell">{children}</div>
    </section>
  );
}
