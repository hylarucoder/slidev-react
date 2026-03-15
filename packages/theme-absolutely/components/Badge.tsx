import type { ReactNode } from "react";

export function AbsolutelyBadge({ children }: { children: ReactNode }) {
  return <span className="absolutely-badge">{children}</span>;
}
