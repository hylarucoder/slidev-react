# Slidev to slidev-react Migration Guide

Last updated: 2026-03-07

This guide is for teams that already have Slidev decks and want to assess whether they can move to `slidev-react`.

Short version:

- `slidev-react` is close enough for many Markdown-first, MDX-friendly developer decks
- it is not a drop-in replacement for Vue Slidev
- the easiest migrations are decks that mostly rely on frontmatter, Markdown, code blocks, diagrams, and simple reveal flow

## Migration Fit

Good fit:

- decks that mainly use Markdown, code fences, Mermaid, PlantUML, and simple layouts
- teams that prefer React + MDX over Vue SFCs and Vue directives
- decks that want presenter notes, export, theme, and addon behavior inside a React-first runtime

Weak fit today:

- decks that depend heavily on Vue directives such as `v-click`, `v-after`, `v-switch`, or `v-motion`
- decks that rely on Monaco-driven live coding
- decks that need broad Slidev ecosystem compatibility without rewriting custom extensions

## Quick Mapping

| Slidev concept           | `slidev-react` status             | Notes                                                 |
| ------------------------ | --------------------------------- | ----------------------------------------------------- |
| Deck frontmatter         | supported                         | Use deck frontmatter in `slides.mdx`                  |
| Slide frontmatter        | supported                         | Use `---` to start a slide, then slide frontmatter    |
| Markdown slides          | supported                         | Markdown and MDX both work                            |
| Vue components in slides | rewrite required                  | Replace with React components / MDX helpers           |
| Presenter notes          | supported with different syntax   | Use `notes:` in slide frontmatter                     |
| Layouts                  | supported                         | Built-in layouts plus theme/addon layouts             |
| Themes                   | supported with different contract | Local runtime themes instead of Slidev theme packages |
| Addons / extensions      | supported with different contract | Local addon seam, not broad ecosystem compatibility   |
| PDF / PNG export         | supported                         | Browser print and Playwright export are available     |
| Reveal flow              | supported with React-first syntax | Use `<Reveal />`, not Vue directives                  |
| Monaco / live coding     | not implemented yet               | Planned but not shipped                               |

## Frontmatter Mapping

Deck-level fields that map cleanly today:

- `title`
- `theme`
- `layout`
- `background`
- `transition`
- `exportFilename`
- `addons`

Slide-level fields that map cleanly today:

- `title`
- `layout`
- `class`
- `background`
- `transition`
- `clicks`
- `notes`
- `src`

Example conversion:

```mdx
---
title: Strategy Review
theme: paper
addons:
  - insight
transition: fade
exportFilename: strategy-review
---

---

title: Executive Summary
layout: spotlight
clicks: 2
notes: |
Open with the business risk.
Pause before the cost slide.

---

# Three decisions to make now

<Reveal step={1}>
  <Insight title="Board angle">Tie margin recovery to hiring discipline.</Insight>
</Reveal>
```

## Speaker Notes

Slidev users often expect notes to live in a separate notes block or a Slidev-specific syntax.

In `slidev-react`, the current recommendation is:

- keep notes in slide frontmatter
- use YAML block strings
- review them in presenter mode or the notes workspace

Example:

```mdx
---
title: Launch Risks
notes: |
  Start with customer impact.
  Do not open with the implementation plan.
---
```

## Reveal Flow

This is one of the biggest conceptual differences.

Slidev often expresses reveal behavior through Vue directives and shorthand syntax.
`slidev-react` uses explicit React components and reveal state.

Use:

- `<Reveal step={1}>...</Reveal>`
- `<RevealGroup>` when grouping related reveals
- `clicks:` when you need explicit pacing beyond detected reveal blocks

Migration rule of thumb:

- if the original Slidev deck uses simple incremental reveal, migration is usually straightforward
- if it uses many directive-driven reveal patterns, expect manual rewriting

## Layouts, Themes, and Addons

`slidev-react` has a clean local contract here, but it is not Slidev-compatible.

Themes:

- live under `src/theme/themes/<theme-id>/`
- export `theme` from `index.ts`
- can provide layouts, MDX component overrides, root attributes, and an optional provider

Addons:

- live under `src/addons/<addon-id>/`
- export `addon` from `index.ts`
- can provide layouts, MDX helpers, and an optional provider

This means:

- migrating visual design is possible
- reusing existing Slidev theme packages directly is not supported

## Exports and Delivery

Current shipped export paths:

- browser `Print / PDF`
- Playwright-driven PDF export
- Playwright-driven PNG export
- `--slides` for range export
- `--with-clicks` for click-expanded export

This is already strong enough for many teaching, consulting, and async review workflows.

Still missing compared with broader Slidev expectations:

- PPTX export
- Markdown export
- richer export UI

## Current Gaps You Should Plan Around

Known migration gaps:

- no Monaco / live coding runtime yet
- no promise of broad Slidev plugin compatibility
- Vue-specific directives need manual rewrites
- unknown frontmatter fields from old decks may not map to runtime behavior

Practical implication:

- do not treat migration as a blind search-and-replace
- do treat it as a structured authoring model migration

## Recommended Migration Flow

1. Start with one representative Slidev deck, not the biggest one.
2. Port only deck frontmatter, slide frontmatter, Markdown, code fences, and diagrams first.
3. Replace Vue directives with `Reveal`-based React syntax.
4. Recreate theme behavior with a local theme under `src/theme/themes/`.
5. Recreate custom extension behavior with local addons only when needed.
6. Validate presenter notes, exports, and reveal pacing before migrating the rest of the portfolio.

## Honest Decision Rule

Choose `slidev-react` now if:

- you want a React-native deck runtime
- your deck logic is mostly content + layout + export, not Vue magic
- you are comfortable rewriting some interaction syntax

Wait before migrating if:

- your decks depend on Monaco or advanced Slidev ecosystem integrations
- your main goal is low-effort compatibility rather than a React-first authoring model

## Related Docs

- [README](../../README.md)
- [Feature roadmap](../plans/feat.todo.md)
