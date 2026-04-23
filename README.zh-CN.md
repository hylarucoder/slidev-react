# slidev-react

一个以 React 为核心、使用 MDX 编写 slides 的演示文稿运行时，内置 presenter / viewer 模式，以及一套面向演示场景的交互能力。

[English README](./README.md)

## 项目简介

`slidev-react` 是一套幻灯片系统，核心由以下部分组成：

- **React 19** 渲染层
- **MDX** 内容编写格式
- **Vite** 应用运行时
- 位于 `packages/node/src/slides` 下的编译期 slides 处理链路
- 支持 presenter/viewer 同步、渐进揭示、涂鸦和录制的演示壳层

> 灵感来自 [Slidev](https://github.com/slidevjs/slidev)，但这是一套独立的 React + MDX 运行时，拥有自己的 slides 模型和渲染链路，并非 Vue Slidev 的移植。

## 功能亮点

- 使用 [`slides.mdx`](./slides.mdx) 作为 slides 源文件
- 编译期解析 slides 并生成可运行的 slides artifact
- 内置多种布局：`default`、`center`、`cover`、`section`、`two-cols`、`image-right`、`statement`
- React 风格的 MDX 组件：`Badge`、`Callout`、`Annotate`、`Reveal`、`RevealGroup` 等
- 支持 Mermaid、G2 图表（通过 addon 启用）
- 基于 KaTeX 的数学公式渲染
- 支持 presenter / viewer 路由和同步状态管理
- 基于 `BroadcastChannel` 的多标签页同步
- 基于 WebSocket relay 的可选跨设备同步
- 舞台涂鸦、光标同步、总览面板、浏览器录制、print/PDF 导出

## 当前状态

项目处于活跃开发中。核心功能（MDX 编写、布局、reveal 流程、presenter 同步、导出）已可用且有测试覆盖。Addon 和 Theme 插件 API 仍在演进中，可能会有变化。

## Monorepo 结构

这是一个 pnpm workspace monorepo，包含以下包：

| 包名                        | 路径                   | 说明                                     |
| --------------------------- | ---------------------- | ---------------------------------------- |
| `create-slidev-react`       | `packages/create-app`  | starter app 脚手架与推荐入口             |
| `@slidev-react/core`        | `packages/core`        | 纯演示模型、flow 逻辑、共享契约          |
| `@slidev-react/client`      | `packages/client`      | React 应用装配、UI、主题、addons         |
| `@slidev-react/node`        | `packages/node`        | Node 侧 dev/build/export/lint 入口和服务 |
| `@slidev-react/cli`         | `packages/cli`         | 模板项目 scripts 背后的底层命令层        |
| `@slidev-react/theme-absolutely` | `packages/theme-absolutely` | "absolutely" 主题包                |
| `@slidev-react/theme-paper` | `packages/theme-paper` | "paper" 主题包                           |

根目录 `package.json` 设为 `private: true`，承载 Vite 开发服务器和顶层脚本。`packages/` 下的可发布子包通过 [Changesets](https://github.com/changesets/changesets) 统一发布到 npm。

## 快速开始

### 环境要求

- Node.js `>=22`
- pnpm `10`

### 创建一个 deck app

```bash
npm create slidev-react@latest my-deck
cd my-deck
pnpm install
pnpm dev
```

打开 Viewer：`http://localhost:5173/1`，或 Presenter：`http://localhost:5173/presenter/1`。

生成出来的 app 默认包含：

- 一个最小可跑的 `slides.mdx`
- 内置的 `moonlit` 主题
- 内置 `g2 + mermaid` 示例
- `pnpm dev`、`pnpm build`、`pnpm export`、`pnpm lint` scripts

### 开发当前 monorepo

如果你要改的是这个仓库本身，而不是创建 deck 项目：

```bash
pnpm install
pnpm dev
```

## 脚本

| 命令                       | 说明                                              |
| -------------------------- | ------------------------------------------------- |
| `pnpm dev`                 | 启动 Vite 开发服务器                              |
| `pnpm build`               | 构建生产产物                                      |
| `pnpm preview`             | 预览生产构建                                      |
| `pnpm clean`               | 清理 `dist/`、`.generated/`、`output/`            |
| `pnpm presentation:server` | 启动 WebSocket relay 服务（跨设备同步）           |
| `pnpm test`                | 运行 Vitest 测试                                  |
| `pnpm test:e2e`            | 运行 Playwright 端到端测试                        |
| `pnpm test:e2e:headed`     | 以可见浏览器运行 Playwright 测试                  |
| `pnpm test:e2e:install`    | 安装 Playwright 使用的 Chromium                   |
| `pnpm lint`                | 运行 type-aware Oxlint 检查                       |
| `pnpm lint:slides`         | 检查 slides 编写问题（未知 theme、addon、layout） |
| `pnpm format`              | 用 Oxfmt 格式化仓库                               |
| `pnpm format:check`        | 用 Oxfmt 检查格式                                 |

在 CI 中可以用 `pnpm lint:slides -- --strict` 把 warning 也当失败处理。

### Slides 导出

通过 Playwright 导出 slides 为 PDF 或 PNG：

```bash
pnpm export:slides              # PDF + PNG
pnpm export:slides:pdf           # 仅 PDF
pnpm export:slides:png           # 仅 PNG
pnpm export:slides -- --slides 3-7
pnpm export:slides -- --with-clicks
pnpm export:slides -- --base-url http://127.0.0.1:4173
```

产物输出到 `output/export/<slides-name>/`。也可以在 presenter 壳层中使用 `Print / PDF` 按钮，或在 URL 后加 `?export=print` 走浏览器打印。

## 演示模式

用 `pnpm dev` 启动应用后，可选启动 relay 服务用于跨设备同步：

```bash
pnpm presentation:server
```

默认 relay 地址：`ws://localhost:4860/ws`

路由入口：

- Presenter：`http://localhost:5173/presenter/1`
- Viewer：`http://localhost:5173/1`

Presenter 壳层已支持：

- presenter / viewer 双角色，页码、reveal 状态、光标、涂鸦全同步
- 基于 `MediaRecorder` 的浏览器录制
- print-ready slides 导出
- 总览面板和 presenter 控制面板
- presenter 模式下的 wake lock、mirror stage、fullscreen 切换、stage scale、空闲隐藏光标

## Slides 编写方式

Slides 源文件位于 [`slides.mdx`](./slides.mdx)。

核心编写规则：

- 用 `---` 分隔页面
- 用 frontmatter 描述 slides 级或单页 metadata
- 用 MDX 编写页面内容
- 可以在 MDX 中直接使用仓库提供的 React 组件

### Frontmatter 参考

**Slides 级**（第一个 slide block）：

| 字段             | 说明                                               |
| ---------------- | -------------------------------------------------- |
| `title`          | 演示文稿标题                                       |
| `theme`          | 主题 id（如 `paper`），找不到时回退到 `default`    |
| `addons`         | 要启用的 addon 列表（如 `[mermaid, g2, insight]`） |
| `layout`         | 所有页面的默认布局                                 |
| `background`     | 默认背景（颜色、渐变或图片 URL）                   |
| `transition`     | 默认转场：`fade`、`slide-left`、`slide-up`、`zoom` |
| `exportFilename` | 导出文件和录制下载的文件名前缀                     |

**Slide 级**：

| 字段         | 说明                                               |
| ------------ | -------------------------------------------------- |
| `title`      | 页面标题                                           |
| `layout`     | 本页布局覆盖                                       |
| `class`      | CSS class，挂到舞台的 article 容器上               |
| `background` | 颜色、渐变、CSS background 值，或裸写图片 URL      |
| `transition` | 本页转场覆盖                                       |
| `clicks`     | 显式声明 reveal 步数（即使 `<Reveal />` 数量更少） |
| `notes`      | Presenter 笔记（推荐配合 YAML 多行字符串使用）     |
| `src`        | 按相对 `slides.mdx` 的路径载入单页外部文件         |

非法 frontmatter 会报到字段级别，编译期也会对未知 theme/addon 给出 warning。

### 示例

```mdx
---
title: Demo Slides
theme: paper
addons:
  - mermaid
  - g2
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
先讲取舍，不要先讲实现。
图表讲完停半秒，再切到 API 边界。

---

# 左栏

<hr />

# 右栏

<Reveal step={1}>
  <Callout title="Tip">这段内容会在点击后出现。</Callout>
</Reveal>
```

当使用 `src:` 时，把 slide body 放到外部文件里，同一个 block 里不要再写 inline 正文。

## 主题

在 slides-level frontmatter 中设置主题：

```mdx
---
title: Client Review
theme: moonlit
---
```

主题现在有两类来源：

- 由 `@slidev-react/client` 内置提供的主题，例如 **moonlit**
- 通过包分发的外部主题，例如 `@slidev-react/theme-paper` 和 `@slidev-react/theme-absolutely`

主题包从入口文件导出 `SlideThemeDefinition`，支持以下能力：

- `tokens` — 主题字体、UI 颜色、图表颜色、图示颜色、addon 颜色的唯一真源
- `rootAttributes` 和 `rootClassName` — 文档根节点的 token 或选择器
- `layouts` — 覆盖或扩展 slide layout
- `mdxComponents` — 覆盖 `Badge` 等 MDX helper
- `provider` — 注入主题级 React context

内置主题和外部主题的 CSS 文件（如 `style.css`）都会自动加载。运行时会根据 `tokens` 派生 CSS custom properties，所以 CSS 是 token 的消费层，而不是主题真源。如果请求的主题不存在，运行时会安全回退到默认主题。

## Addons

Slides 通过 frontmatter 启用 addon：

```mdx
---
addons:
  - mermaid
  - g2
  - insight
---
```

Addon 放在 `packages/client/src/addons/<addon-id>/` 下，只要在 `index.ts` 里导出 `addon`，运行时就会自动发现。

### 可用 Addons

| Addon     | 提供的组件                    | 说明                          |
| --------- | ----------------------------- | ----------------------------- |
| `mermaid` | `MermaidDiagram`              | Mermaid 图表渲染              |
| `g2`      | `Chart`                       | G2 数据可视化图表             |
| `insight` | `Insight`、`spotlight` layout | Insight 组件和 spotlight 布局 |

### Addon 契约

- `layouts` — 新增或覆盖 layout
- `mdxComponents` — 新增 MDX helper
- `provider` — 给运行时树包一层 addon 自己的 React context 或副作用

Addon CSS 文件放在 `packages/client/src/addons/<addon-id>/style.css` 会自动加载。未知 addon id 会被忽略，保证启动安全。

### 示例

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

## MDX 辅助组件

### 核心组件（始终可用）

| 组件                     | 说明                                                  |
| ------------------------ | ----------------------------------------------------- |
| `Badge`                  | 行内标签                                              |
| `Callout`                | 带标题的提示块                                        |
| `Annotate`               | rough-notation 风格的标注（高亮、下划线、方框、括号） |
| `CourseCover`            | 课程封面辅助组件                                      |
| `MagicMoveDemo`          | Shiki Magic Move 代码动画                             |
| `MinimaxReactVisualizer` | Minimax 博弈树可视化                                  |
| `Reveal`                 | 基于步骤的渐进揭示                                    |
| `RevealGroup`            | 自动编号的 reveal 容器                                |

### 由 Addon 提供

| 组件             | 所属 Addon | 说明           |
| ---------------- | ---------- | -------------- |
| `MermaidDiagram` | `mermaid`  | Mermaid 图表   |
| `Chart`          | `g2`       | G2 数据图表    |
| `Insight`        | `insight`  | Insight 提示块 |

`Annotate` 示例：

```mdx
<Annotate>默认高亮</Annotate>
<Annotate type="underline">关键观点</Annotate>
<Annotate type="box" color="#2563eb">
  API 边界
</Annotate>
<Annotate type="bracket" brackets={["left", "right"]}>
  聚焦区域
</Annotate>
```

## 项目结构

```
packages/
  create-app/   → create-slidev-react     — starter app 脚手架
  core/         → @slidev-react/core     — 模型、flow、共享契约
  client/       → @slidev-react/client   — React 应用、UI、主题、addons
    src/
      addons/   — addon 定义（mermaid, g2, insight）
      app/      — 应用装配层、provider 组合、入口编排
      features/ — 产品能力（reveal、presenter、sync、draw、navigation）
      theme/    — 主题注册、布局、视觉 token
      ui/       — 可复用展示组件和 MDX helper
  node/         → @slidev-react/node     — dev/build/export/lint
  cli/          → @slidev-react/cli      — 底层命令执行层
  theme-absolutely/ → @slidev-react/theme-absolutely — "absolutely" 主题
  theme-paper/  → @slidev-react/theme-paper — "paper" 主题
```

更详细的内部结构说明见 [`packages/client/README.md`](./packages/client/README.md) 和 [`packages/node/README.md`](./packages/node/README.md)。

## 构建产物管理

构建产物应视为一次性输出，不应提交进仓库：

- `dist/` — 生产构建输出
- `.generated/` — 编译期 slides 生成物
- `output/` — 运行时生成输出（导出、录制）

用 `pnpm clean` 清理所有生成文件。

## 测试

```bash
pnpm test        # Vitest 单元/集成测试
pnpm test:e2e    # Playwright 端到端测试
```

## 贡献

欢迎贡献！欢迎提交 Pull Request。

## 更新日志

详见 [CHANGELOG](./CHANGELOG.md)。

## 致谢

这个项目受到 [Slidev](https://github.com/slidevjs/slidev) 的启发。项目早期也迁移过一部分 Slidev starter deck 内容，并在此基础上逐步改造成当前这套 React + MDX 运行时。

## 许可证

[MIT](./LICENSE)
