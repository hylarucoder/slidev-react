# UI/UX Audit · 2026-04-23

> Phase 0 基线产出。对照 `2026-04-refactor-roadmap.md` 的 Phase 2 / Phase 5，列出"当前不一致 / 缺口"清单。每个条目带复盘位置，便于后续 PR 引用。

---

## 1. 按钮与控件样式

### 1.1 手写 `<button>` 而非原语

| 位置 | 数量 | 现状 | Phase |
|---|---|---|---|
| `PresentationStatus.tsx:170-261` | 6 | Copy viewer / Mirror / Print / Timeline / Fullscreen / Wake lock 全部手写 Tailwind，与 `ChromeIconButton` 风格不完全一致 | 2.4 用 `ChromeButton` 替换 |
| `PresentationStatus.tsx:368-381` | 5 | 颜色选择 swatch（draw colors）手写 `<button>` | 2.1 用 `ChromeIconButton radius="full"` 或新增 `ColorSwatchButton` |
| `overview/QuickOverview.tsx:132-157` | N | `ChromePanel as="article" role="button"` 用作按钮 | 可接受，但 focus ring 不一致（`ring-emerald-300/70`，其他原语用 `ring-accent`） |

### 1.2 Select vs ToggleGroup

三处 `FormSelect` 语义更接近分段切换（值域小、视觉优先）：

| 位置 | 值域 | 建议 |
|---|---|---|
| `PresentationStatus.tsx` stage scale | 0.9 / 1 / 1.08 | → `ChromeToggleGroup` |
| `PresentationStatus.tsx` cursor mode | always / idle-hide | → `ChromeToggleGroup` |
| `PresentationStatus.tsx` sync mode | send / receive / both / off | → `ChromeToggleGroup`（4 项略多，可保留 select） |

Phase 2.1 新增 `ChromeToggleGroup`，Phase 2.4 替换。

### 1.3 Tooltip vs `title` attribute

全站用 `title=` 给按钮加 hint，导致：
- 无法展示快捷键徽标（例如 "(D)"）
- 延迟一致（300ms 浏览器默认）与动效节奏脱节
- 移动端无效

`grep -rn ' title="' packages/client/src/features packages/client/src/ui` 命中 19 处（基线）。Phase 2.5 全量替换为 `ChromeTooltip`。

---

## 2. Overlay 骨架不一

| Overlay | 遮罩 | 圆角 | 阴影 | 关闭方式 | 焦点陷阱 | ESC |
|---|---|---|---|---|---|---|
| `ShortcutsHelpOverlay` | `bg-slate-950/35 backdrop-blur-[2px]` | `rounded-[8px]` | `shadow-[0_16px_40px_rgba(15,23,42,0.12)]` | 点击外部 ✅ | ❌ | 依赖父 | 
| `QuickOverview` | `bg-slate-100/84 backdrop-blur-md` | （全屏无圆角） | 无 | 点击 X 按钮 | ❌ | 依赖父 |
| `NotesOverview` | 同 QuickOverview 风格 | 同上 | 无 | 同上 | ❌ | 依赖父 |

三者目前都靠 `chrome.closeOverlay` 单点路由，ESC 由 `usePresenterChromeRuntime` 内的全局 keydown 监听兜底。

**Phase 2.2 目标**：`OverlayShell` 统一接管 scrim / 焦点陷阱 / ESC / aria-modal，支持 `variant: 'centered' | 'fullscreen'`。

---

## 3. 设计 token 缺口

### 3.1 已在 `ui/tokens/` 的（Phase 0 新增）

- ✅ `MOTION_DURATION` / `MOTION_EASING`
- ✅ `Z_LAYERS`
- ✅ `DRAW_COLORS` / `DRAW_WIDTHS` / `STAGE_SCALE_OPTIONS` / `CURSOR_MODE_OPTIONS`
- ✅ `CHROME_TONE` / `CHROME_RADIUS`（TS 常量，未绑定 Tailwind `@theme`）

### 3.2 仍散落在组件内

| 内容 | 位置 | 建议 |
|---|---|---|
| 状态栏背景 `bg-white/82` / `bg-slate-50/72` | `PresentationStatus.tsx:145/320` | → `CHROME_TONE.surface` + Tailwind 语义类 |
| ring 颜色 `ring-white/45` | 同上 | → token |
| `border-slate-200/80` / `border-slate-200` | 全站 ~25 处 | → `CHROME_TONE.border` |
| `text-slate-500/600/700/900` | 全站 ~30 处 | → `CHROME_TONE.fg{,Muted,Subtle}` |
| 圆角 `rounded-md` / `rounded-[6px]` / `rounded-[8px]` | 混用 | → 统一 `CHROME_RADIUS` |
| 阴影 `shadow-[inset_0_1px_0_rgba(...)]` 等 | 多处 inline | 考虑抽 `SHADOW_*` token |

### 3.3 动效 duration 硬编码

| 位置 | 值 | 目标 |
|---|---|---|
| `PresentationNavbar.tsx:79` | `duration-0` / `duration-180` | 使用 `MOTION_DURATION.base` |
| `PresenterTopProgress.tsx:13` | `duration-300` | 与 token 不一致（300 ≠ fast/base/slow），Phase 5.2 决定是否新增 `progress=300` 或降到 240 |
| Tailwind 默认 `transition` 类 | 多处 | 保留（Tailwind 默认 150ms，接近 fast） |

---

## 4. 暗色模式缺口

### 4.1 已支持

- `theme/themeTokens.ts` + `theme/tokens.css`：slide 内容层通过 `--slide-*` CSS 变量 + moonlit 主题提供 dark-first。
- MDX prose / 代码块 / 图表：通过 `--slide-chart-*` / `--slide-diagram-*` 映射。

### 4.2 UI 外壳未覆盖

以下组件使用明色硬编码，暗色下视觉失真：

| 组件 | 硬编码点（采样） |
|---|---|
| `PresentationStatus.tsx` | `bg-white/82`, `bg-slate-50/72`, `text-slate-700`, `border-slate-200/80` |
| `PresenterShell.tsx:147` | `bg-slate-50` / `bg-black`（纯黑对暗色过暗） |
| `PresentationNavbar.tsx:79` | `bg-white/95`, `ring-black/5` |
| `ShortcutsHelpOverlay.tsx` | `bg-slate-950/35` 遮罩（暗色下变纯黑）、`bg-white/95` 卡片 |
| `QuickOverview.tsx` | `bg-slate-100/84`（暗色下偏白） |
| `PresenterSidePreview.tsx` | `text-slate-500` 标题 |
| `SpeakerNotesPanel.tsx` | 同上 |

**Phase 5.3 方案**：
1. `ui/tokens/chromeTokens.ts` 提供 light + dark 两套常量。
2. 在 `theme/tokens.css` 扩充 `@media (prefers-color-scheme: dark)` 块 / `[data-theme="dark"]` 兼容。
3. 组件改用语义 class：`bg-chrome-surface`、`text-chrome-fg`、`border-chrome`（需 Tailwind v4 `@theme` 映射 CSS 变量）。

---

## 5. 信息层级问题

### 5.1 StatusBar 右侧过载

WIP commit（`43588e5`）已把 fullscreen / wake lock / timeline / print 挪入展开面板，保留 timer + record + notes + overview + shortcuts + details toggle 六件。已好转。

进一步 Phase 5.1：
- 左段当前空白（`flex-1`），建议放 slide title + index
- 中段无内容（目前右侧一段独占）
- 底部 draw toolbar 浮层改为"启用时才出现"，不占常态空间

### 5.2 PresenterMode 主视图布局

当前绝对定位 + 嵌套 flex，`PRESENTER_BOTTOM_BAR_CLEARANCE=72` 硬约束 padding。Phase 5.1 改 `grid-cols-12` 栅格。

### 5.3 Presenter side panels 节奏

WIP commit 已把 "Up Next" 从 `emerald-700` 降到 `slate-500`（去装饰），与 "Notes" 标题节奏对齐。完成度较好。

---

## 6. 可达性缺口

| 项 | 现状 |
|---|---|
| Overlay ESC 关闭 | 依赖 `usePresenterChromeRuntime` 全局监听，overlay 本身无 `onKeyDown` |
| Tab 焦点陷阱 | 三个 Overlay 全部缺失 |
| Overlay 打开时自动聚焦 | 缺失 |
| Overlay 关闭后焦点还原 | 缺失 |
| `aria-modal` / `role="dialog"` | ShortcutsHelpOverlay 有 `role="presentation"`（错误用法），其他无 |
| `prefers-reduced-motion` | 未尊重 |

**Phase 5.4 目标**：`OverlayShell` 一揽子解决。

---

## 7. Phase 2 / Phase 5 验收基线

### Phase 2 结束时应达成

- [ ] `grep -rn '<button ' packages/client/src/features packages/client/src/addons` ≤ 3
- [ ] `grep -rn ' title="' packages/client/src/features packages/client/src/ui` ≤ 3（剩余的是 HTML 默认语义）
- [ ] `ui/primitives/` 新增 `ChromeButton` / `ChromeToggleGroup` / `OverlayShell`
- [ ] 三个 Overlay 使用 `OverlayShell` 改造完成

### Phase 5 结束时应达成

- [ ] `grep -rn 'bg-white\|bg-slate-' packages/client/src/features packages/client/src/ui` 降至个位数（仅剩"明色内容"合理场景）
- [ ] light/dark 对照截图 6 张（StatusBar / PresenterMode / 3 Overlays / PresentationNavbar）
- [ ] Lighthouse / axe 可达性得分 UI 外壳部分 ≥ 90
- [ ] 三档动效节奏全站统一，`duration-*` 硬编码 = 0
- [ ] `prefers-reduced-motion: reduce` 下动效全量降级

---

## 附录：采样 `grep` 结果（2026-04-23 基线）

```
$ grep -rn '<button ' packages/client/src/features packages/client/src/addons | wc -l
3

$ grep -rn ' title="' packages/client/src/features packages/client/src/ui | wc -l
19

$ grep -rn 'bg-slate-' packages/client/src/features packages/client/src/ui | wc -l
36

$ grep -rn 'duration-' packages/client/src/features packages/client/src/ui | wc -l
7
```

> 每个 Phase 完工后跑相同 grep，把数字更新到本文档，作为可度量的进展指标。
