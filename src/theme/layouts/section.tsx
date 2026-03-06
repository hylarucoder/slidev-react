import type { ReactNode } from "react";

export function SectionLayout({ children }: { children: ReactNode }) {
  return (
    <section className="slide-layout-section grid size-full place-content-center text-center">
      <div className="mx-auto w-full max-w-[1320px]">{children}</div>
    </section>
  );
}
