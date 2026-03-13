# Theme 插件化设计

## 目标

Theme **就是 npm 包**。用户装包、frontmatter 写一行，完事。

```yaml
---
theme: minimal
---
```

```bash
pnpm add @slidev-react/theme-minimal
```

不需要 config 文件，不需要手动注册，不需要知道 Vite 插件。

---

## 架构

```
slides.mdx                    node_modules/
  theme: "minimal"             @slidev-react/theme-minimal/
        │                        ├── index.ts        (defineTheme)
        │                        ├── style.css       (design tokens)
        │                        ├── layouts/        (cover, section...)
        │                        └── components/     (Badge, Callout...)
        │
        ▼
┌──────────────────────────────────────────────┐
│  Vite Plugin: slidev-react:themes            │
│  1. 读 frontmatter → 拿到 theme id           │
│  2. resolve → @slidev-react/theme-{id}       │
│  3. 生成 virtual:slidev-react/active-theme   │
│     import style + definition                │
└──────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────┐
│  Client Runtime                              │
│  ThemeProvider 直接消费 active theme          │
│  不再做 registry 发现，只有一个 active theme  │
└──────────────────────────────────────────────┘
```

**核心设计决策**：

1. **砍掉 theme registry / theme map** — deck 只有一个 theme，不需要运行时发现、不需要 Map 查找
2. **砍掉 `import.meta.glob("./themes/*/index.ts")`** — 内置 theme 也走 npm 包约定
3. **Vite 插件做所有脏活** — frontmatter 解析、包定位、虚拟模块生成
4. **default theme 是零配置 fallback** — 不写 `theme:` 就用内置 default，代码直接内联

---

## Theme 包结构

```
@slidev-react/theme-minimal/
├── package.json
│   {
│     "name": "@slidev-react/theme-minimal",
│     "main": "./index.ts",
│     "keywords": ["slidev-react-theme"]
│   }
├── index.ts
├── style.css
├── layouts/
│   ├── cover.tsx
│   └── section.tsx
└── components/
    └── Badge.tsx
```

### `index.ts`

```ts
import type { SlideThemeDefinition } from '@slidev-react/core/theme'
import { CoverLayout } from './layouts/cover'
import { MinimalBadge } from './components/Badge'

const theme: SlideThemeDefinition = {
  id: 'minimal',
  label: 'Minimal',
  colorScheme: 'dark',
  rootClassName: 'theme-minimal',
  layouts: {
    cover: CoverLayout,
  },
  mdxComponents: {
    Badge: MinimalBadge,
  },
  // 可选：包裹 Provider（注入字体、全局状态等）
  provider: ({ children }) => <>{children}</>,
}

export default theme
```

### `style.css`

只覆盖需要的 token，其他继承 default：

```css
:root[data-slide-theme="minimal"] {
  --font-sans: "Outfit", sans-serif;
  --slide-color-body: #e2e8f0;
  --slide-color-heading: #f8fafc;
  --slide-h1-weight: 700;
  --slide-h1-letter-spacing: -0.04em;
  --slide-list-bullet-bg: linear-gradient(135deg, #6366f1, #8b5cf6);
  --slide-list-bullet-shadow: 0 0 0 2px rgba(99, 102, 241, 0.14);
  --slide-blockquote-border-color: #818cf8;
  --slide-blockquote-bg: rgba(99, 102, 241, 0.08);
  --slide-badge-bg: rgba(99, 102, 241, 0.12);
  --slide-badge-color: #c7d2fe;
}

:root[data-slide-theme="minimal"] body {
  background: #0f172a;
}
```

---

## Vite 插件实现

```ts
// packages/node/src/vite/themePlugin.ts
import { resolve } from 'node:path'
import type { Plugin } from 'vite'

const VIRTUAL_THEME = 'virtual:slidev-react/active-theme'
const RESOLVED_VIRTUAL = '\0' + VIRTUAL_THEME

interface ThemePluginOptions {
  /** 从 deck frontmatter 解析出的 theme id */
  themeId: string | undefined
}

export function slidevReactThemePlugin({ themeId }: ThemePluginOptions): Plugin {
  return {
    name: 'slidev-react:themes',
    enforce: 'pre',

    resolveId(id) {
      if (id === VIRTUAL_THEME) return RESOLVED_VIRTUAL
    },

    load(id) {
      if (id !== RESOLVED_VIRTUAL) return

      // 无 theme → 用内联 default
      if (!themeId) {
        return `export default undefined`
      }

      // 尝试 @slidev-react/theme-{id} 和 slidev-react-theme-{id}
      const candidates = [
        `@slidev-react/theme-${themeId}`,
        `slidev-react-theme-${themeId}`,
      ]

      for (const pkg of candidates) {
        try {
          require.resolve(pkg)
          return [
            `import theme from '${pkg}'`,
            `import '${pkg}/style.css'`,
            `export default theme`,
          ].join('\n')
        } catch {}
      }

      // 回退：检查本地 themes 目录
      const localPath = resolve(__dirname, `../../client/src/theme/themes/${themeId}/index.ts`)
      try {
        require.resolve(localPath)
        return [
          `import { theme } from '${localPath}'`,
          `import '${resolve(__dirname, `../../client/src/theme/themes/${themeId}/style.css`)}'`,
          `export default theme`,
        ].join('\n')
      } catch {}

      console.warn(`[slidev-react] Theme "${themeId}" not found, falling back to default.`)
      return `export default undefined`
    },
  }
}
```

---

## Client 端改造

### `registry.ts` → 简化为纯函数

```ts
// packages/client/src/theme/registry.ts
import type { SlideThemeDefinition, ResolvedSlideTheme } from './types'
import type { MDXComponents } from '../types/mdx-components'
import { mdxComponents as baseMdxComponents } from '../ui/mdx'
import { defaultLayouts } from './layouts/defaultLayouts'
import activeTheme from 'virtual:slidev-react/active-theme'

const defaultTheme: SlideThemeDefinition = {
  id: 'default',
  label: 'Default',
  colorScheme: 'light',
  rootAttributes: { 'data-slide-theme': 'default' },
}

export function resolveSlideTheme(): ResolvedSlideTheme {
  const definition = activeTheme ?? defaultTheme

  return {
    definition,
    rootAttributes: definition.rootAttributes ?? {
      'data-slide-theme': definition.id,
    },
    rootClassName: definition.rootClassName,
    provider: definition.provider,
    layouts: {
      ...defaultLayouts,
      ...definition.layouts,
    },
    mdxComponents: {
      ...baseMdxComponents,
      ...definition.mdxComponents,
    },
  }
}
```

**砍掉了**：`listRegisteredThemes()`, `resolveThemeDefinition()`, `themeMap`, `import.meta.glob`。

### `ThemeProvider.tsx` → 去掉 themeId prop

```tsx
export function ThemeProvider({
  slidesViewport,
  children,
}: {
  slidesViewport?: SlidesViewport
  children: ReactNode
}) {
  // 编译时已确定，不再运行时 resolve
  const theme = useMemo(() => resolveSlideTheme(), [])
  // ...
}
```

---

## Design Token 合约

从 `default.css` 提取为正式合约，theme 作者只需要关心这些分组：

| 分组 | Token 前缀 | 示例 |
|------|-----------|------|
| **Typography** | `--font-sans`, `--font-mono` | 字体栈 |
| **Color** | `--slide-color-*` | body / heading / muted |
| **Heading** | `--slide-h1-*`, `--slide-h2-*`, `--slide-h3-*` | size / weight / spacing |
| **Body Text** | `--slide-p-*`, `--slide-li-*` | font-size / line-height |
| **List** | `--slide-list-*`, `--slide-ol-*` | bullet 样式、badge 样式 |
| **Link** | `--slide-link-*` | decoration / color / hover |
| **Block** | `--slide-blockquote-*` | border / background |
| **Table** | `--slide-table-*` | head-bg / border / shadow |
| **Code** | `--slide-pre-*`, `--slide-inline-code-*` | padding / radius / font-size |
| **Badge** | `--slide-badge-*` | bg / color / border |
| **Mark** | `--slide-mark-*` | Annotate 手绘效果 |
| **Surface** | `--slide-surface-*` | padding-inline / padding-block |

> [!IMPORTANT]
> Theme 的 CSS 通过 `:root[data-slide-theme="<id>"]` 选择器限定作用域。不需要 CSS Modules 或 shadow DOM。

---

## 内置 Theme 迁移

现有的 `paper` theme 迁移到独立包 `@slidev-react/theme-paper`：

```
packages/theme-paper/            ← 新位置（monorepo workspace 包）
├── package.json
├── index.ts                     ← 原 themes/paper/index.ts
├── style.css                    ← 原 themes/paper/style.css
├── layouts/
│   └── cover.tsx                ← 原 CoverLayout.tsx
└── components/
    └── PaperBadge.tsx           ← 原 PaperBadge.tsx
```

`packages/client/src/theme/themes/` **整个删掉**，不再有内嵌 theme 的概念。

---

## 脚手架

提供 `create-slidev-react-theme`：

```bash
pnpm create slidev-react-theme my-brand
```

生成：

```
my-brand/
├── package.json    (name, keywords, peerDependencies)
├── index.ts        (defineTheme 模板)
├── style.css       (token 覆盖模板 + 完整注释)
├── layouts/
│   └── cover.tsx   (示例 layout)
└── README.md
```

---

## 文件改动清单

| 操作 | 文件 |
|------|------|
| **新建** | `packages/node/src/vite/themePlugin.ts` |
| **新建** | `packages/core/src/theme/defineTheme.ts` |
| **新建** | `packages/core/src/theme/tokens.ts` — token 合约文档 |
| **新建** | `packages/theme-paper/` — paper 独立为 workspace 包 |
| **重写** | `packages/client/src/theme/registry.ts` — 砍到 ~20 行 |
| **修改** | `packages/client/src/theme/ThemeProvider.tsx` — 去掉 themeId |
| **修改** | `packages/client/src/app/App.tsx` — ThemeProvider 不再传 themeId |
| **修改** | `packages/node/src/vite/` — 主 Vite 配置加载 themePlugin |
| **删除** | `packages/client/src/theme/themes/` — 整个目录 |
| **删除** | `packages/client/src/theme/registry.test.ts` — 重写测试 |

---

## 关键设计原则

1. **编译时绑定** — theme 在 Vite 构建时就确定了，不存在运行时切换
2. **单 theme 模型** — 一个 deck 只有一个 theme（和 Slidev 原版一致）
3. **npm 包即插件** — 安装即可用，零配置
4. **Token 继承** — 只覆盖你关心的变量，其他全部继承 default
5. **内置 theme 也是包** — paper 不再是特殊的内嵌目录，和外部保持一致
