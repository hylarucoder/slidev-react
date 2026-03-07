function renderNotes(notes: string) {
  const sections = notes
    .split(/\n\s*\n/g)
    .map((section) => section.trim())
    .filter(Boolean);

  return sections.map((section, index) => (
    <p key={`${index}-${section.slice(0, 24)}`} className="whitespace-pre-wrap">
      {section}
    </p>
  ));
}

export function SpeakerNotesPanel({
  currentClicks,
  currentClicksTotal,
  notes,
}: {
  currentClicks: number;
  currentClicksTotal: number;
  notes?: string;
}) {
  const revealProgressPercent =
    currentClicksTotal > 0 ? (currentClicks / currentClicksTotal) * 100 : 0;

  return (
    <section className="flex min-h-0 flex-col rounded-[8px] border border-slate-200/70 bg-white/72 p-4 shadow-[0_18px_44px_rgba(148,163,184,0.18)] backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
          Speaker Notes
        </p>
        <span className="rounded-[5px] border border-slate-200 bg-white/88 px-2.5 py-1 text-[11px] font-medium text-slate-500">
          {currentClicksTotal > 0 ? `Clicks ${currentClicks}/${currentClicksTotal}` : "Slide cue"}
        </span>
      </div>
      <div className="mb-4 rounded-[6px] border border-slate-200/80 bg-white/75 p-3">
        <div className="mb-2 flex items-center justify-between gap-3 text-[11px] font-medium text-slate-500">
          <span>Reveal progress</span>
          <span>
            {currentClicksTotal > 0
              ? `${Math.max(currentClicksTotal - currentClicks, 0)} left`
              : "No click builds"}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200/80">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#38bdf8_0%,#60a5fa_55%,#a78bfa_100%)] transition-[width] duration-200 ease-out"
            style={{
              width: `${currentClicksTotal > 0 ? revealProgressPercent : 0}%`,
            }}
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 rounded-[5px] border border-slate-200/80 bg-slate-50/78 p-4 text-sm leading-7 text-slate-600">
        {notes ? (
          <div className="space-y-4 text-slate-600">{renderNotes(notes)}</div>
        ) : (
          <>
            <p className="font-medium text-slate-900">No notes yet.</p>
            <p className="mt-3 text-slate-500">
              Add slide-level frontmatter with <code>notes: |</code> to keep your phrasing,
              punchlines, and handoff lines close to the slide.
            </p>
          </>
        )}
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="rounded-[5px] border border-slate-200 bg-white/72 px-2.5 py-1">
            N notes
          </span>
          <span className="rounded-[5px] border border-slate-200 bg-white/72 px-2.5 py-1">
            O overview
          </span>
          <span className="rounded-[5px] border border-slate-200 bg-white/72 px-2.5 py-1">
            D draw
          </span>
          <span className="rounded-[5px] border border-slate-200 bg-white/72 px-2.5 py-1">
            Click stage advance
          </span>
          <span className="rounded-[5px] border border-slate-200 bg-white/72 px-2.5 py-1">
            Esc close panels
          </span>
        </div>
      </div>
    </section>
  );
}
