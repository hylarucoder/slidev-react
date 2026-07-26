import type { ReactNode } from "react";

export function KamiChapterLayout({ children }: { children: ReactNode }) {
  return (
    <section className="slide-layout-chapter kami-layout-chapter grid size-full">
      <div className="kami-chapter-shell">{children}</div>
    </section>
  );
}
