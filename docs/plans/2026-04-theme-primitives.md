# 主题共享原语 & Paper 补齐计划

> 起草日期：2026-04-24
> 范围：`packages/client/src/theme/shared/`（新）· Moonlit / Absolutely 去重 · `packages/theme-paper/` 补齐组件与 layouts
> 目标：三个主题共享同一套 MDX 组件（Badge / Callout / Eyebrow / KeyStat / PullQuote），CSS 里用 `[data-slide-theme="X"] .slide-*` 做视觉差异；Paper 由此自动获得组件覆盖率。
> 阅读方式：§1 背景 → §4 Phase 1-5 执行。

---

## 1. 背景

### 1.1 现状

三个主题的 MDX 组件覆盖严重不对称：

|                                                 | Moonlit | Absolutely | Paper   |
| ----------------------------------------------- | ------- | ---------- | ------- |
| Badge / Callout / Eyebrow / KeyStat / PullQuote | 5/5     | 5/5        | **1/5** |
| CoverLayout                                     | ✅      | ✅         | ✅      |
| SectionLayout                                   | ✅      | ✅         | ❌      |
| StatementLayout                                 | ✅      | ✅         | ❌      |
| ChapterLayout                                   | ✅      | ❌         | ❌      |

- **Moonlit 和 Absolutely 的 5 个组件是近乎复制粘贴**。`diff packages/client/src/theme/builtin/moonlit/components/Callout.tsx packages/theme-absolutely/components/Callout.tsx` 只有类名前缀和导出名不同。
- **Paper 只有 `PaperBadge` + `PaperCoverLayout`**。切到 `theme: paper` 时，`<Callout>` 等组件会退回默认 MDX 渲染，`layout: section / statement` 会触发 `Unknown layout` warning。
- **layouts 结构 per-theme 差异大**：Moonlit 的 Cover 有 heading-row、aside icon-box、dot+rule 一堆装饰元素；Absolutely 的 Cover 就一个简单 shell。所以 **layouts 不适合完全共享**——但要能提供一个 "plain" 的 fallback 版给 Paper / 新主题用。

### 1.2 目标

1. 5 个 MDX 组件在 `packages/client/src/theme/shared/` 下**单一实现**，三个主题直接引用，类名统一用 `slide-*`。
2. 4 个 layouts（Cover / Section / Statement / Chapter）提供**"plain" 基础版本**给 Paper 用；Moonlit 和 Absolutely 保留自己的装饰版。
3. Paper 不再缺 Callout/Eyebrow/KeyStat/PullQuote，`layoutIds` 至少覆盖 cover/section/statement。
4. CSS 保留各主题视觉，改用 `[data-slide-theme="X"] .slide-callout {...}` 做主题化。

### 1.3 非目标

- 不改组件的对外 API（`<Callout type="info" title="..." />` 一字不动）。
- 不做 `extends: "moonlit"` 式的主题继承（Plan 里最早的 C 方案，成本太大）。
- 不动 addons（mermaid / g2 / insight）。
- 不修 layouts 的 JSX 结构（只让 Paper 选择最简单的那版）。

---

## 2. 关键设计决策

### 2.1 类名约定

所有共享组件用 `slide-*` 前缀（和现有 `slide-layout-*`、`slide-prose` 一致）：

- `slide-badge`
- `slide-eyebrow` / `slide-eyebrow::before`
- `slide-callout`、`slide-callout--info / --warn / --success`、`slide-callout-title`、`slide-callout-body`
- `slide-key-stat`、`slide-key-stat-value / -copy / -label / -detail`
- `slide-pull-quote`、`slide-pull-quote-body / -meta / -by / -extra`

各主题 CSS 的选择器 `.moonlit-badge → .slide-badge`、`.absolutely-callout → .slide-callout`，保留 `[data-slide-theme="..."]` 父选择器防止主题间串样式。

### 2.2 共享 layouts 策略

在 `packages/client/src/theme/shared/layouts/` 提供 4 个 "plain" 版本：

- `PlainCoverLayout` / `PlainSectionLayout` / `PlainStatementLayout` / `PlainChapterLayout`
- JSX 结构最简：`<section className="slide-layout-X"><div className="slide-X-shell">{children}</div></section>`。
- 类名 `slide-X-shell` 供主题 CSS 定制。

Moonlit 和 Absolutely 的装饰版 layouts **保留原样**（它们依赖 `moonlit-cover-aside` 之类的额外 DOM）。Paper 直接用 plain 版。

### 2.3 Client 包 exports

新增子路径 `./theme-shared`，暴露：

```json
"./theme-shared": {
  "types": "./dist/src/theme/shared/index.d.ts",
  "import": "./dist/theme-shared.js",
  "default": "./dist/theme-shared.js"
}
```

themes 用 `import { SlideCallout, PlainSectionLayout } from "@slidev-react/client/theme-shared";`。

### 2.4 Peer deps

`packages/theme-absolutely/package.json` 和 `packages/theme-paper/package.json` 加 `@slidev-react/client: workspace:^` 作为 peer。发布时 changesets 会改写成实际 semver。

---

## 3. 不做的事

- 不改 Moonlit / Absolutely 的 layouts DOM 结构。
- 不挪 `SlideErrorBoundary` / `useResolvedLayout` 等运行时工具。
- 不改 `defineTheme` 契约。
- 本轮 Chapter layout 只有 Moonlit 有，Paper 暂不提供。

---

## 4. 执行 Phase

### Phase 1 — 创建 shared 组件 + layouts + client exports

**改动**

- 新建 `packages/client/src/theme/shared/components/`：`Badge.tsx` / `Callout.tsx` / `Eyebrow.tsx` / `KeyStat.tsx` / `PullQuote.tsx`。全用 `slide-*` 类名。
- 新建 `packages/client/src/theme/shared/layouts/`：`PlainCoverLayout.tsx` / `PlainSectionLayout.tsx` / `PlainStatementLayout.tsx` / `PlainChapterLayout.tsx`。
- 新建 `packages/client/src/theme/shared/index.ts` 聚合导出。
- `packages/client/tsdown.config.ts` 加 entry `theme-shared: "src/theme/shared/index.ts"`。
- `packages/client/package.json` 加 `./theme-shared` 导出。

**验收**

- `pnpm -F @slidev-react/client build:pkg` 成功；`dist/theme-shared.js` 存在。
- 新组件与旧 Moonlit 版的 JSX 输出等价（只差类名前缀）。

### Phase 2 — Moonlit 迁移到 shared

**改动**

- 删 `packages/client/src/theme/builtin/moonlit/components/{Badge,Callout,Eyebrow,KeyStat,PullQuote}.tsx`。
- `packages/client/src/theme/builtin/moonlit/index.ts` 改从 `../../shared` 导入。
- `packages/client/src/theme/builtin/moonlit/style.css`：`.moonlit-badge → .slide-badge` 等一对一替换（regex 替换所有 5 个前缀 + 修饰符）。
- ChapterLayout 暂保留，不动。

**验收**

- `pnpm test` 绿；Moonlit 主题下 UI 视觉与重构前等价（差异应为 0）。
- `grep moonlit-badge packages/client/src/theme/builtin/moonlit/style.css` 返回 0 结果。

### Phase 3 — Absolutely 迁移到 shared

**改动**

- 删 `packages/theme-absolutely/components/{Badge,Callout,Eyebrow,KeyStat,PullQuote}.tsx`。
- `packages/theme-absolutely/index.ts` 改从 `@slidev-react/client/theme-shared` 导入。
- `packages/theme-absolutely/style.css`：`.absolutely-badge → .slide-badge` 等替换。
- `packages/theme-absolutely/package.json`：`peerDependencies` 加 `"@slidev-react/client": "workspace:^"`。

**验收**

- `pnpm -F @slidev-react/theme-absolutely build:pkg` 成功。
- `pnpm test` 绿。
- 手工：把 `slides.mdx` 的 `theme: moonlit` 改成 `theme: absolutely`，UI 等价。

### Phase 4 — Paper 补齐组件 + 新增 Section/Statement layouts

**改动**

- 删 `packages/theme-paper/components/PaperBadge.tsx`（改用共享 Badge）。
- `packages/theme-paper/index.ts` 从 `@slidev-react/client/theme-shared` 导入 5 个组件 + PlainSectionLayout + PlainStatementLayout。
- `layoutIds` 扩为 `["cover", "section", "statement"]`，`layouts` 加 section / statement 映射。
- `packages/theme-paper/style.css` 新增 `[data-slide-theme="paper"] .slide-badge / .slide-callout / .slide-eyebrow / .slide-key-stat / .slide-pull-quote` 的视觉定义，以及 `.slide-section-shell / .slide-statement-shell` 的最简装饰（一条 accent rule 之类）。
- `packages/theme-paper/package.json`：peer 加 `@slidev-react/client`。

**验收**

- `pnpm -F @slidev-react/theme-paper build:pkg` 成功。
- 手工：写一份 `slides.mdx` 用到 `<Callout>`、`<PullQuote>`、`layout: section`，切到 `theme: paper`，全部渲染、视觉协调。
- `pnpm -F @slidev-react/node test` 绿（`validateSlidesAuthoring` 不会再报 Paper 缺 layout）。

### Phase 5 — 测试 + 冒烟 + 文档

**改动**

- 新增轻量测试：断言三个主题 `mdxComponents` 的 key 集合 = `["Badge", "Callout", "Eyebrow", "KeyStat", "PullQuote"]`。位置：`packages/client/src/theme/__tests__/themeParity.test.ts`。
- `README.md` / `packages/theme-paper/README.md`（若有）更新 Paper 组件清单。

**验收**

- `pnpm lint` + `pnpm test` + `pnpm build:packages` + `pnpm run test:smoke:runtime` + `pnpm run test:smoke:npm-install` 全绿。
- 手工切三个主题跑 `slides.mdx`，Callout/KeyStat/PullQuote 都能正常显示。

---

## 5. 风险与回退

- **CSS 类名全量替换**：用 `sed` / `vp fmt` 辅助，改完 grep 确认 0 残留。
- **tsdown entry 新增**：若 `./theme-shared` 打包失败，回退到把 shared 组件直接塞进 `@slidev-react/client` 主 entry 导出，themes 用 `import { SlideCallout } from "@slidev-react/client"` 即可。
- **Peer deps 加一环**：发布时 `pnpm pack` 会把 `workspace:^` 写成当前 client 版本号，smoke 脚本已经走 `pnpm pack`，无需额外改动。
- **回退**：每个 Phase 独立 commit，回退只需 `git revert`。

---

## 6. 之后可选的延伸（不进本轮）

- 主题继承 `extends: "moonlit"`（定义一下契约）。
- 把 `addons` 下的字体/图表 token 按"主题片段"方式分发。
- 给主题 README 补 component gallery 截图。
