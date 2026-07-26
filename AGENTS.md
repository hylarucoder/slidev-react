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

Name components in PascalCase (`PresentationRoot.tsx`), helpers in camelCase (`parseDeck.ts`), and tests as `featureName.test.ts`. Keep new files in the domain folder that owns the behavior; avoid catch-all `utils.ts` or `types.ts`.

### Hook Conventions

Custom React hooks follow three suffixes based on what they own:

- `useXxxRuntime` — composes state + side effects (subscriptions, timers, localStorage, network). Examples: `usePresenterFlowRuntime`, `usePresentationSyncRuntime`, `useRecorderRuntime`.
- `useXxxState` — returns value + setter with no side effects. The reducer hook is a common host.
- `useXxxSelector` — read-only derivation from a source of truth (context, store, another hook).

React-idiomatic DOM wrappers (`useFullscreen`, `useWakeLock`, `useFocusTrap`, `useIdleCursor`) and trivial context consumers (`useDraw`, `useSlideTheme`, `useReveal`) keep their conventional names and are exempt from the suffix rule.

## Testing Guidelines

Vitest is the test runner. Add or update tests when changing parsing, compilation, reveal navigation, or presentation session behavior. Place tests in a `__tests__/` directory adjacent to the source, such as `packages/node/src/slides/parsing/__tests__/parseSlides.test.ts`. Name browser-level component tests as `*.browser.test.tsx` — they run in headless Chromium via Vitest browser mode. Run `pnpm test` before opening a PR.

## Commit & Pull Request Guidelines

This repository currently has no commit history, so no project-specific convention is established yet. Use short, imperative commit messages such as `Add reveal sync regression test`. Keep PRs focused and include:

- a brief summary of the change
- affected areas (for example `packages/node/src/slides` or `slides.mdx`)
- test results
- screenshots or short recordings for UI or presentation-flow changes

## Release & Publishing

根目录 `package.json` 已设置 `"private": true`，不会被误发到 npm。实际发布的是 `@slidev-react/*` 子包。

### 升级版本

使用 `tsx` 运行 `scripts/bump-version.ts`，统一升级可发布子包的版本号：

```bash
pnpm exec tsx ./scripts/bump-version.ts          # patch: 0.2.8 → 0.2.9
pnpm exec tsx ./scripts/bump-version.ts minor    # minor: 0.2.8 → 0.3.0
pnpm exec tsx ./scripts/bump-version.ts major    # major: 0.2.8 → 1.0.0
pnpm exec tsx ./scripts/bump-version.ts 1.0.0    # 指定版本
```

### 发布

```bash
npm login                    # 确保已登录 npm
pnpm run release:publish     # 构建子包并发布到 npm
```

`release:publish` 会先执行 `build:packages` 构建 `@slidev-react/core`、`@slidev-react/client`、`@slidev-react/node`、`@slidev-react/cli`，然后通过 changeset 发布。

### 完整流程

```bash
pnpm exec tsx ./scripts/bump-version.ts  # 1. 升版本
git add -A && git commit -m "chore: bump v0.2.9"  # 2. 提交
pnpm run release:publish         # 3. 构建 + 发布
git push                         # 4. 推送
```

## Contributor Notes

Document only behavior that exists today. If you mention deck syntax in docs, verify it against `slides.mdx`, `packages/node/src/slides/`, and the current runtime rather than legacy Slidev behavior.

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->
