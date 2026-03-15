import type { ReactNode } from "react";

export function AbsolutelyCoverLayout({ children }: { children: ReactNode }) {
  return (
    <section className="slide-layout-cover absolutely-layout-cover grid size-full">
      <div className="absolutely-cover-shell">
        <div className="absolutely-cover-ornament absolutely-cover-ornament--sun" />
        <div className="absolutely-cover-ornament absolutely-cover-ornament--grain" />
        <div className="absolutely-cover-rail" />
        <div className="absolutely-cover-content">{children}</div>
      </div>
    </section>
  );
}
