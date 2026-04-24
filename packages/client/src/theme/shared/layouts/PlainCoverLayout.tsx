import type { ReactNode } from "react";

export function PlainCoverLayout({ children }: { children: ReactNode }) {
  return (
    <section className="slide-layout-cover grid size-full">
      <div className="slide-cover-shell">{children}</div>
    </section>
  );
}
