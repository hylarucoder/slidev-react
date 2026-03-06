# Repository Guidelines

## Project Structure & Module Organization

The app root is the repository root. Main source code lives in `src/`, organized by responsibility rather than framework layer:

- `src/app/`: app assembly, providers, and entry wiring
- `src/deck/`: deck parsing, frontmatter handling, MDX compilation, and generated deck artifacts
- `src/features/`: product features such as presenter mode, reveal flow, sync, draw, and navigation
- `src/features/player/`: slide stage rendering and interaction
- `src/ui/`: reusable UI and MDX helper components
- `src/theme/`: layouts and visual tokens

Deck content is authored in `slides.mdx`. Tests live next to source as `*.test.ts`.

## Build, Test, and Development Commands

- `bun install`: install dependencies
- `bun run dev`: start the Rsbuild dev server
- `bun run build`: produce a production build
- `bun run preview`: preview the built app locally
- `bun run presentation:server`: start the WebSocket relay for cross-device sync
- `bun run test`: run the Vitest suite once
- `bun run lint`: lint `src/` with Oxlint

Use Bun for all local commands; `packageManager` is pinned to `bun@1.3.3`.

## Coding Style & Naming Conventions

Use TypeScript and React function components. Follow the existing style:

- 2-space indentation
- single quotes
- no semicolons
- named exports for shared utilities; default exports only where already established

Name components in PascalCase (`PresenterShell.tsx`), helpers in camelCase (`parseDeck.ts`), and tests as `featureName.test.ts`. Keep new files in the domain folder that owns the behavior; avoid catch-all `utils.ts` or `types.ts`.

## Testing Guidelines

Vitest is the test runner. Add or update tests when changing parsing, compilation, reveal navigation, or presentation session behavior. Prefer colocated tests such as `src/deck/parsing/parseDeck.test.ts`. Run `bun run test` before opening a PR.

## Commit & Pull Request Guidelines

This repository currently has no commit history, so no project-specific convention is established yet. Use short, imperative commit messages such as `Add reveal sync regression test`. Keep PRs focused and include:

- a brief summary of the change
- affected areas (for example `src/deck` or `slides.mdx`)
- test results
- screenshots or short recordings for UI or presentation-flow changes

## Contributor Notes

Document only behavior that exists today. If you mention deck syntax in docs, verify it against `slides.mdx`, `src/deck/`, and the current runtime rather than legacy Slidev behavior.
