import { Keyboard, X } from "lucide-react";
import { ChromeIconButton } from "../../../ui/primitives/ChromeIconButton";
import { ChromePanel } from "../../../ui/primitives/ChromePanel";
import { ChromeTag } from "../../../ui/primitives/ChromeTag";
import type { ShortcutHelpSection } from "./keyboardShortcuts";

function ShortcutKeys({ value }: { value: string }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {value.split(" / ").map((part, index, list) => (
        <span key={`${part}-${index}`} className="inline-flex items-center gap-1">
          <kbd className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
            {part}
          </kbd>
          {index < list.length - 1 ? <span className="text-[10px] text-slate-300">/</span> : null}
        </span>
      ))}
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
    <div className="absolute inset-0 z-50 bg-black/30 backdrop-blur-sm">
      <div className="mx-auto flex h-full w-full max-w-[1640px] items-center justify-center px-4 py-4 sm:px-6">
        <ChromePanel
          tone="solid"
          radius="section"
          padding="none"
          className="flex max-h-full w-full max-w-[1180px] flex-col overflow-hidden bg-white/90"
        >
          <header className="border-b border-slate-200/80 px-4 py-4 sm:px-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <ChromeTag
                    tone="active"
                    size="sm"
                    weight="semibold"
                    className="uppercase tracking-[0.18em]"
                  >
                    <Keyboard size={13} />
                    Keyboard Shortcuts
                  </ChromeTag>
                  <ChromeTag size="sm">Press `?` or double-tap `Shift`</ChromeTag>
                </div>
                <h2 className="text-lg font-semibold text-slate-950 sm:text-xl">
                  Everything the runtime can do from the keyboard
                </h2>
                <p className="mt-1.5 max-w-3xl text-sm leading-5 text-slate-600">
                  This list only shows shortcuts that are actually implemented right now, so it
                  stays trustworthy as the product evolves.
                </p>
              </div>
              <ChromeIconButton
                onClick={onClose}
                aria-label="Close keyboard shortcuts"
                title="Close keyboard shortcuts"
                className="rounded-full"
              >
                <X size={18} />
              </ChromeIconButton>
            </div>
          </header>
          <div className="min-h-0 overflow-auto px-4 py-4 sm:px-5 sm:py-5">
            <div className="grid gap-3 lg:grid-cols-3">
              {sections.map((section) => (
                <ChromePanel
                  key={section.title}
                  tone="frame"
                  radius="section"
                  className="overflow-hidden border border-slate-200/80 bg-slate-50/72"
                >
                  <div className="border-b border-slate-200/75 px-3.5 py-3">
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700">
                      {section.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-5 text-slate-500">{section.description}</p>
                  </div>
                  <div className="px-3 py-2.5">
                    <div className="space-y-2">
                      {section.items.map((item) => (
                        <div
                          key={`${section.title}:${item.keys}:${item.action}`}
                          className="flex flex-col gap-1.5 rounded-md border border-white/80 bg-white/82 px-2.5 py-2.5"
                        >
                          <ShortcutKeys value={item.keys} />
                          <div className="text-[13px] leading-5 text-slate-700">{item.action}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </ChromePanel>
              ))}
            </div>
          </div>
        </ChromePanel>
      </div>
    </div>
  );
}
