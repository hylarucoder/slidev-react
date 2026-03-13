# Addon 插件化设计

## 现状

### 当前 Addon 系统

Addon 已经有一套可用的运行时机制：

```
packages/client/src/addons/
├── AddonProvider.tsx          ← Context 层，按 addonIds 解析
├── registry.ts                ← import.meta.glob 自动发现
├── types.ts                   ← SlideAddonDefinition
└── insight/                   ← 唯一的内置 addon
    ├── index.ts
    ├── InsightAddonProvider.tsx
    ├── SpotlightLayout.tsx
    ├── Insight.tsx
    └── style.css
```

`SlideAddonDefinition` 目前支持：

| 能力 | 字段 | 说明 |
|------|------|------|
| MDX 组件注入 | `mdxComponents` | 在 MDX 里可直接用 `<Insight />` |
| 自定义 Layout | `layouts` | 如 `spotlight` |
| Provider 包裹 | `provider` | 注入全局状态、副作用 |
| 样式 | `style.css`（约定） | `import.meta.glob("./*/style.css")` 自动加载 |

Addon 和 theme 一样是 **deck 级全局** 的 — 在 deck 顶级 frontmatter 里声明 `addons: ["insight"]`，`App.tsx` 用 `<AddonProvider addonIds={slidesDocument.meta.addons}>` 包裹整个 deck。

### 当前图表/图形组件

三个 diagram 组件直接硬编码在 `ui/mdx/index.ts` 作为基础 MDX 组件：

| 组件 | 依赖 | 体积影响 |
|------|------|---------|
| `MermaidDiagram` | `mermaid` | **~2.5 MB** gzipped，非常重 |
| `Chart`（G2） | `@antv/g2` + `@antv/g-svg` | **~800 KB** gzipped |
| `PlantUmlDiagram` | `plantuml-encoder`（轻量） | 几 KB，实际渲染走远程服务 |

这些组件目前 **所有 deck 都会加载**，不管你用不用。

---

## 问题

1. **体积**：`mermaid` + `@antv/g2` 合计 ~3.3 MB gzipped，对不用图表的 deck 白白增加 bundle
2. **耦合**：图表组件和基础 MDX 组件（`Badge`、`Callout`、`Reveal`）混在一起，职责边界模糊
3. **扩展性**：想加新图表库（ECharts、D3、Recharts）没有清晰的接入口

---

## 方案对比

### 方案 A：一个 `charts` addon 包含所有图表

```
addons/charts/
├── index.ts          → addon 定义
├── style.css
├── G2Chart.tsx
├── MermaidDiagram.tsx
└── PlantUmlDiagram.tsx
```

Deck frontmatter：

```yaml
---
addons: ["charts"]
---
```

**优点**：
- 简单，一个 addon 搞定
- 只在用到图表的 slide 才激活
- 用户心智低：「要图？加 charts」

**缺点**：
- mermaid 和 G2 都打进一个 chunk，体积还是大
- 不用 G2 的人被迫加载 mermaid，反之亦然
- Addon 粒度太粗

### 方案 B：按图表库拆成独立 addon

```
addons/mermaid/       → MermaidDiagram
addons/g2/            → Chart (G2)
addons/plantuml/      → PlantUmlDiagram
```

Deck frontmatter：

```yaml
---
addons: ["mermaid", "g2"]
---
```

**优点**：
- 最细粒度，按需加载
- 互不影响，独立升级
- 能很自然地扩展（加 `addons/echarts/` 就行）

**缺点**：
- 用户需要知道具体 addon 名
- frontmatter 写得多（但可以在 deck 级 frontmatter 全局声明）

### 方案 C：保留为核心组件，用 dynamic import 懒加载

不做 addon 拆分，但改成 `React.lazy()` + `Suspense`：

```tsx
const MermaidDiagram = lazy(() => import('../diagrams/MermaidDiagram'))
```

**优点**：
- 零改动心智，不需要 addon frontmatter
- 自动 code splitting

**缺点**：
- 仍然是核心的一部分，删不掉
- 没有解决「可扩展性」的问题
- 依赖还是装在 client 包里

---

## 推荐：方案 B（变体）

**按库拆成独立 addon，但用约定保持简洁**。

理由：
1. 和 theme 插件化的哲学一致 — **npm 包即插件**
2. Addon 系统已经有 `mdxComponents` 注入能力，天然适合
3. 真正做到 tree-shakable：不用 G2 ≠ 不装 `@antv/g2`
4. PlantUML 可以继续留在核心（几乎零体积），只拆重量级的

### 目录结构

```
packages/client/src/addons/
├── mermaid/
│   ├── index.ts              → export const addon: SlideAddonDefinition
│   ├── MermaidDiagram.tsx     ← 从 ui/diagrams/ 挪过来
│   └── style.css             ← mermaid 相关样式
├── g2/
│   ├── index.ts
│   └── G2Chart.tsx           ← 从 ui/diagrams/ 挪过来
└── insight/
    └── ...                   ← 保持不变
```

PlantUML 因为体积可以忽略，可以选择：
- 留在 `ui/mdx/index.ts` 作为内置组件
- 或者也顺手拆出去（保持一致性）

### Addon 定义示例

```ts
// addons/mermaid/index.ts
import type { SlideAddonDefinition } from '../types'
import { MermaidDiagram } from './MermaidDiagram'

export const addon: SlideAddonDefinition = {
  id: 'mermaid',
  label: 'Mermaid Diagrams',
  mdxComponents: {
    MermaidDiagram,
  },
}
```

```ts
// addons/g2/index.ts
import type { SlideAddonDefinition } from '../types'
import { Chart } from './G2Chart'

export const addon: SlideAddonDefinition = {
  id: 'g2',
  label: 'G2 Charts',
  mdxComponents: {
    Chart,
  },
}
```

### 使用方式

在 deck 顶级 frontmatter 声明：

```mdx
---
addons: ["mermaid"]
---

<MermaidDiagram>
graph LR
  A --> B
</MermaidDiagram>
```

需要多个 addon 时：

```yaml
---
addons: ["mermaid", "g2"]
---
```

---

## 需要讨论的问题

### 1. Addon 是否也要走 npm 外部包？

目前 addon 是 **内嵌在 `packages/client/src/addons/`** 里的，靠 `import.meta.glob` 发现。

两条路：

| | 内嵌（当前） | npm 包（像 theme） |
|---|---|---|
| 发现机制 | `import.meta.glob` 自动 | Vite 插件 + virtual module |
| 安装 | 自带 | `pnpm add @slidev-react/addon-mermaid` |
| 适合 | 内置 addon | 社区 addon |
| 复杂度 | 低 | 需要写 Vite 插件 |

**建议**：短期保持内嵌，先把拆分做了。等 addon 生态需要开放给社区时，再参考 theme 的 Vite 插件模式做外部化。

### 2. 重依赖的处理

`mermaid` 和 `@antv/g2` 从 `@slidev-react/client` 的 `dependencies` 移到对应 addon 目录后：
- **如果仍是内嵌**：实际还在同一个包里，只是 code splitting 按 chunk 拆
- **如果外部化**：依赖跟着 addon 包走，真正解耦

内嵌方案下，可以配合 Vite 的 `manualChunks` 或动态 import 做 code splitting，效果类似但不彻底。

---

## 改动清单（如果按方案 B 内嵌走）

| 操作 | 文件 |
|------|------|
| **新建** | `addons/mermaid/index.ts` |
| **移动** | `ui/diagrams/MermaidDiagram.tsx` → `addons/mermaid/` |
| **新建** | `addons/g2/index.ts` |
| **移动** | `ui/diagrams/G2Chart.tsx` → `addons/g2/` |
| **修改** | `ui/mdx/index.ts` — 移除 `Chart`、`MermaidDiagram` 的 import |
| **可选** | `addons/plantuml/` — 看是否拆 |
| **修改** | `registry.ts` — 无需改，`import.meta.glob` 自动发现 |
| **新增测试** | `registry.test.ts` — 验证新 addon 注册正确 |

---

## 后续演进

```
Phase 1（现在）        Phase 2                Phase 3
─────────────         ─────────              ─────────
内嵌拆分              npm 外部化              社区生态
addons/mermaid/   →   @slidev-react/       →   slidev-react-addon-xxx
addons/g2/            addon-mermaid            用户自建 addon
                      + Vite 插件发现
```

这条路和 theme 走的路线完全一致：先内嵌验证架构 → 再外部化。
