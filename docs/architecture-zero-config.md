# 历史方案归档：Framework-Owns-The-Shell

> [!WARNING]
> 这份文档描述的是一条已经不再主推的历史方向：让用户直接通过裸 CLI / `npx @slidev-react/cli` 起手。
>
> 当前产品入口已经统一为 `create-slidev-react`，推荐路径是：
>
> ```bash
> npm create slidev-react@latest my-deck
> cd my-deck
> pnpm install
> pnpm dev
> ```
>
> `@slidev-react/cli` 现在主要作为模板项目 scripts 背后的内部执行层保留。

## 目标

这份归档记录的是之前设想的一条更激进的方向：让用户在任意目录只需要一个 `slides.mdx`，就能通过裸 CLI 直接跑起来——不需要 `index.html`、`main.tsx`、`vite.config.ts`，也不需要 clone 仓库。

## 现状问题

当前架构本质上是 **monorepo-as-app**：虽然拆成了 CLI / Node / Client / Core 四个包，但运行时把它们焊死在一起了。

### 绑定点一览

| 绑定位置 | 文件 | 具体代码 |
|---|---|---|
| `index.html` | 仓库根 `index.html` | `<script src="/packages/client/src/main.tsx">` |
| alias `@` | `createSlidesViteConfig.ts` | `"@": path.resolve(appRoot, "./packages/client/src")` |
| React 别名 | `createSlidesViteConfig.ts` | `react: path.resolve(appRoot, "./node_modules/react")` |
| 编译产物 | `generateCompiledSlides.ts` | 写到 `appRoot/.generated/slides/` |
| App 入口 | `main.tsx` | 直接 import `./app/App` 和 CSS |

这些都假设 `appRoot` 就是 monorepo 根目录，结果就是：**离开这个仓库，什么都跑不了**。

---

## 架构方案：三层分离 + Virtual Entry

### 核心原则

> **框架拥有 app shell，用户只提供内容。**

用户侧的极简体验：

```bash
# 已不再推荐
npm create slidev-react@latest my-deck
cd my-deck
pnpm install
pnpm dev
```

用户目录结构：

```
my-talk/
├── slides.mdx              ← 唯一必须的文件
├── components/              ← 可选，自定义 MDX 组件
│   └── MyChart.tsx
└── slidev-react.config.ts   ← 可选，配置主题/插件等
```

### 依赖关系

```
@slidev-react/cli
  └─ @slidev-react/node          ← CLI 的唯一依赖
       ├─ @slidev-react/client    ← 新增：node 依赖 client
       └─ @slidev-react/core
```

这条历史方向的核心前提，是用户通过裸 CLI 直接拉起整条依赖链。

---

## 具体改动

### Phase 1：Virtual Entry（消除 index.html / main.tsx 的硬需求）

#### 1.1 新增 `pluginVirtualEntry` Vite 插件

**文件**: `packages/node/src/slides/build/virtualEntryPlugin.ts` [NEW]

这个插件做两件事：

**a) 虚拟 `index.html`**

通过 Vite 的 `transformIndexHtml` hook 或 `configureServer` middleware 拦截根请求，返回生成的 HTML：

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Slidev React</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="virtual:slidev-react/entry"></script>
  </body>
</html>
```

字体加载、title 等可以从 slides 的 frontmatter 动态提取。

**b) 虚拟 `main.tsx` 入口**

提供 `virtual:slidev-react/entry` 模块：

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'katex/dist/katex.min.css'
import 'shiki-magic-move/dist/style.css'
import App from '@slidev-react/client'
import '@slidev-react/client/theme/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

> [!IMPORTANT]
> 对于 dev 模式，需要处理 Vite 的 `index.html` 入口逻辑——要么生成物理文件到临时目录，要么用 `configureServer` middleware 拦截。Vite 在 dev 模式下需要一个真实的 `index.html` 文件或者通过 middleware 返回，不能仅靠 virtual module。推荐用 middleware 方案，build 模式下用 `transformIndexHtml`。

#### 1.2 修改 `createSlidesViteConfig`

**文件**: `packages/node/src/slides/build/createSlidesViteConfig.ts` [MODIFY]

把 `pluginVirtualEntry` 加入 plugins 列表。当检测到用户目录下没有 `index.html` 时自动启用。

---

### Phase 2：Package Resolution（解掉 alias 硬编码）

#### 2.1 `@slidev-react/client` 作为 `@slidev-react/node` 的依赖

**文件**: `packages/node/package.json` [MODIFY]

```diff
 "dependencies": {
+  "@slidev-react/client": "workspace:*",
   "@slidev-react/core": "workspace:*",
   ...
 }
```

#### 2.2 `@slidev-react/client` 增加构建产物或正确的 exports

**文件**: `packages/client/package.json` [MODIFY]

当前 `"exports": { ".": "./src/index.ts" }` 指向源码——这在 monorepo 内 Vite 可以跑，但发布后用户不一定能直接吃 `.tsx`。需要做两件事之一：

**方案 A（推荐）**：保持源码分发，但让 Vite 配置显式 include 处理 `.tsx`：

```ts
// createSlidesViteConfig 里
optimizeDeps: {
  include: ['@slidev-react/client'],
},
```

**方案 B**：client 包增加预构建步骤，导出 `.js` + `.d.ts`。

> [!NOTE]
> 方案 A 更简单，与 Slidev 原版做法一致（它也是源码分发）。Vite 天生支持 `.tsx` sources，只需要确保 alias 和 `optimizeDeps` 配好。

#### 2.3 重写 alias 解析

**文件**: `packages/node/src/slides/build/createSlidesViteConfig.ts` [MODIFY]

```ts
// 之前：写死 monorepo 路径
"@": path.resolve(appRoot, "./packages/client/src"),

// 之后：通过 import.meta.resolve 或 createRequire 找到包的位置
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

function resolvePackageSrcDir(pkgName: string) {
  const pkgJsonPath = require.resolve(`${pkgName}/package.json`)
  return path.join(path.dirname(pkgJsonPath), 'src')
}

// 在 config 里
resolve: {
  alias: {
    '@': resolvePackageSrcDir('@slidev-react/client'),
    '@generated/slides': path.resolve(appRoot, generatedSlidesEntry),
  }
}
```

React 别名也同理，通过 `require.resolve` 动态找而不是写死路径。

---

### Phase 3：`.generated/` 产物目录解耦

#### 3.1 产物写到用户项目的临时目录

**文件**: `packages/node/src/slides/build/generateCompiledSlides.ts` [MODIFY]

当前生成物写到 `appRoot/.generated/slides/`，这耦合了 monorepo 结构。改为：

- 默认写到 `appRoot/.slidev-react/` 或 `appRoot/node_modules/.slidev-react/`（类似 Vite 的缓存目录）
- 保持与 `@generated/slides` alias 的映射

```ts
const GENERATED_DIR = '.slidev-react'  // or node_modules/.slidev-react
```

> [!TIP]
> 写入 `node_modules/.slidev-react/` 的好处是天然被 `.gitignore` 忽略，且符合 Vite/Next.js 等框架的惯例。

---

### Phase 4：Monorepo 开发体验保持不变

#### 4.1 `vite.config.ts`（仓库根目录）保持兼容

**文件**: `vite.config.ts` [MODIFY]

现有的 `pnpm dev`（走 `vp dev`）依然用仓库根的 `vite.config.ts`。由于 `createSlidesViteConfig` 改成了动态 resolve，monorepo 内 workspace link 会自动指向 `packages/client/src`，行为不变。

可以删掉仓库根的 `index.html`，因为 virtual entry 会接管。或者保留它作为 fallback（检测到物理文件存在时优先使用）。

#### 4.2 `pnpm dev` vs `slidev-react dev`

- `pnpm dev`（= `vp dev`）走仓库根 `vite.config.ts`，适合开发者 dogfood
- `slidev-react dev` 走 CLI → Node 的程序化 API，利用 virtual entry

两者最终都调用 `createSlidesViteConfig`，底层逻辑统一。

---

## 改动范围汇总

| 包 | 文件 | 动作 | 说明 |
|---|---|---|---|
| `@slidev-react/node` | `package.json` | MODIFY | 添加 `@slidev-react/client` 为 dependency |
| `@slidev-react/node` | `slides/build/virtualEntryPlugin.ts` | NEW | 虚拟 `index.html` + `main.tsx` 入口 |
| `@slidev-react/node` | `slides/build/createSlidesViteConfig.ts` | MODIFY | 动态 resolve alias、集成 virtual entry 插件 |
| `@slidev-react/node` | `slides/build/generateCompiledSlides.ts` | MODIFY | 产物目录从 `.generated/` 改为 `.slidev-react/` |
| `@slidev-react/client` | `package.json` | MODIFY | 补充 exports 字段（CSS、theme 等子路径导出） |
| 仓库根 | `index.html` | DELETE 或保留 | virtual entry 接管后可选删除 |
| 仓库根 | `.gitignore` | MODIFY | 添加 `.slidev-react/` |

---

## 分阶段实施建议

| 阶段 | 内容 | 风险 |
|---|---|---|
| **Phase 1** | Virtual Entry 插件 | 低：纯新增，不影响现有流程 |
| **Phase 2** | Package Resolution | 中：alias 变更可能影响现有 import 路径 |
| **Phase 3** | 产物目录解耦 | 低：改路径常量 + gitignore |
| **Phase 4** | Monorepo 兼容 | 低：确保 `pnpm dev` 行为不变 |

建议按 Phase 1 → 2 → 3 → 4 顺序推进，每个 phase 完成后跑一轮 `pnpm test` + `pnpm dev` 验证。

---

## 验证计划

### 自动化测试

1. **现有测试回归**：每个 Phase 完成后执行 `pnpm test`，确保 `packages/node/src/slides/build/__tests__/generateCompiledSlides.test.ts` 等 7 个测试文件全部通过
2. **新增测试**：
   - `packages/node/src/slides/build/__tests__/virtualEntryPlugin.test.ts` — 验证虚拟 index.html 和 entry module 的生成逻辑
   - `packages/node/src/slides/build/__tests__/createSlidesViteConfig.test.ts` — 验证 alias 动态解析在 monorepo 内和外部目录都能正确 resolve

### 集成验证

3. **Monorepo 内 dogfood**：`pnpm dev` 启动后能正常查看 slides（行为与改动前一致）
4. **独立目录测试**：在 `/tmp/test-slides/` 创建一个仅包含 `slides.mdx` 的目录，用本地 link 的 CLI 跑 `slidev-react dev`，验证零配置启动成功

### 手动验证

5. 改动完成后请在本机做以下操作：
   ```bash
   mkdir /tmp/test-slidev-react && cd /tmp/test-slidev-react
   echo '---\ntitle: Test\n---\n\n# Hello\n\nThis is a test.\n\n---\n\n# Slide 2\n\nIt works!' > slides.mdx
   # 用本地 link 方式调用 CLI
   node /path/to/packages/cli/dist/bin/slidev-react.mjs dev
   # 在浏览器中确认 slides 正常显示
   ```

---

## 未来可以做但不在本次范围内

- `slidev-react init` 子命令（生成 `slides.mdx` + 可选模板）
- `create-slidev-react` 脚手架包
- 用户自定义 `components/` 目录的约定式发现
- 自定义配置文件 `slidev-react.config.ts` 支持
- `@slidev-react/client` 的 pre-build（提升冷启动速度）
