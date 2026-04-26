import type { ReactNode } from "react";

export function PlainChapterLayout({ children }: { children: ReactNode }) {
  return (
    <section className="slide-layout-chapter grid size-full">
      <div className="slide-chapter-shell">{children}</div>
    </section>
  );
}
