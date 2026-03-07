import { NotebookText, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CompiledSlide } from "../presenter/types";

function summarizeNotes(notes?: string) {
  if (!notes) return "No speaker notes yet.";

  const normalized = notes.replace(/\s+/g, " ").trim();
  if (normalized.length <= 140) return normalized;

  return `${normalized.slice(0, 137)}...`;
}

function toParagraphs(notes?: string) {
  if (!notes) return [];

  return notes
    .split(/\n\s*\n/g)
    .map((section) => section.trim())
    .filter(Boolean);
}

export function NotesOverview({
  open,
  slides,
  currentIndex,
  onClose,
  onSelect,
}: {
  open: boolean;
  slides: CompiledSlide[];
  currentIndex: number;
  onClose: () => void;
  onSelect: (index: number) => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(currentIndex);

  useEffect(() => {
    if (!open) return;

    setSelectedIndex(currentIndex);
  }, [currentIndex, open]);

  const selectedSlide = slides[selectedIndex] ?? slides[currentIndex] ?? null;
  const notedSlidesCount = useMemo(
    () => slides.filter((slide) => Boolean(slide.meta.notes?.trim())).length,
    [slides],
  );
  const selectedNotes = toParagraphs(selectedSlide?.meta.notes);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 bg-slate-100/84 backdrop-blur-sm">
      <div className="mx-auto flex h-full w-full max-w-[1800px] flex-col px-6 py-6">
        <header className="mb-4 flex items-start justify-between gap-6">
          <div className="text-slate-900">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-medium text-slate-600">
              <NotebookText size={14} />
              <span>
                {notedSlidesCount}/{slides.length} slides have notes
              </span>
            </div>
            <h2 className="text-lg font-semibold">Notes Workspace</h2>
            <p className="text-sm text-slate-600">
              Review the whole narrative, then jump directly to the slide you want to rehearse.
              Press `N` or `Esc` to close.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notes workspace"
            className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          >
            <X size={18} />
          </button>
        </header>
        <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(340px,420px)_minmax(0,1fr)]">
          <section className="min-h-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/92 shadow-[0_18px_40px_rgba(148,163,184,0.16)]">
            <div className="border-b border-slate-200/80 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-900">Slide Notes Index</h3>
              <p className="mt-1 text-sm text-slate-500">
                Every slide is listed here, including the ones that still need notes.
              </p>
            </div>
            <div className="min-h-0 overflow-auto p-3">
              <div className="space-y-2">
                {slides.map((slide, index) => {
                  const active = index === selectedIndex;
                  const isCurrent = index === currentIndex;
                  const hasNotes = Boolean(slide.meta.notes?.trim());

                  return (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => setSelectedIndex(index)}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        active
                          ? "border-blue-400 bg-blue-50 shadow-[0_0_0_1px_rgba(96,165,250,0.38)]"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                            {index + 1}
                          </span>
                          {isCurrent && (
                            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              Current
                            </span>
                          )}
                        </div>
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                            hasNotes ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {hasNotes ? "Notes ready" : "No notes"}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-slate-900">
                        {slide.meta.title ?? `Slide ${index + 1}`}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {summarizeNotes(slide.meta.notes)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
          <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/92 shadow-[0_18px_40px_rgba(148,163,184,0.16)]">
            <div className="border-b border-slate-200/80 px-6 py-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                  {selectedIndex + 1}
                </span>
                {selectedSlide?.meta.layout && (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                    {selectedSlide.meta.layout}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {selectedSlide?.meta.title ?? `Slide ${selectedIndex + 1}`}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedSlide?.meta.notes?.trim()
                      ? "Full speaker notes for the selected slide."
                      : "This slide still needs presenter notes."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelect(selectedIndex)}
                  className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Jump To Slide
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
              {selectedNotes.length > 0 ? (
                <div className="space-y-4 text-[15px] leading-7 text-slate-600">
                  {selectedNotes.map((paragraph, index) => (
                    <p key={`${index}-${paragraph.slice(0, 24)}`} className="whitespace-pre-wrap">
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6">
                  <p className="font-medium text-slate-900">No notes on this slide yet.</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Add slide frontmatter with <code>notes: |</code> to capture your framing,
                    punchlines, and the line you do not want to improvise live.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
