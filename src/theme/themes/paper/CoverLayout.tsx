import type { ReactNode } from "react";

export function PaperCoverLayout({ children }: { children: ReactNode }) {
  return (
    <section className="slide-layout-cover grid size-full place-content-center">
      <div className="paper-cover-shell mx-auto w-full max-w-[1500px] rounded-[32px] border border-[rgba(146,64,14,0.18)] bg-[rgba(255,251,235,0.84)] px-18 py-16 shadow-[0_30px_100px_rgba(146,64,14,0.12)]">
        <div className="paper-cover-accent mb-8 h-2 w-28 rounded-full bg-[linear-gradient(90deg,#b45309_0%,#f59e0b_100%)]" />
        {children}
      </div>
    </section>
  );
}
