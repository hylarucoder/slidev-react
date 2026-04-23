# `@slidev-react/cli`

`@slidev-react/cli` 提供 `slidev-react` 命令行入口。它既是 **零安装的一键启动入口**，也是 `create-slidev-react` 模板背后的脚本执行层。

## 零安装使用

```bash
# 空目录直接跑 — 没有 slides.mdx 时会自动生成一份 starter，然后启动 dev server
npx @slidev-react/cli@latest

# 指定文件 / 端口
npx @slidev-react/cli@latest slides.mdx --port 4000

# 其他子命令
npx @slidev-react/cli@latest build slides.mdx
npx @slidev-react/cli@latest export slides.mdx --format png
npx @slidev-react/cli@latest lint slides.mdx --strict
```

> 不传子命令时，CLI 默认进入 `dev`。`slidev-react slides.mdx` 等价于 `slidev-react dev slides.mdx`。

如果需要在 CI 或其他受控环境禁用自动生成：

```bash
slidev-react --no-scaffold
```

## 当前命令

- `slidev-react [file]` — 默认 `dev`
- `slidev-react dev [file]` — 启动 Vite dev server
- `slidev-react build [file]` — 生产构建
- `slidev-react export [file]` — 通过 Playwright 导出 PDF / PNG
- `slidev-react lint [file]` — 校验 slides 作者侧 warning

其中：

- `dev` / `build` 走程序化 Vite API，无需项目内 `vite.config`
- `export` 会按需拉起临时 dev server 后再走 Playwright
- `lint` 直接调用 slides parsing + authoring validation

## 通过 `create-slidev-react` 使用

脚手架生成的 `package.json.scripts` 直接走 CLI：

```bash
npm create slidev-react@latest my-deck
cd my-deck
pnpm install
pnpm dev       # = slidev-react dev
pnpm build     # = slidev-react build
pnpm export    # = slidev-react export
pnpm lint      # = slidev-react lint --strict
```

## Monorepo 内 dogfood

```bash
pnpm slidev-react -- dev
pnpm slidev-react -- build slides-ar-3-4.mdx
pnpm slidev-react -- export slides-ar-3-4.mdx --format png
pnpm slidev-react -- lint slides.mdx --strict
```
