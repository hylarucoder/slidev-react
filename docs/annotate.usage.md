# Annotate Usage

## Quick Start

Use `Annotate` for presentation-time emphasis on a short inline phrase.

```mdx
We should <Annotate>reduce coordination cost</Annotate> first.
We should <Annotate type="underline">make ownership visible</Annotate>.
We can <Annotate type="circle" step={1}>mark launch timing</Annotate>.
```

## Mental Model

`Annotate` has three decisions:

1. `type`: what mark shape to draw
2. `step`: when the mark appears
3. `animate`: whether the mark draws itself or appears instantly

The text remains the source of truth. `Annotate` only adds a mark on top.

## Recommended Usage

### Default emphasis

Use the default `highlight` when one short phrase needs the lightest emphasis.

```mdx
We should <Annotate>reduce coordination cost</Annotate> first.
```

### Match shape to meaning

```mdx
<Annotate type="underline">claim</Annotate>
<Annotate type="box">boundary</Annotate>
<Annotate type="circle">target</Annotate>
<Annotate type="strike-through">obsolete path</Annotate>
<Annotate type="crossed-off">rejected option</Annotate>
```

Suggested semantics:

- `highlight`: neutral emphasis
- `underline`: key claim or conclusion
- `box`: boundary, API, or stable unit
- `circle`: target, launch item, or focal point
- `strike-through`: deprecated path
- `crossed-off`: explicit rejection

### Use `step` for mark timing

Before `step`, the text is still visible. Only the mark is withheld.

```mdx
Keep the copy visible, then
<Annotate type="underline" step={1}>
  land the emphasis on cue
</Annotate>.
```

Use `Reveal` when the content itself should appear later.

### Use animation selectively

With `step`, the default is `animate={true}`.

```mdx
<Annotate type="underline" step={1}>
  draw the mark on cue
</Annotate>

<Annotate type="box" step={2} animate={false}>
  show instantly
</Annotate>
```

Rule of thumb:

- animate one or two meaningful beats on a slide
- use instant reveal when several marks appear on one slide
- avoid stacking many animated marks in the same paragraph

## Recommended Patterns

### One anchor per paragraph

```mdx
We should optimize for <Annotate>clarity at boundaries</Annotate>, not local cleverness.
```

### Reveal the emphasis, not the sentence

```mdx
The system should stay understandable, then
<Annotate type="underline" step={1}>
  highlight ownership boundaries
</Annotate>.
```

### Keep mark semantics consistent across a deck

- `underline` always means key point
- `box` always means boundary
- `circle` always means target

## Anti-Patterns

### Over-annotation

```mdx
We should <Annotate>reduce</Annotate> <Annotate>coordination</Annotate> <Annotate>cost</Annotate>.
```

### Using `step` as a hidden-state hack

Avoid treating `step={999}` as "disabled forever".

If no mark is needed, remove `Annotate`.

### Hiding meaning behind animation

If the sentence is confusing before the mark appears, improve the copy first.

## Current API

```tsx
type AnnotateProps = {
  children: ReactNode
  type?: 'underline' | 'box' | 'circle' | 'highlight' | 'strike-through' | 'crossed-off'
  step?: number
  animate?: boolean
  color?: string
}
```

## Limitations

Document usage as if `Annotate` supports:

- short inline phrases
- single-line or near-single-line emphasis
- left-to-right text flow

Do not promise rich multiline annotation behavior.

## Shared Team Rule

If the team wants one default convention:

- default to `highlight`
- use `underline` for claims
- use `box` for boundaries
- use `circle` for targets
- use `step` only for mark timing
- use `animate={false}` when pacing should stay crisp
- remove `Annotate` entirely when no mark is needed
