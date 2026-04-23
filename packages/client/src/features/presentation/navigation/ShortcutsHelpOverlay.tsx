import { Keyboard, X } from "lucide-react";
import { ChromeIconButton } from "../../../ui/primitives/ChromeIconButton";
import type { ShortcutHelpSection } from "./keyboardShortcuts";

function ShortcutKeys({ value }: { value: string }) {
  const chords = value.split(" / ");

  return (
    <div className="flex flex-wrap items-center gap-1">
      {chords.map((chord, chordIndex) => {
        const keys = chord.split(/\s*\+\s*/);

        return (
          <span key={`${chord}-${chordIndex}`} className="inline-flex items-center gap-1">
            {keys.map((key, keyIndex) => (
              <kbd
                key={`${key}-${keyIndex}`}
                className="inline-flex min-w-[22px] items-center justify-center rounded-[4px] border border-slate-200 bg-white px-1.5 py-[2px] font-mono text-[11px] font-medium text-slate-700 shadow-[inset_0_-1px_0_rgba(15,23,42,0.05)]"
              >
                {key}
              </kbd>
            ))}
            {chordIndex < chords.length - 1 ? (
              <span className="px-[2px] text-[11px] text-slate-300">/</span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

export function ShortcutsHelpOverlay({
  open,
  sections,
  onClose,
}: {
  open: boolean;
  sections: ShortcutHelpSection[];
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-50 bg-slate-950/35 backdrop-blur-[2px]"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="mx-auto flex h-full w-full items-center justify-center px-4 py-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex max-h-full w-full max-w-[520px] flex-col overflow-hidden rounded-[8px] border border-slate-200/80 bg-white/95 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur-sm">
          <header className="flex items-center justify-between border-b border-slate-200/80 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Keyboard size={14} className="text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">Keyboard Shortcuts</h2>
            </div>
            <ChromeIconButton
              onClick={onClose}
              aria-label="Close keyboard shortcuts"
              title="Close"
            >
              <X size={14} />
            </ChromeIconButton>
          </header>
          <div className="min-h-0 overflow-auto px-4 py-3.5">
            {sections.map((section, sectionIndex) => (
              <section key={section.title} className={sectionIndex === 0 ? "" : "mt-4"}>
                <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {section.title}
                </h3>
                <dl className="grid grid-cols-[minmax(140px,auto)_1fr] gap-x-5 gap-y-1 text-sm">
                  {section.items.map((item) => (
                    <div
                      key={`${section.title}:${item.keys}:${item.action}`}
                      className="contents"
                    >
                      <dt className="flex items-center py-1">
                        <ShortcutKeys value={item.keys} />
                      </dt>
                      <dd className="flex items-center py-1 text-[13px] text-slate-700">
                        {item.action}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
