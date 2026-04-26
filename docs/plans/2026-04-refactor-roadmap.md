# Slidev-React 系统性重构路线图

> 起草日期：2026-04-23
> 范围：`packages/client`（重点） · `packages/core` 契约梳理 · UI/UX 统一
> 目标：提升架构可读性/可维护性 · 统一并打磨 UI/UX
> 阅读方式：每个 Phase 下的 `TODO` 都是可直接转成 PR 粒度的任务项。先看 §1-§3 建立全局认知，再进入 §4 逐阶段执行。

---

## 1. 背景与目标

### 1.1 现状（截止 2026-04-23）

- `features/presentation/` 累计 **14.4k 行**，其中若干 400+ 行的"总线组件"：
  - `PresentationStatus.tsx` 496 行（1 个外壳 + 13 个子区域，同居一文件）
  - `presenter/PresenterShell.tsx` 286 行（8 props + 6 runtime，统筹所有 Presenter 业务）
  - `presenter/runtime/usePresenterChromeRuntime.ts` 358 行
  - `addons/builtin/mermaid/MermaidDiagram.tsx` 589 行 / `addons/builtin/g2/G2Chart.tsx` 445 行
  - `draw/DrawProvider.tsx` 394 行（React state + localStorage + 键盘事件三合一）
- 三个 Overlay（`ShortcutsHelpOverlay` / `QuickOverview` / `NotesOverview`）各自实现遮罩 / 层级 / 关闭逻辑，不共享骨架。
- `PresentationNavbar` 与 `PresentationStatus` 有**功能重复**（overview/notes/shortcuts/prev/next 按钮），按模式二选一渲染，控件行为却不完全一致。
- `DrawProvider` 的键盘监听（`DrawProvider.tsx:242-306`）与 `navigation/keyboardShortcuts.ts` + `KeyboardController.tsx` **语义重叠但未整合**。
- 设计 token：`packages/client/src/theme/themeTokens.ts` 已覆盖"幻灯片内容"层（`--slide-*`），但"演示 UI 外壳"（状态栏/按钮色/动效节奏/层级）仍散落在组件内。
- 业务 Hook 单测为零（`usePresenterChromeRuntime` / `usePresenterFlowRuntime` / `usePresenterSessionRuntime` / `useSyncTransportRuntime` 等），仅 `usePresentationSync` 有 browser 级集成测试。

### 1.2 目标

1. **架构**：新同事 1 小时画出模块依赖图；任何单文件 ≤ 300 行；顶层组件 props ≤ 3 个；关键状态 Hook 可独立单测。
2. **UI/UX**：Chrome / 系统化审美落地——控件全部走原语；三档动效节奏；暗色等价；键盘可达；Overlay 骨架统一。

### 1.3 非目标（本轮不做）

- 不引入新状态库（不上 Redux / Zustand / Jotai）。
- 不破坏对外导出契约（`@slidev-react/core` 的 session protocol / flow cues / export urls；`@slidev-react/client` 的 runtime / addon / theme 入口）。
- 不改 MDX 编译管线、节点侧 parse/compile、CLI 命令。
- 不追加"兼容层"（遵循 AGENTS.md §1.2：改即改，搜索替换一次到位）。

---

## 2. 现状诊断（压缩版）

### 2.1 文件热点

| 文件 | 行数 | 职责混杂点 |
|---|---|---|
| `PresentationStatus.tsx` | 496 | 绘图工具条 + 会话状态展开面板 + 右侧按钮组同文件 |
| `presenter/runtime/usePresenterChromeRuntime.ts` | 358 | stage 缩放 + 侧栏宽度持久化 + 光标/空闲 + 四个 overlay 开关 + 键盘快捷键触发 |
| `presenter/PresenterShell.tsx` | 286 | mode 分发 + 所有 runtime 组合 + providers 包裹 + overlay 挂载 |
| `reveal/Reveal.tsx` | 286 | Cue 调度 + `motion` 动画 + 事件订阅 |
| `presenter/FlowTimelinePreview.tsx` | 275 | timeline 渲染 + pointer 交互 + slide 拖拽 |
| `sync/runtime/useSyncTransportRuntime.ts` | 251 | WS 重连 + 心跳 + BroadcastChannel 回退 |
| `sync/runtime/useSyncReplicationRuntime.ts` | 210 | 状态去重 + 远端 patch 合并 |
| `draw/DrawProvider.tsx` | 394 | strokes 状态 + localStorage + 键盘事件 + readOnly 分支 |
| `addons/builtin/mermaid/MermaidDiagram.tsx` | 589 | mermaid 运行时 + 错误边界 + 主题 token 注入 + SVG 尺寸监听 |
| `addons/builtin/g2/G2Chart.tsx` | 445 | g2 运行时 + 同上 |

### 2.2 命名 / 分层

- `presenter/` 同级混放：**模式视图**（`PresenterModeView` / `StandaloneModeView`）、**局部面板**（`PresenterSidePreview` / `SpeakerNotesPanel` / `PresenterTopProgress`）、**时间轴**（`FlowTimelinePreview`）、**运行时**（`runtime/`）、**平台 hook**（`platform/`）、**数据契约**（`model/`）、**常量**（`stage.ts`）。
- 同前缀滥用：`Presenter*` 占据 7 个 tsx 文件名，分不清"模式"/"面板"/"容器"。
- Hook 命名：`useSlidesNavigation`（返回 state+selector+action）、`usePresenterFlowRuntime`（组合 nav+reveal，有副作用）、`usePresentationSync`（命名空间级 runtime）——无规约分层。

### 2.3 UI/UX

- **控件复刻**：`PresentationStatus.tsx:186-261` 中 `Copy viewer link` / `Open mirror stage` / `Print/PDF` / `Timeline` / `Fullscreen` / `Wake lock` 6 个按钮全部手写 Tailwind（不走 `ChromeIconButton` / 新增的 `ChromeButton`）。
- **Overlay 骨架不一**：
  - `ShortcutsHelpOverlay`: `bg-slate-950/35 backdrop-blur-[2px]`, `z-50`, 点击外部关闭，缺 ESC 与焦点陷阱。
  - `QuickOverview`: `bg-slate-100/84 backdrop-blur-md`, `z-50`, 无点击外部关闭，ESC 在其父层处理。
  - `NotesOverview`: 另一套。
- **设计 token 割裂**：`DRAW_COLORS` 写在 `PresentationStatus.tsx:38`，`DRAW_WIDTHS` 同行，`STAGE_SCALE` 选项硬编码在 JSX。
- **动效节奏不统一**：`PresentationNavbar.tsx:79` 出现 `duration-180` / `duration-0` 混用；无统一常量。
- **暗色模式**：只有 Moonlit 主题支持 dark-first；UI 外壳（`PresentationStatus` / `PresenterShell` / `PresentationNavbar`）大量 `bg-slate-50` / `text-slate-*` 明色硬编码，dark 下失真。

### 2.4 工程化

- 测试：共约 35 个测试文件（含 `*.browser.test.tsx`），**业务 Hook 零单测**；e2e 有 Playwright 覆盖导航与 reveal。
- Lint：Oxlint 已启用，但无 import 边界规则（目前 `features/` 可反向引用 `addons/` / `theme/`）。
- 路径别名：仅 `@/*`。

---

## 3. 重构总原则

1. **小步多提交**：每 Phase 拆成若干 ≤ 300 行 diff 的 PR；一个 PR 只做一件事（结构迁移 / 视觉打磨 / 测试补齐 三者不混合）。
2. **先契约，后实现**：目录迁移前先在新位置放 `index.ts` 导出契约；旧位置成为纯消费方；最后一次性改 import 并删旧文件。**不留 re-export 兼容层**。
3. **可测先行**：业务 Hook 动刀前，先补 1-2 条 happy-path 单测锁行为；动完后补回归。
4. **UI 一律走原语**：涉及按钮/徽章/面板/表单控件，必须用 `ui/primitives/*`；发现缺口——补原语，不就地复刻。
5. **动效三档**：duration ∈ {120, 180, 240}ms；easing 仅 `ease-out` / `ease-in-out`；禁 spring / elastic；尊重 `prefers-reduced-motion`。
6. **token 集中**：所有硬编码颜色 / 尺寸 / 层级 / 时长→ `ui/tokens/*`；slide 内容色沿用 `theme/themeTokens.ts`，UI 外壳色用新增的 `ui-chrome` token 集。

---

## 4. 分阶段路线图

### Phase 0 · 基线与护栏

> 目标：在不改业务代码的前提下，建立"可度量、可约束、可回滚"的基线。
> 工期：0.5 周 · PR 数：3-4

#### 0.1 补齐基线文档（产出 2 个文档）

- [ ] **`docs/plans/architecture-snapshot.md`**：
  - 模块依赖图（mermaid graph）：`core` ← `client/features/presentation` ← `client/addons` / `client/theme` / `client/ui`；标注反向引用若干。
  - `features/presentation/` 子目录职责一览表。
  - 每个业务 Hook 的输入/输出契约摘要（`usePresenterChromeRuntime` 等 7 个）。
- [ ] **`docs/plans/ui-ux-audit.md`**：
  - 逐组件列出当前视觉不一致项（按钮样式、overlay 遮罩、圆角、阴影、动效 duration）。
  - 现有 `theme/themeTokens.ts` 的 token 清单 vs. 需要新增的 UI-chrome token 清单。
  - 暗色模式缺口清单（哪些 `bg-slate-*` / `text-slate-*` 硬编码需要改 token）。

#### 0.2 业务 Hook 单测打底

- [ ] `presenter/runtime/__tests__/usePresenterFlowRuntime.test.ts`：1 条"三张 slide 的 advance/retreat/goTo 正确"happy-path。
- [ ] `presenter/runtime/__tests__/usePresenterChromeRuntime.test.ts`：1 条"overlay 互斥（打开 A 关闭 B）"happy-path。
- [ ] `presenter/runtime/__tests__/usePresenterSessionRuntime.test.ts`：1 条"canControl=false 时 detachFromPresenter 的幂等性"。
- [ ] `draw/__tests__/DrawProvider.reducer.test.tsx`：3 条（startStroke / appendStrokePoint / undo）。
- 约束：每个测试文件 ≤ 80 行；只用 `@testing-library/react` + `vitest`，不引入新依赖。

#### 0.3 新增 UI token 目录

- [ ] 新建 `packages/client/src/ui/tokens/` 目录，包含：
  - `motion.ts`：`export const MOTION = { fast: 120, base: 180, slow: 240, easing: { out: 'cubic-bezier(0.16,1,0.3,1)', inOut: 'cubic-bezier(0.65,0,0.35,1)' } }`
  - `layers.ts`：`Z = { navbar: 40, overlay: 50, toast: 60, debug: 90 }`
  - `chromeTokens.ts`：外壳色（状态栏背景、按钮 tone、分隔线），与 `theme/themeTokens.ts` 互不覆盖；key 前缀用 `chrome-*`。
  - `drawTokens.ts`：`DRAW_COLORS`（从 `PresentationStatus.tsx:38` 移出）、`DRAW_WIDTHS`、`STAGE_SCALE_OPTIONS`、`CURSOR_MODE_OPTIONS`。
  - `index.ts` 统一 re-export。
- [ ] `PresentationStatus.tsx` 同 PR 中改为从 `ui/tokens` 引入 `DRAW_COLORS` / `DRAW_WIDTHS`（仅迁移常量，不动结构）——作为"token 被真实使用"的证据。

#### 0.4 Import 边界护栏（草案，非强制）

- [ ] 在 `.oxlintrc`（或等效配置）增加两条 restricted-import：
  - `ui/primitives/*` 不得引用 `features/*` / `addons/*` / `theme/*`
  - `addons/*` 不得引用 `features/presentation/*`
- 如果 Oxlint 不支持，退化为 Phase 0 文档中的"约定"，在 CR 环节人工把关。

#### 0.5 清理 WIP（关键前置）

- [ ] 当前 6 个 uncommitted 文件（`PresentationStatus` / `ShortcutsHelpOverlay` / `PresenterModeView` / `PresenterSidePreview` / `PresenterTopProgress` / `SpeakerNotesPanel`）走一次 review → 合并或 stash。Phase 1 的目录迁移不能和 WIP 互搏。

**Phase 0 验收清单**：
- [ ] 两份文档合入 `docs/plans/`
- [ ] 5 条 Hook / Provider 单测绿灯
- [ ] `ui/tokens/` 目录落地且至少被 `PresentationStatus` 引用 1 次
- [ ] WIP 清理完毕（git status 干净或 stash 明确命名）

---

### Phase 1 · Presentation 特性重组

> 目标：给 `features/presentation/` 一个"肉眼可读"的分层，消灭 God Component。
> 工期：1.5 周 · PR 数：6-8（每个 PR 聚焦一个迁移动作）

#### 1.1 目标目录（终态）

```
features/presentation/
├── index.ts                       # 唯一对外入口
├── PresentationRoot.tsx           # 代替 PresenterShell，仅负责 mode 分发 + Providers
├── modes/
│   ├── PresenterMode.tsx          # 原 PresenterModeView + PresenterShell（瘦身后）合并
│   ├── ViewerMode.tsx             # 非 presenter 角色的布局（原 StandaloneModeView 改名）
│   └── PrintMode.tsx              # 原 PrintSlidesView 搬入
├── stage/                         # 保留
├── reveal/                        # 保留（Phase 3 内部再拆）
├── navigation/                    # 保留
├── overview/                      # 保留
├── draw/                          # 保留（Phase 3 内部再拆）
├── sync/                          # 保留
├── recording/                     # 新目录：从根挪入 usePresentationRecorder / recordingFilename / exportArtifacts
├── session/                       # 新目录：将 session.ts / location.ts / path.ts / browser.ts 归拢
├── status/                        # 新目录：PresentationStatus 拆分产物
│   ├── StatusBar.tsx              # 外壳容器（~80 行）
│   ├── StatusBarDrawToolbar.tsx   # 绘图工具条（含颜色/宽度/擦除/撤销，~120 行）
│   ├── StatusBarActions.tsx       # 右侧按钮组（timer / record / notes / overview / shortcuts / details toggle，~80 行）
│   ├── StatusDetailsPanel.tsx     # 展开面板外壳（~40 行，仅组合下面三段）
│   ├── panels/
│   │   ├── SyncControlsRow.tsx    # sync badge + 模式切换 + 链接复制 + mirror + print + timeline + fullscreen + wake（拆子组件）
│   │   ├── DisplayControlsRow.tsx # stage scale + cursor mode
│   │   └── SessionInfoRow.tsx     # 广播/ws/peers/role/session id chips
│   └── tone.ts                    # badgeClassName / statusDotClassName / formatTimer 三个工具
└── presenter/                     # 瘦身后只保留"Presenter 专属 UI"
    ├── PresenterContext.tsx       # 新增：提供 flow/chrome/session/navigation/slides/config 给面板消费
    ├── panels/
    │   ├── SidePreview.tsx        # 原 PresenterSidePreview
    │   ├── SpeakerNotes.tsx       # 原 SpeakerNotesPanel
    │   ├── TopProgress.tsx        # 原 PresenterTopProgress
    │   └── FlowTimeline.tsx       # 原 FlowTimelinePreview（Phase 4 再内部拆）
    ├── runtime/                   # 保留（Phase 3 内部治理）
    ├── platform/                  # 保留
    └── model/                     # 保留
```

#### 1.2 具体 TODO（按 PR 粒度）

**PR #1 · 建立 `PresenterContext` 并瘦身入口**

- [ ] 新建 `features/presentation/presenter/PresenterContext.tsx`：暴露 `{ flow, chrome, session, navigation, slides, slidesConfig, canControl }`，`useMemo` 冻结 value。
- [ ] 新建 `features/presentation/PresentationRoot.tsx`（100 行以内），职责：
  - 根据 `session.role` + `exportMode` 分发到 `PresenterMode` / `ViewerMode` / `PrintMode`
  - 包 `RevealProvider` + `DrawProvider` + `KeyboardController`
  - 不接受任何回调类 props（所有 handler 在内部通过 context 消费）
- [ ] `app/App.tsx` 改为 `<PresentationRoot slidesDocument={...} session={...} onSyncModeChange={...} />`——props ≤ 3。
- [ ] 临时保留 `PresenterShell.tsx` 作为 `PresentationRoot` 的别名导出，**该 PR 结束时立即删除**旧文件（一次性）。

**PR #2 · `PresentationStatus` 拆分（第一刀：外壳 + Actions）**

- [ ] 从 `PresentationStatus.tsx:320-491` 抽出 `status/StatusBar.tsx`（外壳）+ `status/StatusBarActions.tsx`（右侧按钮组）。
- [ ] 抽出 `status/tone.ts`（`badgeClassName` / `statusDotClassName` / `formatTimer`）。
- [ ] `StatusBarActions` 全部控件用 `ChromeIconButton` 替换（timer 用 `ChromeTag`）。
- [ ] 旧 `PresentationStatus.tsx` 暂保留，内部改为组合 `StatusBar` + `StatusBarDrawToolbar`（下 PR 再拆）。

**PR #3 · `PresentationStatus` 拆分（第二刀：DrawToolbar + DetailsPanel）**

- [ ] 抽出 `status/StatusBarDrawToolbar.tsx`（原 `PresentationStatus.tsx:324-424`）。颜色 / 宽度从 `ui/tokens/drawTokens.ts` 读。
- [ ] 抽出 `status/StatusDetailsPanel.tsx` 外壳 + 三个子 Row：
  - `panels/SyncControlsRow.tsx`：sync badge、mode select、Copy viewer link（换 `ChromeButton`，Phase 2 产物占位）、mirror、print、timeline、fullscreen、wake lock——本 PR 先保留 button 手写样式，**标记 TODO(Phase 2)**。
  - `panels/DisplayControlsRow.tsx`：`FormSelect` 两段。
  - `panels/SessionInfoRow.tsx`：`ChromeTag` 六段。
- [ ] 删除旧 `PresentationStatus.tsx`，新入口 `status/StatusBar.tsx` 由 `PresenterMode` 直接挂载。

**PR #4 · 模式视图合并**

- [ ] `presenter/PresenterModeView.tsx` + `PresenterShell.tsx` 的主 UI 合并到 `modes/PresenterMode.tsx`（`variant` prop 由 context 中的 role 决定是否 mount `StatusBar` / `TopProgress`）。
- [ ] `presenter/StandaloneModeView.tsx` 改名为 `modes/ViewerMode.tsx`（语义更准，"StandaloneMode" 容易误解为单人本地模式）。
- [ ] `PresentationNavbar` 仅 `ViewerMode` 使用——确认无 Presenter 侧引用后，按 AGENTS.md §1.2 原则移动到 `navigation/`（已在该目录），不加兼容 re-export。

**PR #5 · Presenter 局部面板归拢**

- [ ] `presenter/PresenterSidePreview.tsx` → `presenter/panels/SidePreview.tsx`
- [ ] `presenter/SpeakerNotesPanel.tsx` → `presenter/panels/SpeakerNotes.tsx`
- [ ] `presenter/PresenterTopProgress.tsx` → `presenter/panels/TopProgress.tsx`
- [ ] `presenter/FlowTimelinePreview.tsx` → `presenter/panels/FlowTimeline.tsx`
- [ ] 四个文件顶部 `export default → export const` 统一（遵循 AGENTS.md 命名），`import` 点一次性 grep 替换。

**PR #6 · 其他归拢**

- [ ] `features/presentation/PrintSlidesView.tsx` → `features/presentation/modes/PrintMode.tsx`
- [ ] `features/presentation/usePresentationRecorder.ts` → `recording/useRecorder.ts`
- [ ] `features/presentation/recordingFilename.ts` → `recording/filename.ts`
- [ ] `features/presentation/exportArtifacts.ts` → `recording/exportArtifacts.ts`
- [ ] `features/presentation/session.ts` → `session/session.ts`
- [ ] `features/presentation/location.ts` → `session/location.ts`
- [ ] `features/presentation/path.ts` → `session/path.ts`
- [ ] `features/presentation/browser.ts` → `session/browser.ts`（仅被 `DrawProvider` 与少数地方引用）
- [ ] 新增 `features/presentation/index.ts` 导出 `PresentationRoot` 作为唯一入口。

**Phase 1 验收清单**：
- [ ] `PresenterShell.tsx` 消失；`PresentationRoot` props ≤ 3
- [ ] `status/` 目录单文件 ≤ 120 行
- [ ] `modes/` 目录三种模式清晰
- [ ] 所有 `.browser.test.tsx` 截图测试保持通过（必要时更新基线并人工 review 一次）
- [ ] `pnpm lint && pnpm test && pnpm build` 全绿

---

### Phase 1.5 · 键盘事件归一（小插曲，必做）

> 目标：把 `DrawProvider` 里抢占的键盘事件挪回 `navigation/keyboardShortcuts.ts` 主干。
> 工期：0.5 周 · PR 数：1

#### 问题

`DrawProvider.tsx:242-306` 自己 `window.addEventListener('keydown')` 处理 `D/E/P/R/B/C/Cmd+Z/Esc`，但 `KeyboardController.tsx` 也处理键盘事件。二者之间靠 `overlayOpen` prop 做互斥，当新增快捷键时容易脑裂。

#### TODO

- [ ] 将 D/E/P/R/B/C 的映射从 `DrawProvider` 迁入 `navigation/keyboardShortcuts.ts`（该文件 221 行已经有 `ShortcutHelpSection` 数据结构）。
- [ ] 为每条快捷键在 `keyboardShortcuts.ts` 注册 `action: 'draw.toggle' | 'draw.tool.pen' | ...`。
- [ ] `DrawProvider` 暴露 `dispatch(action)` 供 `KeyboardController` 调用；自身不再监听 `window`。
- [ ] `Cmd+Z` 由 `KeyboardController` 根据"当前是否有焦点绘图"判断是否路由到 draw undo（否则让浏览器默认）。
- [ ] `ShortcutsHelpOverlay` 展示数据自动包含所有 draw 快捷键（当前缺失了 D/E/P/R/B/C 的说明）。

**验收**：`grep 'addEventListener.*keydown' packages/client/src/features/presentation/` 只剩 `navigation/` 下一处。

---

### Phase 2 · UI 原语与 OverlayShell

> 目标：扩原语库 → 全站铺开 → 建立"视觉唯一标准"。
> 工期：1 周 · PR 数：4-5

#### 2.1 新原语（按需新增，不过度抽象）

- [ ] **`ChromeButton`**（文字+图标按钮，区别于图标单按钮）
  - props: `tone` (default/active/danger/success/info/violet)、`size` (sm/md)、`leading`/`trailing` slot
  - 目标替换：`PresentationStatus` 展开面板中 6 个手写按钮（Copy viewer / Mirror / Print / Timeline / Fullscreen / Wake lock）
- [ ] **`ChromeToggleGroup`**（分段控件）
  - props: `value`、`onChange`、`options: { value, label, icon? }[]`
  - 目标替换：当前 `FormSelect` 做的"stage scale"、"cursor mode"、"sync mode"三处——分段控件比 select 更符合桌面/触屏的切换直觉
- [ ] **`ChromeTooltip`**（基于 `@radix-ui/react-tooltip` 或 headless 自实现）
  - 当前依赖 `title` attribute，无法展示快捷键徽标、无法统一动效
  - 替换范围：所有 `ChromeIconButton` 的 `title` 用法
- [ ] **`OverlayShell`**（统一 Overlay 骨架）
  - 接管：scrim、z-index、ESC 关闭、焦点陷阱（`focus-trap-react` 或手写 `useFocusTrap`）、进入动效（fade + 上移 4px）、`aria-modal` / `role="dialog"`
  - 支持 variant：`fullscreen`（QuickOverview）、`centered`（ShortcutsHelpOverlay）、`bottom-sheet`（未来预留）
  - 强制消费方提供 `title` / `onClose` / `children`

#### 2.2 TODO（按 PR 粒度）

**PR #1 · 新增 `ChromeButton` + `ChromeToggleGroup`**
- [ ] 两个原语的组件 + `__tests__/*.browser.test.tsx` 视觉测试各一条。
- [ ] 暂不替换消费方。

**PR #2 · 新增 `OverlayShell`**
- [ ] 接口：`<OverlayShell open title onClose variant="centered|fullscreen">`。
- [ ] 内建 `useFocusTrap` hook（放在 `ui/hooks/useFocusTrap.ts`）。
- [ ] 接入 `prefers-reduced-motion`。

**PR #3 · 三个 Overlay 改造**
- [ ] `ShortcutsHelpOverlay.tsx` 改用 `OverlayShell variant="centered"`，内部只保留 ShortcutKeys 与 sections 渲染。
- [ ] `QuickOverview.tsx` 改用 `OverlayShell variant="fullscreen"`。
- [ ] `NotesOverview.tsx` 同上。
- [ ] 三者的 `bg-slate-*` / `backdrop-blur-*` / `z-50` 硬编码全部删除，统一由 `OverlayShell` 内置（配合 `ui/tokens/layers.ts`）。

**PR #4 · `StatusDetailsPanel` 6 按钮迁移 `ChromeButton`**
- [ ] `status/panels/SyncControlsRow.tsx` 内的 Copy viewer link / Mirror / Print / Timeline / Fullscreen / Wake lock 六按钮用 `ChromeButton` 替换。
- [ ] `StatusBarActions` / `SyncControlsRow` / `DisplayControlsRow` 的 `FormSelect`（stage scale / cursor mode / sync mode）若分段控件更合适，替换为 `ChromeToggleGroup`。

**PR #5 · Tooltip 全站铺开**
- [ ] `ChromeIconButton` 增加可选 `tooltip` prop（含快捷键显示）。
- [ ] 全站 `title=` 用法批量替换；`grep -rn ' title="' packages/client/src/features packages/client/src/ui` 命中数降至 0。

#### 2.3 验收

- [ ] `grep -rn '<button ' packages/client/src/features packages/client/src/addons` 命中数 ≤ 3（仅剩极少不可原语化的场景）。
- [ ] `ui/primitives/` 目录扩展到 11 个文件（原 8 + 新 3：`ChromeButton` / `ChromeToggleGroup` / `OverlayShell`）。
- [ ] `docs/plans/ui-ux-audit.md` 里"原语覆盖率"一列全部打勾。

---

### Phase 3 · 状态治理 & 关键 Hook 拆分

> 目标：以 Draw 为示范，建立"单一职责 + 可测"的状态模块范式，再扩散到 Reveal / Chrome。
> 工期：1 周 · PR 数：4

#### 3.1 Draw 拆分（示范区）

**PR #1 · `DrawProvider` 拆成 reducer + persistence + context**

- [ ] 新建 `draw/state/drawReducer.ts`（纯函数，~120 行）：
  ```ts
  type DrawState = { enabled, tool, color, width, strokesBySlideId }
  type DrawAction =
    | { type: 'toggleEnabled' } | { type: 'setTool'; tool }
    | { type: 'setColor'; color } | { type: 'setWidth'; width }
    | { type: 'startStroke'; slideId; stroke }
    | { type: 'appendPoint'; slideId; strokeId; point }
    | { type: 'eraseAtPoint'; slideId; point; radius }
    | { type: 'undo'; slideId } | { type: 'clear'; slideId }
    | { type: 'replaceAll'; strokesBySlideId }
  ```
  所有几何计算（`strokeContainsPoint` 等）仍留在本文件，易测。
- [ ] 新建 `draw/state/useDrawPersistence.ts`（~60 行）：
  - 消费 `storageKey` + `strokesBySlideId`
  - 读写 `localStorage`（try/catch 收拢在这里）
- [ ] 新建 `draw/state/useRemoteStrokes.ts`（~40 行）：
  - 消费 `remoteStrokes`（revision 驱动）+ `dispatch`
- [ ] `draw/DrawProvider.tsx` 瘦身到 ≤ 80 行：仅 `useReducer` + 挂 3 个辅助 hook + 暴露 context。
- [ ] `draw/__tests__/drawReducer.test.ts`：覆盖 startStroke / appendPoint / undo / clear / eraseAtPoint（命中与未命中）/ replaceAll，共 ~15 条。
- [ ] 去除 `DrawProvider` 内的键盘事件（由 Phase 1.5 完成的 `keyboardShortcuts` 统一调度 `dispatch`）。

#### 3.2 Reveal Engine 抽离

**PR #2 · `Reveal.tsx` 拆 engine + view**

- [ ] 新建 `reveal/revealEngine.ts`（~150 行纯函数）：
  - Cue 序列构造、`advanceCue` / `retreatCue` / `setCueIndex` 三个纯函数
  - 签名只接收 state，不依赖 React
- [ ] `reveal/Reveal.tsx` 瘦身：只负责 DOM + `motion` 动画订阅 engine 返回的 state。
- [ ] `reveal/__tests__/revealEngine.test.ts`：6-8 条，覆盖 cue 边界 / multi-step cue / skip cue。
- [ ] `reveal/RevealContext.tsx` 保持不变。

#### 3.3 Hook 命名规约

**PR #3 · 文档化 + 改名**

- [ ] 在 `AGENTS.md` 新增小节 "Hook Conventions"：
  - `useXxxState`：纯 state + setter，无副作用
  - `useXxxRuntime`：组合 state + effect / subscription / timer
  - `useXxxSelector`：只读派生，不返回 setter
- [ ] 按规约改名：
  - `usePresenterFlowRuntime` ✓（已符合）
  - `usePresenterChromeRuntime` ✓
  - `usePresenterSessionRuntime` ✓
  - `usePresentationRecorder` → `useRecorderRuntime`（与 Phase 1 recording/ 目录一起）
  - `useSlidesNavigation` → `useSlidesNavigationRuntime`（它有 effect）
- [ ] 全站一次性 grep 替换 import；**不保留别名**。

#### 3.4 Chrome Runtime 瘦身

**PR #4 · `usePresenterChromeRuntime` 拆三块**

- [ ] 当前 358 行，拆为：
  - `chrome/useStageScale.ts`（~50 行：stage scale + 持久化）
  - `chrome/useSidebarWidth.ts`（~70 行：侧栏宽度 + 持久化 + clamp）
  - `chrome/useOverlayController.ts`（~120 行：四个 overlay 互斥 + 快捷键集成）
  - `chrome/useIdleCursorRuntime.ts`（沿用现有 `platform/useIdleCursor` + `cursorMode` 切换）
- [ ] `usePresenterChromeRuntime` 变成"组合器"，~80 行。
- [ ] 补测：每个子 hook 各 1-2 条单测。

#### 3.5 验收

- [ ] `DrawProvider.tsx` ≤ 80 行
- [ ] `Reveal.tsx` ≤ 160 行（engine 抽走）
- [ ] `usePresenterChromeRuntime` ≤ 100 行
- [ ] `pnpm test` 新增 ~30 条单测；`drawReducer` / `revealEngine` 行覆盖率 ≥ 80%
- [ ] `AGENTS.md` 更新 Hook 规约

---

### Phase 4 · Addon / Diagram 瘦身

> 目标：`MermaidDiagram` 与 `G2Chart` 两个 500 行级文件瘦身，复用骨架。
> 工期：1 周 · PR 数：3

#### 4.1 抽取 `DiagramFrame`

**PR #1 · 新增 `ui/diagrams/DiagramFrame.tsx`**

- [ ] 职责：加载 skeleton、错误边界、标题栏、全屏按钮、主题 token 同步（消费 `theme/themeTokens.ts` 的 `diagram.*`）。
- [ ] 接口：`<DiagramFrame loading error onRetry title>{children}</DiagramFrame>`。
- [ ] `__tests__/DiagramFrame.browser.test.tsx`：加载 / 错误 / 正常三态截图。

#### 4.2 `MermaidDiagram` 瘦身

**PR #2 · 重构 `addons/builtin/mermaid/MermaidDiagram.tsx` 589 → ~220 行**

- [ ] 外壳交给 `DiagramFrame`；本文件只保留：
  - `mermaid.initialize` 调用（受主题 token 影响）
  - 源码渲染（含 `svg` DOM 注入、尺寸观察）
  - 错误解析（mermaid parse error → `error` 态）
- [ ] 抽一个内部 hook `useMermaidRenderer`（~100 行）。
- [ ] 添加 3 条 unit test：空源 / 正常 / parse error。

#### 4.3 `G2Chart` 瘦身

**PR #3 · 重构 `addons/builtin/g2/G2Chart.tsx` 445 → ~180 行**

- [ ] 外壳交给 `DiagramFrame`。
- [ ] 抽 `useG2Renderer`（~100 行）。
- [ ] Addon 注册机制：在 `addons/builtin/index.ts` 显式列出 Mermaid / G2 / Insight，保留 `import.meta.glob` 作为"第三方 addon 发现"通道，不强制两条路径并存。

#### 4.4 验收

- [ ] 两个 Diagram 组件行数 < 250
- [ ] `DiagramFrame` 被 2+ 处复用
- [ ] Addon 清单可在 devtools 直接 `console.log` 审阅

---

### Phase 5 · UI/UX 专项打磨

> 目标：让"重构后"肉眼可感。可与 Phase 2/3/4 部分并行，但视觉验收集中在本阶段。
> 工期：1-1.5 周 · PR 数：5-6

#### 5.1 信息层级重排

**PR #1 · StatusBar 三段式布局**

- [ ] `status/StatusBar.tsx` 改为 `grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]` 三段：
  - 左：当前上下文（slide index / title）
  - 中：播放控制（prev / next / timeline toggle）
  - 右：会话 + 设置（timer / record / notes / overview / shortcuts / details）
- [ ] `StatusBarDrawToolbar` 下沉为"浮层"：draw 启用时才渲染，脱离状态栏主行，避免拥挤。

**PR #2 · Presenter 主视图 12 栅格**

- [ ] `modes/PresenterMode.tsx` 主区域改为 `grid-cols-12`：
  - `col-span-7` 当前 slide
  - `col-span-5`：上半 `SidePreview`（下一张）+ 下半 `SpeakerNotes` + 底部 `FlowTimeline` 折叠入口
- [ ] 删除现有绝对定位与嵌套 flex；侧栏宽度可拖拽保留（`useSidebarWidth`）。

#### 5.2 动效

**PR #3 · 动效节奏统一**

- [ ] 全站 `duration-*` 硬编码改为 `ui/tokens/motion.ts` 常量（通过 Tailwind `@theme` 或内联 `style`）。
- [ ] `OverlayShell` 进入动效：`opacity 0→1` + `translateY 4px→0`，duration=base（180ms），easing=out。
- [ ] `ChromeIconButton` hover：duration=fast（120ms）。
- [ ] 模式切换：duration=slow（240ms），仅 opacity（避免 layout shift）。
- [ ] 全局 `prefers-reduced-motion: reduce` 下全部 duration=0。

#### 5.3 暗色等价

**PR #4 · 暗色模式审计**

- [ ] 将 UI 外壳中的 `bg-slate-50` / `bg-white/xx` / `text-slate-*` 改为语义类：
  - `bg-chrome-surface` / `bg-chrome-surface-raised` / `text-chrome-fg` / `text-chrome-fg-muted`
  - 定义在 `ui/tokens/chromeTokens.ts` + Tailwind v4 `@theme` 声明
- [ ] Moonlit 主题 dark 下视觉回归：每个 overlay / 状态栏 / presenter 主视图各截一张 light/dark 对照图放入 `docs/plans/ui-ux-audit.md`。

#### 5.4 键盘可达性

**PR #5 · Overlay 可达性**

- [ ] `OverlayShell` 打开时焦点自动进入首个交互元素；关闭时还原到触发元素。
- [ ] ESC 关闭；Tab 焦点陷阱。
- [ ] `aria-modal="true"` / `role="dialog"` / `aria-labelledby` 对齐到 `title` slot。
- [ ] `ShortcutsHelpOverlay` 作为 source-of-truth——快捷键表从 `navigation/keyboardShortcuts.ts` 声明式生成（含 Phase 1.5 合并后的 draw 键）。

#### 5.5 空态 / 错误态

**PR #6 · 空态收拢**

- [ ] 空演示（0 张 slide）：新增 `modes/PresentationEmptyState.tsx`，引导用户编辑 `slides.mdx`。
- [ ] `DiagramFrame` 错误态统一文案 + 重试按钮（Phase 4 已给出容器）。

#### 5.6 视觉验收清单（Phase 5 的 DoD）

- [ ] StatusBar light/dark 对照图
- [ ] PresenterMode light/dark 对照图
- [ ] 三 Overlay（Shortcuts / Quick / Notes）对照图
- [ ] 三个动效录屏（StatusBar toggle / 模式切换 / Overlay 进入）
- [ ] A11y：Overlay 焦点陷阱通过 axe / Playwright a11y 测试
- [ ] reduced-motion 下行为正确

---

## 5. 风险与回滚

| 风险 | 触发条件 | 应对 |
|---|---|---|
| 目录迁移破坏下游 | `examples/` / `slides.mdx` 引用了深路径（如 `@slidev-react/client/features/...`） | Phase 1 前 `grep -r '@slidev-react/client/'` + `grep -rn "from '\\.\\./\\.\\./features/presentation"` 全量审视；保留 `features/presentation/index.ts` 对外契约 |
| 截图测试大面积红 | 原语 + token 推行导致像素差 | 每 PR 单独提交截图更新；截图变更与代码变更**分拆 commit**，便于 CR |
| Context 化后性能回归 | `PresenterContext` 触发大面积重渲 | `useMemo` 冻结 value；必要时切三个粒度 context（flow / chrome / session） |
| 6 个 uncommitted 文件冲突 | Phase 1 目录迁移与 WIP 互搏 | Phase 0.5 已显式前置清理 |
| 重构期间无法 release | CHANGELOG 流程卡住 | 每 Phase 完结发 patch 版本；重大拆分仅内部改动，不破坏 export |
| Phase 1.5 键盘迁移遗漏快捷键 | 原 DrawProvider 覆盖了 Cmd+Z，全局 undo 冲突 | 单测覆盖 Cmd+Z 分流逻辑；手测一遍文本输入场景下的浏览器默认 |

回滚策略：每 Phase 落在独立分支，合并前跑 `pnpm lint && pnpm test && pnpm test:e2e && pnpm build` 全绿再合；合并后若上报异常，revert 该 Phase 合并提交即可。

---

## 6. 时间线

| Phase | 工期 | 关键产出 |
|---|---|---|
| 0 · 基线与护栏 | 0.5 周 | 2 份基线文档、5 条 Hook 单测、`ui/tokens/` 目录 |
| 1 · Presentation 重组 | 1.5 周 | 新目录、`PresentationStatus` 6 拆 1、`PresenterMode` 合并、`PresenterContext` |
| 1.5 · 键盘归一 | 0.5 周 | `DrawProvider` 不再监听 `window` |
| 2 · UI 原语 + Overlay | 1 周 | `ChromeButton` / `ChromeToggleGroup` / `OverlayShell` 铺开 |
| 3 · 状态治理 | 1 周 | `drawReducer` / `revealEngine` / `chrome` 三块拆分 + 单测 |
| 4 · Addon 瘦身 | 1 周 | `DiagramFrame`、Mermaid/G2 瘦身至 < 250 行 |
| 5 · UI/UX 打磨 | 1-1.5 周（可与 2/4 并行） | 信息层级 / 动效 / 暗色 / 可达性 / 空态 |
| **合计** | **5.5-6.5 周**（串行） / **4 周**（最大并行） | — |

---

## 7. 立即决策事项（交给决策者）

1. **WIP 处理**：当前 6 个 uncommitted 文件（`PresentationStatus` / `ShortcutsHelpOverlay` / 4 个 presenter panel）的处置方式？合入 `test/uat` 当前分支 / stash / 直接 drop？
2. **Phase 串并行**：同意 0 → 1 → 1.5 → 2‖5a → 3 → 4‖5b 的节奏吗？（2 与 5 可并行，4 与 5 后半段可并行）
3. **原语扩展 3 件套**：`ChromeButton` / `ChromeToggleGroup` / `OverlayShell` 是否全收？或只做 `OverlayShell` + `ChromeButton` 先行？
4. **Hook 命名改名范围**：是否接受"不保留别名、一次性全站替换"的激进做法？（符合 AGENTS.md §1.2）
5. **暗色模式目标**：仅 UI 外壳打平，还是连同所有 addon / theme 一起审计？（后者工期 +0.5 周）

确认后立即开工 Phase 0.1/0.2/0.3 三条可并行推进。
