import type { ReactNode } from "react";

export function CenterLayout({ children }: { children: ReactNode }) {
  return (
    <section className="slide-layout-center grid size-full place-content-center text-center">
      <div className="slide-layout-center-content mx-auto w-full max-w-[1180px]">{children}</div>
    </section>
  );
}
