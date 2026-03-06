import type { ReactNode } from "react";
import { splitByFirstHr } from "./helpers";

export function TwoColsLayout({ children }: { children: ReactNode }) {
  const [left, right] = splitByFirstHr(children);

  if (!right) {
    return (
      <section className="slide-layout-two-cols grid size-full place-content-start">
        <div className="min-w-0">{left}</div>
      </section>
    );
  }

  return (
    <section className="slide-layout-two-cols grid size-full grid-cols-2 items-start gap-12">
      <div className="min-w-0">{left}</div>
      <div className="min-w-0">{right}</div>
    </section>
  );
}
