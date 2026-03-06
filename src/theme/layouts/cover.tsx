import type { ReactNode } from "react";

export function CoverLayout({ children }: { children: ReactNode }) {
  return (
    <section className="slide-layout-cover grid size-full place-content-center">
      <div className="mx-auto w-full max-w-[1480px]">{children}</div>
    </section>
  );
}
