import type { ReactNode } from "react";
import { splitByFirstHr } from "./helpers";

export function ImageRightLayout({ children }: { children: ReactNode }) {
  const [left, right] = splitByFirstHr(children);

  if (!right) {
    return (
      <section className="slide-layout-image-right grid size-full place-content-start">
        <div className="min-w-0">{left}</div>
      </section>
    );
  }

  return (
    <section className="slide-layout-image-right grid size-full grid-cols-[1.2fr_0.8fr] items-center gap-12">
      <div className="min-w-0">{left}</div>
      <div className="min-w-0">{right}</div>
    </section>
  );
}
