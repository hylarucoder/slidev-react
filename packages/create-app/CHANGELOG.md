# create-slidev-react

## 0.5.0

### Minor Changes

- One-command zero-install startup (Slidev-style).
  - `slidev-react` CLI now defaults to `dev` when no subcommand is given and accepts a top-level `[file]` positional, so `slidev-react` / `slidev-react slides.mdx` are equivalent to `slidev-react dev [slides.mdx]`.
  - `dev` auto-scaffolds a minimal `slides.mdx` when none exists in the cwd and no file was explicitly requested. A `--no-scaffold` flag is available to opt out (useful in CI).
  - `create-slidev-react` scaffold no longer emits `vite.config.mts`; generated scripts now call the CLI directly (`slidev-react dev|build|export|lint --strict`) and the dependency list is limited to `@slidev-react/cli`, `react`, `react-dom`, `@mdx-js/react`.
  - `@slidev-react/node` exports a shared `DEMO_SLIDES_MDX` template, adds a `preflightSlidesSource` helper, and extends `parseDevArgs` with `--no-scaffold`.
