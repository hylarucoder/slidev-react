import type { ReactNode } from "react";

export function MoonlitBadge({ children }: { children: ReactNode }) {
  return <span className="moonlit-badge">{children}</span>;
}
