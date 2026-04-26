# @slidev-react/client

## 0.5.0

### Minor Changes

- One-command zero-install startup (Slidev-style).
  - `slidev-react` CLI now defaults to `dev` when no subcommand is given and accepts a top-level `[file]` positional, so `slidev-react` / `slidev-react slides.mdx` are equivalent to `slidev-react dev [slides.mdx]`.
  - `dev` auto-scaffolds a minimal `slides.mdx` when none exists in the cwd and no file was explicitly requested. A `--no-scaffold` flag is available to opt out (useful in CI).
  - `create-slidev-react` scaffold no longer emits `vite.config.mts`; generated scripts now call the CLI directly (`slidev-react dev|build|export|lint --strict`) and the dependency list is limited to `@slidev-react/cli`, `react`, `react-dom`, `@mdx-js/react`.
  - `@slidev-react/node` exports a shared `DEMO_SLIDES_MDX` template, adds a `preflightSlidesSource` helper, and extends `parseDevArgs` with `--no-scaffold`.

### Patch Changes

- Updated dependencies
  - @slidev-react/core@0.5.0

## 0.2.9

### Patch Changes

- Release 0.3.0
- Updated dependencies
  - @slidev-react/core@0.2.9

## 0.2.0

### Minor Changes

- ## v0.2.0

  ### Features
  - Add React Compiler support for automatic render optimization
  - Add code splitting for better bundle optimization

  ### Bug Fixes
  - Fix Mermaid diagram type errors

### Patch Changes

- Updated dependencies
  - @slidev-react/core@0.2.0

## 0.1.0

### Minor Changes

- ## v0.1.0

  ### Features
  - Add React Compiler support for automatic render optimization
  - Add code splitting for better bundle optimization

  ### Bug Fixes
  - Fix Mermaid diagram type errors

### Patch Changes

- Updated dependencies [ca342f8]
- Updated dependencies
  - @slidev-react/core@0.1.0
