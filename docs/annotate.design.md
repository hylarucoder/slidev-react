# Annotate Design

## Goal

`Annotate` is a presentation emphasis primitive for short inline text.

It should help the presenter answer one question:

"What deserves attention right now?"

## Public API

```tsx
type AnnotateProps = {
  children: ReactNode
  type?: 'underline' | 'box' | 'circle' | 'highlight' | 'strike-through' | 'crossed-off'
  step?: number
  animate?: boolean
  color?: string
}
```

## Design Rules

1. `Annotate` only owns the mark, not the text content.
2. `step` uses the same reveal timeline as `Reveal`, but controls mark timing instead of content timing.
3. Without `step`, the mark appears immediately.
4. With `step`, the mark appears on that reveal step while the text stays readable.
5. `animate` only controls how the mark appears, not whether it participates in reveal flow.
6. If a phrase should not be annotated, do not render `Annotate`.

## Why This Boundary

- It keeps authoring simple: choose a shape, decide a step, optionally tune color.
- It matches presentation behavior better than hiding the text itself.
- It avoids muddy states like "use `Annotate`, but hide the annotation."
- It keeps `Annotate` aligned with `Reveal` through one shared concept: `step`.

## Non-Goals

- Not a general inline styling component
- Not a multiline annotation system
- Not a layout framing tool
- Not a conditionally disabled wrapper

## Authoring Heuristic

- Use `Reveal` when content should appear later.
- Use `Annotate step={n}` when the content should stay visible but the emphasis should arrive later.
