# slidev-react

[![Version](https://img.shields.io/npm/v/@slidev-react/core)](https://npmjs.com/package/@slidev-react/core)
[![CI](https://github.com/hylarucoder/slidev-react/actions/workflows/ci.yml/badge.svg)](https://github.com/hylarucoder/slidev-react/actions)
[![License](https://img.shields.io/npm/l/@slidev-react/core)](LICENSE)

React-first presentation runtime with an MDX slides pipeline, presenter/viewer modes, and built-in interactive slide features.

[中文说明](./README.zh-CN.md)

https://github.com/user-attachments/assets/553392a4-36ae-4505-87c2-ca54e7e00f08

## Overview

`slidev-react` is an experimental slide system built around:

- React 19 for rendering
- MDX as the authoring format
- Vite for the app runtime
- a compile-time slides pipeline under `packages/node/src/slides`
- a presentation shell with presenter/viewer sync, reveal flow, drawings, and recording

This repo is not a Vue Slidev runtime. It is a React + MDX implementation that borrows some presentation ideas while using its own slides model and rendering pipeline.

## Highlights

- MDX-authored slides source in [`slides.mdx`](./slides.mdx)
- Compile-time parsing and slides artifact generation
- Built-in slide layouts such as `default`, `center`, `cover`, `section`, `two-cols`, `image-right`, and `statement`
- React-native MDX helpers including `Badge`, `Callout`, `AnnotationMark`, `Reveal`, and `RevealGroup`
- Diagram fences for Mermaid and PlantUML
- KaTeX-based math rendering
- Presenter and viewer routes with sync-ready state handling
- Multi-tab sync through `BroadcastChannel`
- Optional cross-device sync through a WebSocket relay
- Stage drawing tools, cursor sync, quick overview, browser recording, print/PDF export
- PDF export via `Print / PDF` button, `?export=print` URL param, or Playwright-driven `pnpm export:slides:pdf`

## Status

The project is currently an MVP / playground. APIs, authoring conventions, and slides capabilities may still change.

## Release Positioning

This repository is an open-source application/runtime repo, not an npm package. Keep `"private": true` in `package.json` to prevent accidental publication, and treat source checkout as the supported way to use or extend the project.

## Quick Start

### Requirements

- Node.js `>=22`
- pnpm `10`

### Install

```bash
pnpm install
```

### Start development

```bash
pnpm dev
```

### Build production assets

```bash
pnpm build
```

### Preview the build

```bash
pnpm preview
```

### Export slides artifacts with Playwright

```bash
pnpm export:slides
```

### Lint slides authoring

```bash
pnpm lint:slides
```

Use `pnpm lint:slides -- --strict` to fail on warnings in CI.

This writes browser-rendered artifacts to `output/export/<slides-name>/`:

- `*.pdf` for the whole slides document
- `png/*.png` for one image per slide

Useful variants:

```bash
pnpm export:slides:pdf
pnpm export:slides:png
pnpm export:slides -- --slides 3-7
pnpm export:slides -- --with-clicks
pnpm export:slides -- --base-url http://127.0.0.1:4173
```

### Clean generated output

```bash
pnpm clean
```

## Presentation Mode

Start the app first:

```bash
pnpm dev
```

Optional: start the relay server for cross-device sync:

```bash
pnpm presentation:server
```

Default relay endpoint: `ws://localhost:4860/ws`

Routes:

- Presenter: `http://localhost:5173/presenter/1`
- Viewer: `http://localhost:5173/1`

The presenter shell currently includes:

- presenter / viewer roles
- page sync
- reveal-state sync
- cursor sync
- drawing sync
- browser recording via `MediaRecorder`
- print-ready slides export via browser Print / Save as PDF
- quick overview and presenter-side controls
- wake lock, mirror-stage launch, fullscreen toggle, stage scale, and idle-cursor settings in presenter mode
- `pnpm lint:slides` for authoring warnings such as unknown themes, addons, or layouts

## Slides Authoring

The slides source lives in [`slides.mdx`](./slides.mdx).

Core authoring rules:

- Use `---` to split slides
- Use frontmatter for slides-level or slide-level metadata
- Use MDX for slide content
- Use repo-provided React components directly in MDX

Supported frontmatter today:

- Slides: `title`, `theme`, `addons`, `layout`, `background`, `transition`, `exportFilename`
- Slide: `title`, `layout`, `class`, `background`, `transition`, `clicks`, `notes`, `src`

Notes:

- `layout:` is active and affects rendering
- `class:` is applied to the stage article element
- `background:` accepts colors, gradients, CSS background values, or bare image URLs
- `transition:` supports `fade`, `slide-left`, `slide-up`, and `zoom`
- `exportFilename:` sets the preferred base name for slides exports and recording downloads
- `addons:` enables locally registered addons from `src/addons/*/index.ts`
- `clicks:` defines explicit reveal steps even when the slide has fewer `<Reveal />` blocks
- `notes:` is available in presenter mode and works best with YAML block strings
- `src:` loads a single external slide file relative to `slides.mdx`
- `theme:` loads a local runtime theme from `packages/client/src/theme/themes/*/index.ts`, with the default theme as fallback
- invalid frontmatter now reports field-level parser errors, and compile-time generation warns for unknown local themes or addons

Example:

```mdx
---
title: Demo Slides
theme: paper
addons:
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

Recommended `src` syntax:

```mdx
---
title: Imported Slide
layout: cover
src: ./slides/imported-intro.mdx
notes: |
  Keep the wrapper metadata here.
  Put the slide body in the external file.
---
```

When `src:` is present, do not also put inline slide body content in the same slide block.

To export slides as PDF today, open the presenter shell and use the `Print / PDF` button, visit the current slides URL with `?export=print`, or run `pnpm export:slides` for Playwright-driven PDF and PNG artifacts.

## Local Themes

The built-in non-default example theme is `paper`:

```mdx
---
title: Client Review
theme: paper
---
```

Local themes live under `packages/client/src/theme/themes/<theme-id>/` and are discovered automatically when they export `theme` from `index.ts`.

Current theme contract:

- `rootAttributes` and `rootClassName` for document-level tokens or selectors
- `layouts` to override or extend slide layouts
- `mdxComponents` to override MDX helpers such as `Badge`
- `provider` for theme-scoped React context when needed

Theme CSS files placed at `packages/client/src/theme/themes/<theme-id>/style.css` are also auto-loaded. If a requested theme is missing, the runtime falls back to the default theme.

## Local Addons

Slides can opt into local addons with slides frontmatter:

```mdx
---
title: QBR Review
addons:
  - insight
---
```

Local addons live under `src/addons/<addon-id>/` and are discovered automatically when they export `addon` from `index.ts`.

Current addon contract:

- `layouts` to add or override layout names, including custom ones such as `spotlight`
- `mdxComponents` to add slides-local helpers such as `Insight`
- `provider` to wrap the runtime tree with addon-specific React context or side effects

The built-in example addon is `insight`, which contributes a `spotlight` layout and an `Insight` MDX component:

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

Addon CSS files placed at `src/addons/<addon-id>/style.css` are also auto-loaded. Unknown addon ids are ignored for now, which keeps slides startup safe while the addon API is still experimental.

## MDX Helpers

Common helpers exposed to MDX include:

- `Badge`
- `Callout`
- `AnnotationMark`
- `CourseCover`
- `MagicMoveDemo`
- `MinimaxReactVisualizer`
- `Reveal`
- `RevealGroup`
- `MermaidDiagram`
- `PlantUmlDiagram`

`AnnotationMark` example:

```mdx
<AnnotationMark>Default highlight</AnnotationMark>
<AnnotationMark type="underline">Key idea</AnnotationMark>
<AnnotationMark type="box" color="#2563eb">
  API boundary
</AnnotationMark>
<AnnotationMark type="bracket" brackets={["left", "right"]}>
  Focus block
</AnnotationMark>
```

## Project Structure

Top-level source areas under [`src/`](./src):

- `app/`: application assembly, providers, entry wiring
- `slides/`: slides parsing, frontmatter handling, MDX compilation, generated artifacts
- `features/`: presentation capabilities such as reveal, presenter shell, sync, draw, and navigation
- `features/presentation/stage/`: stage rendering and stage interaction
- `addons/`: local runtime extension points for layouts, MDX helpers, and providers
- `ui/`: reusable presentation components and MDX helpers
- `theme/`: layouts and visual tokens

For more internal structure guidance, see [`packages/client/README.md`](./packages/client/README.md) and [`packages/node/README.md`](./packages/node/README.md).

## Scripts

- `pnpm clean`: remove generated output such as `dist/`, `.generated/`, and `output/`
- `pnpm dev`: start the development server
- `pnpm build`: build the app
- `pnpm preview`: preview the production build
- `pnpm presentation:server`: start the WebSocket relay server
- `pnpm test`: run the Vitest suite
- `pnpm test:e2e`: run the Playwright end-to-end suite
- `pnpm test:e2e:headed`: run the Playwright suite with a visible browser
- `pnpm test:e2e:install`: install the Chromium browser used by Playwright
- `pnpm lint`: run type-aware Oxlint on `src/` and `packages/`
- `pnpm format`: format the repository with Oxfmt
- `pnpm format:check`: check repository formatting with Oxfmt

## Build Artifact Management

Build output is disposable and should not be committed. In this repository:

- `dist/` is generated by production builds
- `.generated/` is compile-time slides output
- `output/` is treated as generated runtime output

Before opening a PR, remove generated files with `pnpm clean` if they are unrelated to the change.

## Testing

Run the test suite with:

```bash
pnpm test
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Changelog

See [CHANGELOG](./CHANGELOG.md) for a detailed list of changes.

## Acknowledgements

This project is inspired by [Slidev](https://github.com/slidevjs/slidev), and some early slides content was migrated from the Slidev starter deck while adapting the authoring model to this React + MDX runtime.

## License

[MIT](./LICENSE)
