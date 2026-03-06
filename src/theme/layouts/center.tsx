import type { ReactNode } from "react";

export function CenterLayout({ children }: { children: ReactNode }) {
  return (
    <section className="slide-layout-center grid size-full place-content-center text-center">
      {children}
    </section>
  );
}
