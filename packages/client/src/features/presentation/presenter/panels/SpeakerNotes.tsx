import { ChromePanel } from "../../../../ui/primitives/ChromePanel";
import { ChromeTag } from "../../../../ui/primitives/ChromeTag";

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

export function SpeakerNotes({
  currentClicks,
  currentClicksTotal,
  notes,
}: {
  currentClicks: number;
  currentClicksTotal: number;
  notes?: string;
}) {
  return (
    <ChromePanel className="flex flex-col">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] chrome-fg-subtle">
          Notes
        </p>
        {currentClicksTotal > 0 && (
          <ChromeTag>{`Clicks ${currentClicks}/${currentClicksTotal}`}</ChromeTag>
        )}
      </div>
      <ChromePanel tone="inset" radius="frame" className="flex-1 p-4 text-sm leading-7">
        {notes ? (
          <div className="space-y-4 chrome-fg-muted">{renderNotes(notes)}</div>
        ) : (
          <>
            <p className="font-medium chrome-fg">No notes yet.</p>
            <p className="mt-3 chrome-fg-subtle">
              Add slide-level frontmatter with <code>notes: |</code> to keep your phrasing,
              punchlines, and handoff lines close to the slide.
            </p>
          </>
        )}
      </ChromePanel>
    </ChromePanel>
  );
}
