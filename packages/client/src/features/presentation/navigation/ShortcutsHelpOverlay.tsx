import { OverlayShell } from '../../../ui/primitives/OverlayShell'
import type { ShortcutHelpSection } from './keyboardShortcuts'

function ShortcutKeys({ value }: { value: string }) {
  const chords = value.split(' / ')

  return (
    <div className="flex flex-wrap items-center gap-1">
      {chords.map((chord, chordIndex) => {
        const keys = chord.split(/\s*\+\s*/)
        return (
          <span key={`${chord}-${chordIndex}`} className="inline-flex items-center gap-1">
            {keys.map((key, keyIndex) => (
              <kbd
                key={`${key}-${keyIndex}`}
                className="inline-flex min-w-[22px] items-center justify-center rounded-[4px] border chrome-border bg-white px-1.5 py-[2px] font-mono text-[11px] font-medium chrome-fg shadow-[inset_0_-1px_0_rgba(15,23,42,0.05)]"
              >
                {key}
              </kbd>
            ))}
            {chordIndex < chords.length - 1 ? (
              <span className="px-[2px] text-[11px] chrome-fg-subtle">/</span>
            ) : null}
          </span>
        )
      })}
    </div>
  )
}

export function ShortcutsHelpOverlay({
  open,
  sections,
  onClose,
}: {
  open: boolean
  sections: ShortcutHelpSection[]
  onClose: () => void
}) {
  return (
    <OverlayShell
      open={open}
      onClose={onClose}
      title="Keyboard Shortcuts"
      variant="centered"
      closeAriaLabel="Close keyboard shortcuts"
    >
      {sections.map((section, sectionIndex) => (
        <section key={section.title} className={sectionIndex === 0 ? '' : 'mt-4'}>
          <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] chrome-fg-subtle">
            {section.title}
          </h3>
          <dl className="grid grid-cols-[minmax(140px,auto)_1fr] gap-x-5 gap-y-1 text-sm">
            {section.items.map((item) => (
              <div key={`${section.title}:${item.keys}:${item.action}`} className="contents">
                <dt className="flex items-center py-1">
                  <ShortcutKeys value={item.keys} />
                </dt>
                <dd className="flex items-center py-1 text-[13px] chrome-fg">
                  {item.action}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </OverlayShell>
  )
}
