# slidev-react

一个以 React 为核心、使用 MDX 编写 deck 的演示文稿运行时，内置 presenter / viewer 模式，以及一套面向演示场景的交互能力。

[English README](./README.md)

## 项目简介

`slidev-react` 是一个实验性的幻灯片系统，核心由以下部分组成：

- React 19 渲染层
- MDX 内容编写格式
- Rsbuild / Rspack 应用运行时
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
- 支持舞台涂鸦、光标同步、总览面板和浏览器录制

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

- Presenter：`http://localhost:3000/presenter/1`
- Viewer：`http://localhost:3000/1`

当前 presenter 壳层已支持：

- presenter / viewer 双角色
- 页码同步
- reveal 状态同步
- 光标同步
- 涂鸦同步
- 基于 `MediaRecorder` 的浏览器录制
- 总览面板和 presenter 控制面板

## Deck 编写方式

Deck 源文件位于 [`slides.mdx`](./slides.mdx)。

当前的核心编写规则：

- 用 `---` 分隔页面
- 用 frontmatter 描述 deck 或单页 metadata
- 用 MDX 编写页面内容
- 可以在 MDX 中直接使用仓库提供的 React 组件

目前支持的 frontmatter：

- Deck 级：`title`、`theme`、`layout`
- Slide 级：`title`、`layout`、`class`

补充说明：

- `layout:` 已经真实参与渲染
- `class:` 会挂到舞台的 article 容器上
- `theme:` 当前只会被解析成 metadata，还没有真正接入运行时主题切换

示例：

```mdx
---
title: Demo Deck
layout: default
---

---
title: Compare
layout: two-cols
class: px-20
---

# 左栏

<hr />

# 右栏

<Reveal step={1}>
  <Callout title="Tip">这段内容会在点击后出现。</Callout>
</Reveal>
```

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
<AnnotationMark type="box" color="#2563eb">API 边界</AnnotationMark>
<AnnotationMark type="bracket" brackets={['left', 'right']}>聚焦区域</AnnotationMark>
```

## 项目结构

[`src/`](./src) 下的主要目录分工如下：

- `app/`：应用装配层、provider 组合、入口编排
- `deck/`：deck 解析、frontmatter 处理、MDX 编译、生成物构建
- `features/`：reveal、presenter、sync、draw、navigation 等产品能力
- `features/player/`：舞台渲染和舞台交互
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
- `bun run lint`：使用 Oxlint 检查 `src/`

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
