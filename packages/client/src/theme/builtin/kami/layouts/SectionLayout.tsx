import type { ReactNode } from "react";

export function KamiSectionLayout({ children }: { children: ReactNode }) {
  return (
    <section className="slide-layout-section kami-layout-section grid size-full">
      <div className="kami-section-shell">{children}</div>
    </section>
  );
}
