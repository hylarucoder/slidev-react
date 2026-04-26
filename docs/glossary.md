# Glossary

slidev-react 项目术语表。按字母顺序排列，附带中文说明和源码出处。

---

## A

### Addon

可选的功能扩展插件。通过 deck 顶级 frontmatter `addons: [...]` 声明启用。每个 addon 可以注入 MDX 组件、自定义 Layout、Provider 和样式。

- 内置 addon：`mermaid`（Mermaid 图表）、`g2`（G2 数据可视化）、`insight`（Spotlight 布局）
- 定义：`SlideAddonDefinition`（`packages/client/src/addons/types.ts`）
- 发现机制：`import.meta.glob` 自动扫描 `packages/client/src/addons/*/index.ts`

### Annotate

基于 rough-notation 的注解组件，支持 `highlight`、`underline`、`box`、`bracket` 四种类型。在 MDX 中用 `<Annotate>` 标签调用。

### Aspect Ratio (ar)

Slides 的宽高比，格式为 `"width/height"`（如 `"16/9"`、`"3/4"`）。定义在 deck 级 frontmatter 中，影响 Stage 和导出的尺寸。默认值 `16/9`，对应 viewport `1920×1080`。

---

## B

### BroadcastChannel

浏览器原生 API。用于同一设备多 tab 之间的 Presenter ↔ Viewer 状态同步（页码、step、光标、画笔）。

### Build Artifacts

编译和导出过程中产生的临时文件，不应提交到 Git：

| 目录          | 内容                       |
| ------------- | -------------------------- |
| `dist/`       | 生产构建产物               |
| `.generated/` | 编译期 slides artifacts    |
| `output/`     | 导出文件（PDF、PNG、录屏） |

---

## C

### Changesets

版本管理工具。用于多包 monorepo 的版本号管理和 changelog 生成。

### Clicks

作者 API。slide frontmatter 里的 `clicks` 字段，用于**显式指定**该 slide 的 reveal 步骤数。保留此名以和 Slidev 生态约定一致。运行时一侧统一叫 **Step**。

### Compiled Slides

编译期产物。Node 侧解析 `slides.mdx` 后生成的结构化 slides 数据，包含每张 slide 的 meta、source 和编译后的 React 组件。

### Core (`@slidev-react/core`)

纯模型层包。包含 slide 定义、flow 导航逻辑、session 协议和 theme 类型契约。**不含任何 React 运行时依赖。**

### Cue

~~（旧术语，已废弃 2026-04-24）统一到 **Step**。~~ 见下方 Step 条目。

---

## D

### Deck

一份完整的演示文稿。对应一个 `slides.mdx` 文件解析后的全部 slides 集合及其全局配置（title、theme、addons、transition 等）。

### Drawing / Draw Stroke

舞台画笔功能。Presenter 可以在 slide 上绘制笔画（pen / circle / rectangle），笔画通过 sync 协议同步到 Viewer。

- `PresentationDrawStroke`：单条笔画数据
- `PresentationDrawingsState`：按 slide 分组的笔画状态

---

## E

### Envelope

Session sync 协议中的 **消息信封**。每条消息都封装在 `PresentationEnvelope` 中，包含版本号、sessionId、senderId、序列号和时间戳。

消息类型：

| type             | 用途         |
| ---------------- | ------------ |
| `session/join`   | 加入会话     |
| `session/leave`  | 离开会话     |
| `state/snapshot` | 全量状态快照 |
| `state/patch`    | 增量状态更新 |
| `heartbeat`      | 心跳保活     |

### Export

将 slides 导出为 PDF 或 PNG 文件。通过 Playwright 驱动无头浏览器截图实现。

---

## F

### Flow (Reveal Flow)

slides 的播放流程模型。Flow 控制页面间的 advance/retreat 导航和页面内 step 的推进/回退。

- `resolveAdvanceFlow()`：前进逻辑
- `resolveRetreatFlow()`：后退逻辑

### Frontmatter

MDX 文件顶部的 YAML 元数据块，用 `---` 包围。分为两级：

- **Deck 级**（第一个 slide block）：`title`、`theme`、`addons`、`transition`、`exportFilename` 等
- **Slide 级**（每张 slide）：`title`、`layout`、`class`、`background`、`clicks`、`notes` 等

---

## G

### G2 Chart

基于 AntV G2 的数据可视化组件，通过 `g2` addon 提供。在 MDX 中用 `<Chart>` 标签调用，接受 G2 Specification 作为配置。

---

## L

### Layout

Slide 的布局模板。决定内容在舞台上的排列方式。

内置 layout：

| 名称          | 说明                             |
| ------------- | -------------------------------- |
| `default`     | 默认布局                         |
| `center`      | 居中布局                         |
| `cover`       | 封面布局                         |
| `section`     | 分节页布局                       |
| `immersive`   | 沉浸式布局                       |
| `two-cols`    | 双栏布局（用 `<hr />` 分隔左右） |
| `image-right` | 右侧图片布局                     |
| `statement`   | 声明式布局                       |

Theme 和 addon 可以 **覆盖或扩展** layout（如 insight addon 的 `spotlight` layout）。

### Layout Registry

Layout 名称到 React 组件的映射表。类型为 `Partial<Record<LayoutName, LayoutComponent>>`。Theme 和 addon 各自提供自己的 registry，运行时合并。

---

## M

### MDX

Markdown + JSX 的混合格式。项目使用 MDX 作为 slides 的编写语言，支持在 markdown 中直接嵌入 React 组件。

### MDX Components

注入到 MDX 渲染上下文中的 React 组件。在 MDX 文件中可以直接使用标签调用（如 `<Badge>`、`<Callout>`）。组件来源：

1. **核心组件**（始终可用）：`Badge`、`Callout`、`Step`、`Steps`、`Annotate`、`CodeMagicMove` 等
2. **Theme 组件**：theme 通过 `mdxComponents` 字段覆盖
3. **Addon 组件**：addon 通过 `mdxComponents` 字段注入

### Mermaid Diagram

基于 Mermaid.js 的图表组件，通过 `mermaid` addon 提供。支持在 MDX 中用 `<MermaidDiagram>` 标签或 code fence 语法渲染。

### Monorepo

pnpm workspace 管理的多包仓库结构。

| 包                          | 路径                   | 职责         |
| --------------------------- | ---------------------- | ------------ |
| `@slidev-react/core`        | `packages/core`        | 纯模型层     |
| `@slidev-react/client`      | `packages/client`      | React UI 层  |
| `@slidev-react/node`        | `packages/node`        | Node 工具层  |
| `@slidev-react/cli`         | `packages/cli`         | 命令行入口   |
| `@slidev-react/theme-paper` | `packages/theme-paper` | Paper 主题包 |

---

## N

### Navigation

Slide 间的导航逻辑。核心函数：

- `resolveAdvanceFlow()`：计算「下一步」的目标（下一个 step 或下一页）
- `resolveRetreatFlow()`：计算「上一步」的目标（上一个 step 或上一页）
- `canAdvanceFlow()` / `canRetreatFlow()`：边界判断

### Notes

演讲者备注。通过 slide frontmatter `notes` 字段设置，在 Presenter 视图中显示，不在 Viewer 中出现。

---

## P

### Page / PageIndex

Slide 的页码。`pageIndex` 从 0 开始，URL 中的页码从 1 开始（`/1`、`/2`）。

### Presenter

演讲者角色/视图。在 `/presenter/:page` 路由下。拥有完整控制权，可以操作翻页、画笔、计时器，并将状态广播给 Viewer。

### Presenter Shell

演讲者界面外壳。包含：演讲者/观众同步、浏览器录屏、打印导出、快速概览、全屏切换、Wake Lock 等功能。

### Provider

React Context Provider 模式。Theme 和 addon 都可以通过 `provider` 字段包裹整个运行时树，注入全局状态或副作用。

---

## R

### Relay Server

WebSocket 中继服务器，用于 **跨设备** 的 Presenter ↔ Viewer 同步。默认端口 `4860`，endpoint `ws://localhost:4860/ws`。

通过 `pnpm presentation:server` 启动。

### Step

Reveal flow 中的一个**触发步骤**。一张 slide 可以有 0 到多个 step。Step 总数由 frontmatter `clicks` 字段和实际检测到的 `<Step>` 数量取较大值决定。

- `stepIndex` / `currentStep`：当前 step 位置（0 = 初始态，无内容被展示）
- `stepTotal` / `currentStepTotal`：该 slide 的 step 上限
- 使用 `<Step step={n}>` 标签包裹需要按顺序显示的内容，`n` 对应 stepIndex
- step 负责导航语义；具体的 reveal/transition 动画由客户端 scene driver 解释

### Steps

自动编号的 Step 容器。内部的 `<Step>` 子元素会被自动分配递增的 step 值。

### Role

演示会话中的角色。

| 角色         | 说明                 |
| ------------ | -------------------- |
| `standalone` | 独立模式，不参与同步 |
| `presenter`  | 演讲者，发送状态     |
| `viewer`     | 观众，接收状态       |

---

## S

### Session

一次演示会话。通过 `sessionId` 标识。Presenter 和 Viewer 通过 BroadcastChannel（同设备）或 WebSocket relay（跨设备）共享状态。

### Shared State

会话中同步的共享状态（`PresentationSharedState`）：

| 字段        | 说明                    |
| ----------- | ----------------------- |
| `page`      | 当前页码                |
| `step`      | 当前 step 位置          |
| `stepTotal` | 当前 slide 的 step 总数 |
| `timer`     | 计时器                  |
| `cursor`    | 光标位置                |
| `drawings`  | 画笔数据                |

### Slide

演示文稿中的一页。在 `slides.mdx` 中用 `---` 分隔。每张 slide 有自己的 `SlideMeta`（frontmatter 元数据）和编译后的 React 组件。

### SlideUnit

Slide 的结构化数据模型：`id`、`index`、`meta`（SlideMeta）、`source`（原始 MDX 文本）、`hasInlineSource`（是否内联内容）。

### Slides Pipeline

Node 侧的编译管线。负责解析 `slides.mdx`、提取 frontmatter、编译 MDX 为 React 组件、校验配置、生成 `.generated/` 产物。位于 `packages/node/src/slides/`。

### Stage

Slide 的渲染舞台区域。Stage 有固定的 viewport 尺寸（默认 1920×1080），通过 CSS `transform: scale()` 适配实际屏幕大小。

### Sync Mode

同步方向控制：

| 模式      | 说明     |
| --------- | -------- |
| `send`    | 只发送   |
| `receive` | 只接收   |
| `both`    | 双向     |
| `off`     | 关闭同步 |

---

## T

### Theme

视觉主题插件。通过 deck frontmatter `theme: <id>` 指定。主题包导出 `SlideThemeDefinition`，可以：

- 提供 `tokens` 作为字体、配色和 addon 主题的唯一真源
- 设置 `rootAttributes` / `rootClassName`（文档级 CSS token）
- 覆盖/扩展 `layouts`
- 覆盖 `mdxComponents`
- 提供 `provider`
- 自带 `style.css`

内置主题：`default`（默认）、`paper`（`@slidev-react/theme-paper`）。

### Transition

Slide 切换时的过渡动画。

内置 transition：`fade`、`slide-left`、`slide-up`、`zoom`。

可在 deck 级设置默认值，也可在单张 slide 级覆盖。

---

## V

### Viewer

观众角色/视图。在 `/:page` 路由下。接收 Presenter 广播的状态，跟随翻页和 reveal 步骤。

### Viewport

Slides 的虚拟画布尺寸。由 `ar`（宽高比）推算，长边固定为 1920px。默认 viewport 为 `1920×1080`。

---

## W

### Wake Lock

浏览器 Screen Wake Lock API。Presenter shell 中开启后可防止屏幕在演示过程中自动熄灭。
