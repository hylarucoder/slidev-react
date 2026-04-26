export function PresentationEmptyState() {
  return (
    <div
      role="status"
      className="chrome-backdrop chrome-fg flex h-dvh items-center justify-center px-6 text-center"
    >
      <div className="max-w-md space-y-3">
        <h1 className="text-xl font-semibold">No slides yet</h1>
        <p className="text-sm chrome-fg-muted">
          Author your deck in <code className="chrome-surface-sunken rounded px-1.5 py-0.5">slides.mdx</code>.
          Each <code className="chrome-surface-sunken rounded px-1.5 py-0.5">---</code>-separated section
          becomes a slide; YAML frontmatter above the first divider controls the deck itself.
        </p>
      </div>
    </div>
  )
}
