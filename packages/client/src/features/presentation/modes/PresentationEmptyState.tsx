export function PresentationEmptyState() {
  return (
    <div
      role="status"
      className="flex h-dvh items-center justify-center px-6 text-center"
      style={{ background: 'var(--chrome-backdrop)', color: 'var(--chrome-fg)' }}
    >
      <div className="max-w-md space-y-3">
        <h1 className="text-xl font-semibold">No slides yet</h1>
        <p className="text-sm text-slate-500">
          Author your deck in <code className="rounded bg-slate-100 px-1.5 py-0.5">slides.mdx</code>.
          Each <code className="rounded bg-slate-100 px-1.5 py-0.5">---</code>-separated section
          becomes a slide; YAML frontmatter above the first divider controls the deck itself.
        </p>
      </div>
    </div>
  )
}
