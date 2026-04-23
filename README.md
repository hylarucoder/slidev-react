# slidev-react

[![Version](https://img.shields.io/npm/v/@slidev-react/core)](https://npmjs.com/package/@slidev-react/core)
[![CI](https://github.com/hylarucoder/slidev-react/actions/workflows/ci.yml/badge.svg)](https://github.com/hylarucoder/slidev-react/actions)
[![License](https://img.shields.io/npm/l/@slidev-react/core)](LICENSE)

React-first presentation runtime with an MDX slides pipeline, presenter/viewer modes, and built-in interactive slide features.

[中文说明](./README.zh-CN.md)

https://github.com/user-attachments/assets/553392a4-36ae-4505-87c2-ca54e7e00f08

## Overview

`slidev-react` is a slide system built around:

- **React 19** for rendering
- **MDX** as the authoring format
- **Vite** for the app runtime
- a compile-time slides pipeline under `packages/node/src/slides`
- a presentation shell with presenter/viewer sync, reveal flow, drawings, and recording

> Inspired by [Slidev](https://github.com/slidevjs/slidev), but this is an independent React + MDX runtime with its own slides model and rendering pipeline, not a Vue Slidev port.

## Highlights

- MDX-authored slides source in [`slides.mdx`](./slides.mdx)
- Compile-time parsing and slides artifact generation
- Built-in slide layouts: `default`, `center`, `cover`, `section`, `two-cols`, `image-right`, `statement`
- React-native MDX helpers: `Badge`, `Callout`, `Annotate`, `Reveal`, `RevealGroup`, and more
- Diagram fences for Mermaid and G2 charts (via addons)
- KaTeX-based math rendering
- Presenter and viewer routes with sync-ready state handling
- Multi-tab sync through `BroadcastChannel`
- Optional cross-device sync through a WebSocket relay
- Stage drawing tools, cursor sync, quick overview, browser recording, print/PDF export

## Status

The project is under active development. Core features (MDX authoring, layouts, reveal flow, presenter sync, export) are functional and tested. The addon and theme plugin APIs are still evolving and may change.

## Monorepo Structure

This is a pnpm workspace monorepo with the following packages:

| Package                     | Path                   | Description                                                    |
| --------------------------- | ---------------------- | -------------------------------------------------------------- |
| `create-slidev-react`       | `packages/create-app`  | Starter app scaffolding and recommended first-run entry        |
| `@slidev-react/core`        | `packages/core`        | Pure presentation models, flow logic, and shared contracts     |
| `@slidev-react/client`      | `packages/client`      | React app assembly, providers, presentation UI, themes, addons |
| `@slidev-react/node`        | `packages/node`        | Node-side dev/build/export/lint entry points and servers       |
| `@slidev-react/cli`         | `packages/cli`         | Low-level command runner used by generated app scripts         |
| `@slidev-react/theme-absolutely` | `packages/theme-absolutely` | The "absolutely" theme package                           |
| `@slidev-react/theme-paper` | `packages/theme-paper` | The "paper" theme package                                      |

The root `package.json` is `private: true` and wires the Vite dev server and top-level scripts. Publishable packages under `packages/` are released via [Changesets](https://github.com/changesets/changesets).

## Quick Start

### Requirements

- Node.js `>=22`
- pnpm `10`

### Create a deck

```bash
npm create slidev-react@latest my-deck
cd my-deck
pnpm install
pnpm dev
```

Open the viewer at `http://localhost:5173/1` or the presenter at `http://localhost:5173/presenter/1`.

The generated app includes:

- `slides.mdx` with a minimal starter deck
- built-in `moonlit` theme
- built-in `g2 + mermaid` examples
- `pnpm dev`, `pnpm build`, `pnpm export`, and `pnpm lint` scripts

### Develop this repository

If you are contributing to the monorepo itself instead of creating a deck app:

```bash
pnpm install
pnpm dev
```

## Scripts

| Command                    | Description                                             |
| -------------------------- | ------------------------------------------------------- |
| `pnpm dev`                 | Start the Vite development server                       |
| `pnpm build`               | Build production assets                                 |
| `pnpm preview`             | Preview the production build                            |
| `pnpm clean`               | Remove `dist/`, `.generated/`, and `output/`            |
| `pnpm presentation:server` | Start the WebSocket relay for cross-device sync         |
| `pnpm test`                | Run the Vitest suite                                    |
| `pnpm test:e2e`            | Run the Playwright end-to-end suite                     |
| `pnpm test:e2e:headed`     | Run Playwright with a visible browser                   |
| `pnpm test:e2e:install`    | Install the Chromium browser for Playwright             |
| `pnpm lint`                | Run type-aware Oxlint                                   |
| `pnpm lint:slides`         | Lint slides authoring (unknown themes, addons, layouts) |
| `pnpm format`              | Format the repository with Oxfmt                        |
| `pnpm format:check`        | Check formatting with Oxfmt                             |

Use `pnpm lint:slides -- --strict` to fail on warnings in CI.

### Slides Export

Export slides as PDF or PNG artifacts via Playwright:

```bash
pnpm export:slides              # PDF + PNG
pnpm export:slides:pdf           # PDF only
pnpm export:slides:png           # PNG only
pnpm export:slides -- --slides 3-7
pnpm export:slides -- --with-clicks
pnpm export:slides -- --base-url http://127.0.0.1:4173
```

Output goes to `output/export/<slides-name>/`. You can also use the `Print / PDF` button in the presenter shell, or visit any slides URL with `?export=print`.

## Presentation Mode

Start the app with `pnpm dev`, then optionally start the relay server for cross-device sync:

```bash
pnpm presentation:server
```

Default relay endpoint: `ws://localhost:4860/ws`

Routes:

- Presenter: `http://localhost:5173/presenter/1`
- Viewer: `http://localhost:5173/1`

The presenter shell includes:

- presenter / viewer roles with page, reveal-state, cursor, and drawing sync
- browser recording via `MediaRecorder`
- print-ready slides export
- quick overview and presenter-side controls
- wake lock, mirror-stage launch, fullscreen toggle, stage scale, and idle-cursor settings

## Slides Authoring

The slides source lives in [`slides.mdx`](./slides.mdx).

Core authoring rules:

- Use `---` to split slides
- Use frontmatter for slides-level or slide-level metadata
- Use MDX for slide content
- Use repo-provided React components directly in MDX

### Frontmatter Reference

**Slides-level** (first slide block):

| Field            | Description                                                  |
| ---------------- | ------------------------------------------------------------ |
| `title`          | Presentation title                                           |
| `theme`          | Theme id (e.g. `paper`); falls back to `default`             |
| `addons`         | List of addon ids to enable (e.g. `[mermaid, g2, insight]`)  |
| `layout`         | Default layout for all slides                                |
| `background`     | Default background (color, gradient, or image URL)           |
| `transition`     | Default transition: `fade`, `slide-left`, `slide-up`, `zoom` |
| `exportFilename` | Base name for export files and recording downloads           |

**Slide-level**:

| Field        | Description                                                       |
| ------------ | ----------------------------------------------------------------- |
| `title`      | Slide title                                                       |
| `layout`     | Layout override for this slide                                    |
| `class`      | CSS class applied to the stage article element                    |
| `background` | Colors, gradients, CSS background values, or bare image URLs      |
| `transition` | Per-slide transition override                                     |
| `clicks`     | Explicit reveal steps (even when fewer `<Reveal />` blocks exist) |
| `notes`      | Presenter notes (YAML block strings work best)                    |
| `src`        | Load slide body from an external file relative to `slides.mdx`    |

Invalid frontmatter reports field-level parser errors, and compile-time generation warns for unknown themes or addons.

### Example

```mdx
---
title: Demo Slides
theme: paper
addons:
  - mermaid
  - g2
  - insight
layout: default
background: "linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)"
transition: fade
exportFilename: client-demo
---

---

title: Compare
layout: two-cols
class: px-20
background: /images/compare-hero.png
transition: slide-left
clicks: 3
src: ./slides/compare.mdx
notes: |
Open with the tradeoff, not the implementation.
Pause after the chart before moving to the API boundary.

---

# Left column

<hr />

# Right column

<Reveal step={1}>
  <Callout title="Tip">This block appears on click.</Callout>
</Reveal>
```

When `src:` is present, put the slide body in the external file — do not mix inline content in the same block.

## Themes

Set the theme in slides-level frontmatter:

```mdx
---
title: Client Review
theme: moonlit
---
```

Themes can come from two places:

- built-in themes shipped by `@slidev-react/client`, such as **moonlit**
- external theme packages such as `@slidev-react/theme-paper` and `@slidev-react/theme-absolutely`

A theme package exports a `SlideThemeDefinition` from its entry point, with support for:

- `tokens` — the single source of truth for theme fonts, UI colors, chart colors, diagram colors, and addon colors
- `rootAttributes` and `rootClassName` — document-level tokens or selectors
- `layouts` — override or extend slide layouts
- `mdxComponents` — override MDX helpers such as `Badge`
- `provider` — theme-scoped React context when needed

Built-in theme CSS files are auto-loaded in the same way as external theme CSS. CSS custom properties are derived from `tokens` at runtime, so CSS is a consumer of theme tokens rather than the source of truth. If a requested theme is missing, the runtime falls back to the default theme.

## Addons

Slides can opt into addons with slides-level frontmatter:

```mdx
---
addons:
  - mermaid
  - g2
  - insight
---
```

Addons live under `packages/client/src/addons/<addon-id>/` and are discovered automatically when they export `addon` from `index.ts`.

### Available Addons

| Addon     | Components                    | Description                            |
| --------- | ----------------------------- | -------------------------------------- |
| `mermaid` | `MermaidDiagram`              | Mermaid diagram rendering              |
| `g2`      | `Chart`                       | G2 data visualization charts           |
| `insight` | `Insight`, `spotlight` layout | Insight component and spotlight layout |

### Addon Contract

- `layouts` — add or override layout names
- `mdxComponents` — add slides-local MDX helpers
- `provider` — wrap the runtime tree with addon-specific React context or side effects

Addon CSS files at `packages/client/src/addons/<addon-id>/style.css` are auto-loaded. Unknown addon ids are ignored, keeping slides startup safe while the addon API is experimental.

### Example

```mdx
---
title: Executive Summary
addons:
  - insight
layout: spotlight
---

# Three signals to act on now

<Insight title="Board angle">
  The margin story lands better when paired with hiring discipline.
</Insight>
```

## MDX Helpers

### Core (always available)

| Component                | Description                                                           |
| ------------------------ | --------------------------------------------------------------------- |
| `Badge`                  | Inline badge labels                                                   |
| `Callout`                | Callout blocks with titles                                            |
| `Annotate`               | Rough-notation style annotations (highlight, underline, box, bracket) |
| `CourseCover`            | Course cover page helper                                              |
| `MagicMoveDemo`          | Shiki Magic Move code animations                                      |
| `MinimaxReactVisualizer` | Minimax tree visualizer                                               |
| `Reveal`                 | Step-based reveal for click-triggered content                         |
| `RevealGroup`            | Auto-numbered reveal container                                        |

### Via Addons

| Component        | Addon     | Description      |
| ---------------- | --------- | ---------------- |
| `MermaidDiagram` | `mermaid` | Mermaid diagrams |
| `Chart`          | `g2`      | G2 data charts   |
| `Insight`        | `insight` | Insight blocks   |

`Annotate` example:

```mdx
<Annotate>Default highlight</Annotate>
<Annotate type="underline">Key idea</Annotate>
<Annotate type="box" color="#2563eb">
  API boundary
</Annotate>
<Annotate type="bracket" brackets={["left", "right"]}>
  Focus block
</Annotate>
```

## Project Structure

```
packages/
  create-app/   → create-slidev-react     — starter app scaffolding
  core/         → @slidev-react/core     — models, flow, shared contracts
  client/       → @slidev-react/client   — React app, UI, themes, addons
    src/
      addons/   — addon definitions (mermaid, g2, insight)
      app/      — application assembly, providers, entry wiring
      features/ — presentation capabilities (reveal, presenter, sync, draw, navigation)
      theme/    — theme registry, layouts, visual tokens
      ui/       — reusable components and MDX helpers
  node/         → @slidev-react/node     — dev/build/export/lint
  cli/          → @slidev-react/cli      — low-level command runner
  theme-absolutely/ → @slidev-react/theme-absolutely — "absolutely" theme
  theme-paper/  → @slidev-react/theme-paper — "paper" theme
```

For per-package details, see [`packages/client/README.md`](./packages/client/README.md) and [`packages/node/README.md`](./packages/node/README.md).

## Build Artifact Management

Build output is disposable and should not be committed:

- `dist/` — production builds
- `.generated/` — compile-time slides output
- `output/` — runtime generated output (exports, recordings)

Run `pnpm clean` to remove all generated files.

## Testing

```bash
pnpm test        # Vitest unit/integration tests
pnpm test:e2e    # Playwright end-to-end tests
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Changelog

See [CHANGELOG](./CHANGELOG.md) for a detailed list of changes.

## Acknowledgements

This project is inspired by [Slidev](https://github.com/slidevjs/slidev). Some early slides content was migrated from the Slidev starter deck while adapting the authoring model to this React + MDX runtime.

## License

[MIT](./LICENSE)
