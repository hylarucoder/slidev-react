import type { ReactNode } from "react";

export function PlainSectionLayout({ children }: { children: ReactNode }) {
  return (
    <section className="slide-layout-section grid size-full">
      <div className="slide-section-shell">{children}</div>
    </section>
  );
}
