# Repository Guidelines

1. 尽量用中文回复
2. 如果没有显式要求, 尽量不要写兼容代码.

## Project Structure & Module Organization

The app root is the repository root. Main source code lives under `packages/`:

- `packages/node/src/slides/`: slides parsing, frontmatter handling, MDX compilation, validation, and generated slides artifacts
- `packages/client/src/`: React app assembly, providers, presentation UI, stage, theme, addons, and reusable UI
- `packages/core/src/`: pure presentation models, flow logic, and shared contracts
- `packages/node/src/`: Node-side dev/build/export/lint entry points and local servers
- `packages/cli/`: the `slidev-react` command-line interface

Deck content is authored in `slides.mdx`. Tests live in `__tests__/` directories next to the source they cover.

## Build, Test, and Development Commands

- `pnpm install`: install dependencies
- `pnpm dev`: start the Vite dev server
- `pnpm build`: produce a production build
- `pnpm preview`: preview the built app locally
- `pnpm presentation:server`: start the WebSocket relay for cross-device sync
- `pnpm test`: run the Vitest suite once
- `pnpm test:e2e`: run the Playwright end-to-end suite
- `pnpm test:e2e:headed`: run the Playwright suite with a visible browser
- `pnpm test:e2e:install`: install the Chromium browser used by Playwright
- `pnpm lint`: run type-aware Oxlint on `src/` and `packages/`
- `pnpm format`: format the repository with Oxfmt
- `pnpm format:check`: check repository formatting with Oxfmt

Use pnpm for all local commands; `packageManager` is pinned to `pnpm@10.0.0`.

## Coding Style & Naming Conventions

Use TypeScript and React function components. Follow the existing style:

- 2-space indentation
- single quotes
- no semicolons
- named exports for shared utilities; default exports only where already established

Name components in PascalCase (`PresenterShell.tsx`), helpers in camelCase (`parseDeck.ts`), and tests as `featureName.test.ts`. Keep new files in the domain folder that owns the behavior; avoid catch-all `utils.ts` or `types.ts`.

## Testing Guidelines

Vitest is the test runner. Add or update tests when changing parsing, compilation, reveal navigation, or presentation session behavior. Place tests in a `__tests__/` directory adjacent to the source, such as `packages/node/src/slides/parsing/__tests__/parseSlides.test.ts`. Name browser-level component tests as `*.browser.test.tsx` — they run in headless Chromium via Vitest browser mode. Run `pnpm test` before opening a PR.

## Commit & Pull Request Guidelines

This repository currently has no commit history, so no project-specific convention is established yet. Use short, imperative commit messages such as `Add reveal sync regression test`. Keep PRs focused and include:

- a brief summary of the change
- affected areas (for example `packages/node/src/slides` or `slides.mdx`)
- test results
- screenshots or short recordings for UI or presentation-flow changes

## Contributor Notes

Document only behavior that exists today. If you mention deck syntax in docs, verify it against `slides.mdx`, `packages/node/src/slides/`, and the current runtime rather than legacy Slidev behavior.

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, but it invokes Vite through `vp dev` and `vp build`.

## Vite+ Workflow

`vp` is a global binary that handles the full development lifecycle. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

### Start

- create - Create a new project from a template
- migrate - Migrate an existing project to Vite+
- config - Configure hooks and agent integration
- staged - Run linters on staged files
- install (`i`) - Install dependencies
- env - Manage Node.js versions

### Develop

- dev - Run the development server
- check - Run format, lint, and TypeScript type checks
- lint - Lint code
- fmt - Format code
- test - Run tests

### Execute

- run - Run monorepo tasks
- exec - Execute a command from local `node_modules/.bin`
- dlx - Execute a package binary without installing it as a dependency
- cache - Manage the task cache

### Build

- build - Build for production
- pack - Build libraries
- preview - Preview production build

### Manage Dependencies

Vite+ automatically detects and wraps the underlying package manager such as pnpm, npm, or Yarn through the `packageManager` field in `package.json` or package manager-specific lockfiles.

- add - Add packages to dependencies
- remove (`rm`, `un`, `uninstall`) - Remove packages from dependencies
- update (`up`) - Update packages to latest versions
- dedupe - Deduplicate dependencies
- outdated - Check for outdated packages
- list (`ls`) - List installed packages
- why (`explain`) - Show why a package is installed
- info (`view`, `show`) - View package information from the registry
- link (`ln`) / unlink - Manage local package links
- pm - Forward a command to the package manager

### Maintain

- upgrade - Update `vp` itself to the latest version

These commands map to their corresponding tools. For example, `vp dev --port 3000` runs Vite's dev server and works the same as Vite. `vp test` runs JavaScript tests through the bundled Vitest. The version of all tools can be checked using `vp --version`. This is useful when researching documentation, features, and bugs.

## Common Pitfalls

- **Using the package manager directly:** Do not use pnpm, npm, or Yarn directly. Vite+ can handle all package manager operations.
- **Always use Vite commands to run tools:** Don't attempt to run `vp vitest` or `vp oxlint`. They do not exist. Use `vp test` and `vp lint` instead.
- **Running scripts:** Vite+ commands take precedence over `package.json` scripts. If there is a `test` script defined in `scripts` that conflicts with the built-in `vp test` command, run it using `vp run test`.
- **Do not install Vitest, Oxlint, Oxfmt, or tsdown directly:** Vite+ wraps these tools. They must not be installed directly. You cannot upgrade these tools by installing their latest versions. Always use Vite+ commands.
- **Use Vite+ wrappers for one-off binaries:** Use `vp dlx` instead of package-manager-specific `dlx`/`npx` commands.
- **Import JavaScript modules from `vite-plus`:** Instead of importing from `vite` or `vitest`, all modules should be imported from the project's `vite-plus` dependency. For example, `import { defineConfig } from 'vite-plus';` or `import { expect, test, vi } from 'vite-plus/test';`. You must not install `vitest` to import test utilities.
- **Type-Aware Linting:** There is no need to install `oxlint-tsgolint`, `vp lint --type-aware` works out of the box.

## Review Checklist for Agents

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to validate changes.
<!--VITE PLUS END-->
