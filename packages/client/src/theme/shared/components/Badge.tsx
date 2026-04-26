import type { ReactNode } from "react";

export function SlideBadge({ children }: { children: ReactNode }) {
  return <span className="slide-badge">{children}</span>;
}
