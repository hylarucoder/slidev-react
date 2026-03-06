export function PresenterTopProgress({
  currentIndex,
  total,
  progressPercent,
  revealClicks,
  revealClicksTotal,
  elapsedLabel,
  remoteActive,
}: {
  currentIndex: number
  total: number
  progressPercent: number
  revealClicks: number
  revealClicksTotal: number
  elapsedLabel: string
  remoteActive: boolean
}) {
  const revealProgressPercent = revealClicksTotal > 0
    ? (revealClicks / revealClicksTotal) * 100
    : 0

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center">
      <div className="w-full rounded-b-[5px] border-b border-slate-200/80 bg-white/72 text-slate-800 shadow-[0_10px_28px_rgba(148,163,184,0.16)] ring-1 ring-white/40 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-3 py-1.5 lg:px-4">
          <div className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-slate-200/90">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,#22d3ee_0%,#38bdf8_42%,#f472b6_100%)] transition-[width] duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex shrink-0 items-center gap-2 text-[11px] font-medium text-slate-500">
            <span>{currentIndex + 1}/{total}</span>
            {revealClicksTotal > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/80 bg-sky-50/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-700">
                <span>Build</span>
                <span>{revealClicks}/{revealClicksTotal}</span>
                <span
                  aria-hidden
                  className="h-1.5 w-10 overflow-hidden rounded-full bg-sky-200/80"
                >
                  <span
                    className="block h-full rounded-full bg-[linear-gradient(90deg,#38bdf8_0%,#6366f1_100%)] transition-[width] duration-200 ease-out"
                    style={{ width: `${revealProgressPercent}%` }}
                  />
                </span>
              </span>
            )}
            <span>{elapsedLabel}</span>
            <span className={`size-2 rounded-full ${remoteActive ? "bg-emerald-300" : "bg-amber-300"}`} />
          </div>
        </div>
      </div>
    </div>
  )
}
