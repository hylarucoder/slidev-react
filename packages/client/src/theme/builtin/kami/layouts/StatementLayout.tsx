import type { ReactNode } from "react";

export function KamiStatementLayout({ children }: { children: ReactNode }) {
  return (
    <section className="slide-layout-statement kami-layout-statement grid size-full">
      <div className="kami-statement-shell">{children}</div>
    </section>
  );
}
