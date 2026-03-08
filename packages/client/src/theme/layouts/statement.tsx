import type { ReactNode } from "react";

export function StatementLayout({ children }: { children: ReactNode }) {
  return (
    <section className="slide-layout-statement grid size-full place-content-center text-center">
      <div className="slide-layout-statement-content mx-auto w-full max-w-[1240px]">{children}</div>
    </section>
  );
}
