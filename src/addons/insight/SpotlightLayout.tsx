import type { ReactNode } from "react";

export function SpotlightLayout({ children }: { children: ReactNode }) {
  return (
    <section className="slide-layout-spotlight grid size-full place-items-center">
      <div className="spotlight-shell w-full max-w-[1440px] rounded-[32px] border border-white/60 bg-white/78 px-16 py-14 shadow-[0_28px_90px_rgba(15,23,42,0.12)] backdrop-blur">
        {children}
      </div>
    </section>
  );
}
