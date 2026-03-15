import type { ReactNode } from "react";

export function AbsolutelySectionLayout({ children }: { children: ReactNode }) {
  return (
    <section className="slide-layout-section absolutely-layout-section grid size-full">
      <div className="absolutely-section-shell">
        <div className="absolutely-section-rule" />
        <div className="absolutely-section-content">{children}</div>
      </div>
    </section>
  );
}
