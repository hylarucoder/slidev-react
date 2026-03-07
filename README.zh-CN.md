# slidev-react

一个以 React 为核心、使用 MDX 编写 deck 的演示文稿运行时，内置 presenter / viewer 模式，以及一套面向演示场景的交互能力。

[English README](./README.md)

## 项目简介

`slidev-react` 是一个实验性的幻灯片系统，核心由以下部分组成：

- React 19 渲染层
- MDX 内容编写格式
- Vite 应用运行时
- 位于 `src/deck` 下的编译期 deck 处理链路
- 支持 presenter/viewer 同步、渐进揭示、涂鸦和录制的演示壳层

这个仓库不是 Vue 版 Slidev 运行时，而是一套 React + MDX 的独立实现。它借鉴了一些开发者演示工具的思路，但使用的是自己的 deck 模型和渲染链路。

## 功能亮点

- 使用 [`slides.mdx`](./slides.mdx) 作为 deck 源文件
- 编译期解析 deck 并生成可运行的 deck artifact
- 内置多种布局：`default`、`center`、`cover`、`section`、`two-cols`、`image-right`、`statement`
- 提供 React 风格的 MDX 组件：`Badge`、`Callout`、`AnnotationMark`、`Reveal`、`RevealGroup`
- 原生支持 Mermaid 和 PlantUML 图表代码块
- 基于 KaTeX 的数学公式渲染
- 支持 presenter / viewer 路由和同步状态管理
- 基于 `BroadcastChannel` 的多标签页同步
- 基于 WebSocket relay 的可选跨设备同步
- 支持舞台涂鸦、光标同步、总览面板、浏览器录制，以及 print/PDF 导出

## 当前状态

项目目前仍处于 MVP / playground 阶段，API、编写约定和 deck 能力都还有继续演进的空间。

## 发布定位

这个仓库的定位是开源应用 / 运行时仓库，而不是 npm 包。`package.json` 保持 `"private": true`，用来避免误发布；当前推荐的使用方式仍然是直接拉源码、运行和二次开发。

## 快速开始

### 环境要求

- Node.js `>=22`
- Bun `1.3.3`

### 安装依赖

```bash
bun install
```

### 启动开发环境

```bash
bun run dev
```

### 构建生产产物

```bash
bun run build
```

### 预览构建结果

```bash
bun run preview
```

### 用 Playwright 导出演示产物

```bash
bun run export:deck
```

### 检查 deck 编写问题

```bash
bun run lint:deck
```

如果你想在 CI 里把 warning 也当失败处理，可以用 `bun run lint:deck -- --strict`。

它会把浏览器真实渲染后的产物写到 `output/export/<deck-name>/`：

- 整套 deck 的 `*.pdf`
- 每一页一张的 `png/*.png`

常见变体：

```bash
bun run export:deck:pdf
bun run export:deck:png
bun run export:deck -- --slides 3-7
bun run export:deck -- --with-clicks
bun run export:deck -- --base-url http://127.0.0.1:4173
```

### 清理生成产物

```bash
bun run clean
```

## 演示模式

先启动应用：

```bash
bun run dev
```

如果需要跨设备同步，可以额外启动 relay 服务：

```bash
bun run presentation:server
```

默认 relay 地址：`ws://localhost:4860/ws`

路由入口：

- Presenter：`http://localhost:5173/presenter/1`
- Viewer：`http://localhost:5173/1`

当前 presenter 壳层已支持：

- presenter / viewer 双角色
- 页码同步
- reveal 状态同步
- 光标同步
- 涂鸦同步
- 基于 `MediaRecorder` 的浏览器录制
- 基于浏览器打印能力的 print / PDF 导出
- 总览面板和 presenter 控制面板
- presenter 模式下的 wake lock、mirror stage 打开能力、fullscreen 切换、stage scale 和空闲隐藏光标设置
- `bun run lint:deck`，用于在构建前发现未知 theme、addon、layout 等编写问题

## Deck 编写方式

Deck 源文件位于 [`slides.mdx`](./slides.mdx)。

当前的核心编写规则：

- 用 `---` 分隔页面
- 用 frontmatter 描述 deck 或单页 metadata
- 用 MDX 编写页面内容
- 可以在 MDX 中直接使用仓库提供的 React 组件

目前支持的 frontmatter：

- Deck 级：`title`、`theme`、`addons`、`layout`、`background`、`transition`、`exportFilename`
- Slide 级：`title`、`layout`、`class`、`background`、`transition`、`clicks`、`notes`、`src`

补充说明：

- `layout:` 已经真实参与渲染
- `class:` 会挂到舞台的 article 容器上
- `background:` 支持颜色、渐变、CSS background 值，或裸写图片 URL
- `transition:` 当前支持 `fade`、`slide-left`、`slide-up`、`zoom`
- `exportFilename:` 可指定导出物和录制下载时优先使用的文件名前缀
- `addons:` 用来启用 `src/addons/*/index.ts` 中注册的本地 addon
- `clicks:` 可以显式声明这页的 reveal 步数，即使 `<Reveal />` 数量更少
- `notes:` 已可在 presenter 模式中展示，推荐配合 YAML 多行字符串使用
- `src:` 可按相对 `slides.mdx` 的路径载入单页外部文件
- `theme:` 现在会从 `src/theme/themes/*/index.ts` 载入本地运行时主题，找不到时回退到默认主题
- 非法 frontmatter 现在会尽量报到字段级别；编译期也会对未知本地 theme/addon 给出 warning

示例：

```mdx
---
title: Demo Deck
theme: paper
addons:
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

推荐的 `src` 写法：

```mdx
---
title: Imported Slide
layout: cover
src: ./slides/imported-intro.mdx
notes: |
  包装层 metadata 留在这里。
  真正的 slide body 放到外部文件里。
---
```

当使用 `src:` 时，同一个 slide block 里不要再写 inline 正文内容。

当前如果要导出 deck，可以直接在 presenter 壳层里使用 `Print / PDF` 按钮、在当前 URL 后加上 `?export=print` 走浏览器打印，或者运行 `bun run export:deck`，由 Playwright 直接产出 PDF 和 PNG。

## 本地主题

当前内置的非默认示例主题是 `paper`：

```mdx
---
title: Client Review
theme: paper
---
```

本地主题放在 `src/theme/themes/<theme-id>/` 下，只要在 `index.ts` 里导出 `theme`，运行时就会自动发现。

当前的主题 contract 包括：

- `rootAttributes` 和 `rootClassName`：给文档根节点挂 token 或选择器
- `layouts`：覆盖或扩展 slide layout
- `mdxComponents`：覆盖 `Badge` 这类 MDX helper
- `provider`：在需要时注入主题级 React context

放在 `src/theme/themes/<theme-id>/style.css` 的主题样式也会自动加载。如果请求的主题不存在，运行时会安全回退到默认主题。

## 本地 Addons

Deck 可以通过 frontmatter 启用本地 addon：

```mdx
---
title: QBR Review
addons:
  - insight
---
```

本地 addon 放在 `src/addons/<addon-id>/` 下，只要在 `index.ts` 里导出 `addon`，运行时就会自动发现。

当前的 addon contract 包括：

- `layouts`：新增或覆盖 layout 名称，包括像 `spotlight` 这样的自定义 layout
- `mdxComponents`：新增像 `Insight` 这样的 MDX helper
- `provider`：给运行时树包一层 addon 自己的 React context 或副作用

当前内置的示例 addon 是 `insight`，它提供了 `spotlight` layout 和 `Insight` MDX 组件：

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

放在 `src/addons/<addon-id>/style.css` 的 addon 样式也会自动加载。当前如果 deck 请求了未知 addon，运行时会先忽略它，保证启动安全；这也意味着 addon API 现在仍属于早期实验态。

## MDX 辅助组件

当前暴露给 MDX 的常见组件包括：

- `Badge`
- `Callout`
- `AnnotationMark`
- `CourseCover`
- `MagicMoveDemo`
- `MinimaxReactVisualizer`
- `Reveal`
- `RevealGroup`
- `MermaidDiagram`
- `PlantUmlDiagram`

`AnnotationMark` 示例：

```mdx
<AnnotationMark>默认高亮</AnnotationMark>
<AnnotationMark type="underline">关键观点</AnnotationMark>
<AnnotationMark type="box" color="#2563eb">
  API 边界
</AnnotationMark>
<AnnotationMark type="bracket" brackets={["left", "right"]}>
  聚焦区域
</AnnotationMark>
```

## 项目结构

[`src/`](./src) 下的主要目录分工如下：

- `app/`：应用装配层、provider 组合、入口编排
- `deck/`：deck 解析、frontmatter 处理、MDX 编译、生成物构建
- `features/`：reveal、presenter、sync、draw、navigation 等产品能力
- `features/player/`：舞台渲染和舞台交互
- `addons/`：本地运行时扩展层，可挂 layout、MDX helper 和 provider
- `ui/`：可复用展示组件和 MDX helper
- `theme/`：布局与视觉 token

更详细的内部结构说明见 [`src/README.md`](./src/README.md)。

## 脚本

- `bun run clean`：清理 `dist/`、`.generated/`、`output/` 等生成产物
- `bun run dev`：启动开发服务器
- `bun run build`：构建应用
- `bun run preview`：预览生产构建
- `bun run presentation:server`：启动 WebSocket relay 服务
- `bun run test`：运行 Vitest 测试
- `bun run test:e2e`：运行 Playwright 端到端测试
- `bun run test:e2e:headed`：以可见浏览器运行 Playwright 测试
- `bun run test:e2e:install`：安装 Playwright 使用的 Chromium 浏览器
- `bun run lint`：使用支持 type-aware 的 Oxlint 检查 `src/`
- `bun run format`：使用 Oxfmt 格式化仓库
- `bun run format:check`：使用 Oxfmt 检查仓库格式

## 构建产物管理

构建产物应视为一次性输出，不应提交进仓库。当前约定如下：

- `dist/`：生产构建输出
- `.generated/`：编译期 deck 生成物
- `output/`：运行时生成输出

如果这些文件不是你改动的一部分，提交前请用 `bun run clean` 清掉。

## 测试

运行测试：

```bash
bun run test
```

## 致谢

这个项目受到 [Slidev](https://github.com/slidevjs/slidev) 的启发。项目早期也迁移过一部分 Slidev starter deck 内容，并在此基础上逐步改造成当前这套 React + MDX 运行时。

## 许可证

[MIT](./LICENSE)
