# `create-slidev-react`

`create-slidev-react` 提供 `npm create slidev-react@latest` 的项目初始化入口。

当前目标很克制：

- 只负责创建一个最小可跑的 slides 项目
- 和 `@slidev-react/cli` 职责分离：脚手架只铺文件、CLI 负责 runtime
- 默认生成一个意见化 starter，而不是空壳目录
- 模板默认包含 `charts + mermaid` 能力，开箱即用

> 如果你只是想一次性试一下，不需要 scaffold，直接 `npx @slidev-react/cli@latest` 就能在空目录跑起来。

## Usage

```bash
npm create slidev-react@latest
```

也可以直接指定目录：

```bash
npm create slidev-react@latest my-slides
```

创建完成后：

```bash
cd my-slides
pnpm install
pnpm dev
```

## 生成的产物

- `slides.mdx` — starter 内容
- `README.md`
- `.gitignore`
- `package.json`
  - `scripts.dev` → `slidev-react dev`
  - `scripts.build` → `slidev-react build`
  - `scripts.export` → `slidev-react export`
  - `scripts.lint` → `slidev-react lint --strict`
  - `dependencies`: `@slidev-react/cli`、`react`、`react-dom`、`@mdx-js/react`

**不再生成** `vite.config.mts` — `@slidev-react/cli` 的 `dev/build` 走程序化 Vite 配置，不需要宿主项目提供配置文件。
