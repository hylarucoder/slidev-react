# Theme 插件化：全局改造路线图

> 从当前代码库出发，分步走到「`pnpm add @slidev-react/theme-minimal` 即可用」。

---

## Step 0：现状地图

先搞清楚现在代码长什么样，才知道要动哪里。

```
packages/
├── core/src/
│   ├── slides/
│   │   ├── layout.ts          ← LayoutName 类型 ✅ 已在 core
│   │   ├── slides.ts          ← SlidesMeta.theme 字段 ✅ 已在 core
│   │   ├── viewport.ts
│   │   └── ...
│   └── presentation/          ← session / flow / export
│
├── client/src/
│   ├── theme/
│   │   ├── types.ts           ← SlideThemeDefinition ⚠️ 应该在 core
│   │   ├── registry.ts        ← import.meta.glob 发现 + Map 查找 ⚠️ 要重写
│   │   ├── ThemeProvider.tsx   ← React context ⚠️ 要简化
│   │   ├── default.css        ← 1426 行大杂烩 ⚠️ 要拆
│   │   ├── layouts/
│   │   │   ├── types.ts       ← LayoutRegistry, LayoutComponent ⚠️ 应该在 core
│   │   │   ├── defaultLayouts.ts
│   │   │   └── *.tsx          ← 8 个内置 layout 组件
│   │   └── themes/
│   │       └── paper/         ← 唯一的自定义 theme ⚠️ 要迁出为独立包
│   ├── addons/                ← 平行架构，暂不动
│   ├── types/
│   │   └── mdx-components.ts  ← MDXComponents 类型 ⚠️ 也需要暴露给 theme 包
│   └── ui/                    ← 基础 UI 组件
│
├── node/src/
│   └── slides/build/
│       └── createSlidesViteConfig.ts  ← Vite 插件注册点
```

---

## Step 1：拆 `default.css`

**目标**：把 1426 行的单文件拆成职责清晰的模块，让「token 合约」和「框架样式」分离。

### 拆分方案

| 新文件 | 内容 | 行数估 |
|--------|------|--------|
| `tokens.css` | `:root { }` 里的 130+ CSS 变量 + portrait 响应式变量 | ~150 |
| `base.css` | html/body/#root reset、body font-family | ~25 |
| `prose.css` | `.slide-prose` 下所有排版（h1-h3/p/li/a/strong/blockquote/table/kbd/hr/img/pre/code） | ~210 |
| `transitions.css` | `.slide-transition` + `@keyframes` | ~70 |
| `print.css` | `.print-*` 类 + `@media print` | ~100 |
| `mark.css` | `.slide-mark` 全部 Annotate 手绘效果 | ~200 |
| `components.css` | `.slide-badge`、`.slide-surface-frame` 等散落的组件样式 | ~20 |

### 入口

新建 `index.css` 统一引入：

```css
/* packages/client/src/theme/index.css */
@import "tailwindcss";
@source "../";

@import "./tokens.css";
@import "./base.css";
@import "./prose.css";
@import "./components.css";
@import "./mark.css";
@import "./transitions.css";
@import "./print.css";
```

原来 `main.tsx` 或其他入口 import `default.css` 的地方改为 import `index.css`。

### 改动范围

- **纯文件拆分**，CSS 内容不改一行
- 删除旧 `default.css`
- import 路径更新（应该只有 1-2 处）

### 验证

```bash
pnpm dev          # 页面渲染不变
pnpm test         # ThemeProvider.test.ts 通过
pnpm build        # 构建成功
```

---

## Step 2：类型合约迁入 `packages/core/`

**目标**：外部 theme 包只需 `peerDependencies: { "@slidev-react/core": "..." }` 就能拿到所有类型。

### 要迁移的类型

| 类型 | 现在位置 | 迁到 |
|------|---------|------|
| `LayoutComponent` | `client/src/theme/layouts/types.ts` | `core/src/slides/layout.ts` |
| `LayoutRegistry` | `client/src/theme/layouts/types.ts` | `core/src/slides/layout.ts` |
| `SlideThemeDefinition` | `client/src/theme/types.ts` | `core/src/theme/types.ts` **新建** |
| `ResolvedSlideTheme` | `client/src/theme/types.ts` | `core/src/theme/types.ts` |
| `ThemeProviderComponent` | `client/src/theme/types.ts` | `core/src/theme/types.ts` |
| `MDXComponents` | `client/src/types/mdx-components.ts` | `core/src/theme/types.ts` |

### 注意点

- `MDXComponents` 当前依赖 `@mdx-js/react` 的 `MDXProvider` props。迁移到 core 后需要在 core 的 `package.json` 加 `@mdx-js/react` 为 dependency（或用 `@types` peer dependency）
- `LayoutComponent` 依赖 `react` 的 `ComponentType`，core 已有 react 依赖，没问题
- client 端的旧文件改为 re-export：`export type { SlideThemeDefinition } from '@slidev-react/core/theme'`

### core `package.json` 新增 exports

```json
{
  "exports": {
    "./theme": {
      "types": "./dist/theme/types.d.ts",
      "import": "./dist/theme/types.js"
    }
  }
}
```

### 验证

```bash
pnpm test         # 所有现有测试通过
pnpm build        # core 和 client 构建成功
pnpm lint         # 类型检查通过
```

---

## Step 3：重写 Theme Registry → 单 Theme 模型

**目标**：砍掉 `import.meta.glob` 发现逻辑、砍掉 `themeMap`，theme 在编译时确定。

### 3a. Vite 虚拟模块插件

新建 `packages/node/src/vite/themePlugin.ts`：

- 读取 slides frontmatter 的 `theme` 字段
- resolve npm 包 `@slidev-react/theme-{id}` 或 `slidev-react-theme-{id}`
- 生成虚拟模块 `virtual:slidev-react/active-theme`

### 3b. 注册插件

修改 `createSlidesViteConfig.ts`：

```ts
plugins: [
  pluginCompileTimeSlides({ appRoot, slidesSourceFile }),
  slidevReactThemePlugin({ themeId }),   // ← 新增
  react(),
],
```

### 3c. 重写 `registry.ts`

从 ~64 行砍到 ~20 行：

```ts
import activeTheme from 'virtual:slidev-react/active-theme'

const defaultTheme = { id: 'default', ... }

export function resolveSlideTheme(): ResolvedSlideTheme {
  const definition = activeTheme ?? defaultTheme
  return { definition, layouts: { ...defaultLayouts, ...definition.layouts }, ... }
}
```

**删除**：`listRegisteredThemes()`, `resolveThemeDefinition()`, `themeMap`, `import.meta.glob`。

### 3d. 简化 `ThemeProvider.tsx`

去掉 `themeId` prop，`resolveSlideTheme()` 不再需要参数。

### 3e. 更新 `App.tsx`

`<ThemeProvider>` 不再传 `themeId={slidesDocument.meta.theme}`。

### 验证

```bash
pnpm dev          # 无 theme 时用 default，视觉不变
pnpm test         # registry.test.ts 重写后通过
pnpm build        # 构建成功
```

---

## Step 4：Paper Theme 迁出为独立包

**目标**：彻底消灭 `packages/client/src/theme/themes/` 目录。

### 新包位置

```
packages/theme-paper/
├── package.json
│   { "name": "@slidev-react/theme-paper", "peerDependencies": { "@slidev-react/core": "..." } }
├── index.ts
├── style.css
├── layouts/
│   └── cover.tsx
└── components/
    └── PaperBadge.tsx
```

`pnpm-workspace.yaml` 已有 `packages/*`，不需要改。

### 删除

- `packages/client/src/theme/themes/` 整个目录

### 验证

```yaml
# slides.mdx
---
theme: paper
---
```

```bash
pnpm dev          # paper theme 渲染正确
pnpm test         # registry.test.ts 更新后通过
```

---

## Step 5：defineTheme + 脚手架

**目标**：让社区能轻松创建 theme。

### 5a. `defineTheme()` helper

```ts
// packages/core/src/theme/defineTheme.ts
import type { SlideThemeDefinition } from './types'

export function defineTheme(theme: SlideThemeDefinition): SlideThemeDefinition {
  return theme
}
```

纯类型约束的 identity 函数，给 IDE 用。

### 5b. `create-slidev-react-theme` 脚手架

```bash
pnpm create slidev-react-theme my-brand
```

生成包含 `index.ts` / `style.css` / `layouts/cover.tsx` / `README.md` 的模板。

### 5c. Token 合约文档

从 `tokens.css` 提取一份 `packages/core/src/theme/tokens.ts`，列出所有可覆盖的 CSS 变量名 + 分组 + 默认值注释。

---

## 总结：依赖关系

```
Step 1 (拆 CSS)          独立，随时可做
     │
Step 2 (类型迁 core)     独立，随时可做
     │
     └──── Step 3 (Vite 插件 + registry 重写)  依赖 Step 2 的类型位置
                │
                └──── Step 4 (Paper 迁出)  依赖 Step 3 的虚拟模块机制
                         │
                         └──── Step 5 (defineTheme + 脚手架)  最后收尾
```

Step 1 和 Step 2 可以并行做，互不影响。Step 3 是核心改造，做完之后架构就位。Step 4、5 是水到渠成的收尾。

---

## 改动量估算

| Step | 新增文件 | 修改文件 | 删除文件 | 工作量 |
|------|---------|---------|---------|--------|
| 1 | 7 (拆出的 CSS) | 1-2 (import 路径) | 1 (default.css) | 小 |
| 2 | 1 (core/theme/types.ts) | 4-5 (re-export + package.json) | 0 | 小 |
| 3 | 1 (themePlugin.ts) | 4 (registry/ThemeProvider/App/viteConfig) | 0 | 中 |
| 4 | 4 (theme-paper 包) | 1 (registry test) | 4 (旧 themes/) | 小 |
| 5 | 2-3 (defineTheme + 脚手架) | 1 (core package.json) | 0 | 小 |
