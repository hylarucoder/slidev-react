import type { ReactNode } from "react";

export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="absolutely-eyebrow">{children}</span>;
}
