import type { ReactNode } from "react";

export function PaperBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[rgba(146,64,14,0.2)] bg-[rgba(255,247,237,0.95)] px-3 py-1 text-[0.8em] font-semibold uppercase tracking-[0.14em] text-amber-800 shadow-[0_8px_18px_rgba(146,64,14,0.08)]">
      {children}
    </span>
  );
}
