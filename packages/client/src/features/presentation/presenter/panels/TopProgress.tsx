export function TopProgress({
  total,
  progressPercent,
}: {
  total: number;
  progressPercent: number;
}) {
  const segmentCount = Math.max(total, 1);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30">
      <div className="relative h-[3px] w-full overflow-hidden bg-slate-200/60">
        <div
          className="absolute inset-y-0 left-0 bg-emerald-500 transition-[width] duration-300"
          style={{ width: `${progressPercent}%` }}
        />
        <div
          className="absolute inset-0 grid gap-px"
          style={{ gridTemplateColumns: `repeat(${segmentCount}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: segmentCount }, (_, index) => (
            <span key={index} aria-hidden className="bg-transparent" />
          ))}
        </div>
      </div>
    </div>
  );
}
