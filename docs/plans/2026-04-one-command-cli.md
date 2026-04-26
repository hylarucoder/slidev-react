# Slidev-React 一键启动 CLI 改造计划

> 起草日期：2026-04-24
> 范围：`packages/cli/bin/slidev-react.ts`（默认命令 & 位置参数）· `packages/node/src/dev.ts`（preflight 兜底）· `packages/create-app/*`（模板瘦身）· 根 / 子包 README（发布前置）
> 目标：让 `npx @slidev-react/cli@latest [slides.mdx]` 在任意目录（含空目录）一条命令跑起来，对齐 `slidev` 的首次体验
> 阅读方式：§1-§3 先建立背景；§4 按 Phase A→D 顺序执行，每个 Phase 可独立 PR。

---

## 1. 背景

### 1.1 当前终端体验

| 场景            | 当前需要的命令                                            | Slidev 对应体验              |
| --------------- | --------------------------------------------------------- | ---------------------------- |
| 空目录跑 demo   | ❌ 不支持（必须先 scaffold）                              | `npx slidev`                 |
| 指定 mdx 跑     | `slidev-react dev slides.mdx`                             | `slidev slides.md`           |
| 不传参数跑      | `slidev-react dev`（会默认找 `./slides.mdx`）             | `slidev`（找 `./slides.md`） |
| scaffold 新项目 | `npm create slidev-react`（生成较多文件 + `vp dev` 脚本） | `npm init slidev`            |

### 1.2 架构已经具备的能力

- `packages/node/src/dev.ts:24` 使用 `configFile: false` + 代码内拼装的 `createSlidesViteConfig`，**不依赖项目里的 `vite.config.mts`**。
- `packages/node/package.json:40-58` 已经把 `react / react-dom / @mdx-js/react / vite / tailwindcss / @tailwindcss/postcss` 作为直接 `dependencies`，npx 解析链完整。
- `packages/node/src/slides/build/config/createSlidesViteConfig.ts:19-29` 用 `createRequire(import.meta.url)` 从 CLI/node 自身解析这些依赖，不需要宿主目录 `node_modules`。
- 结论：**一键体验的底盘已经存在**，缺 CLI 门面、缺 dev 的首次体验兜底、模板与实际运行路径不一致。

### 1.3 关键差距

1. **没有默认子命令**：裸跑 `slidev-react` 只打印 help（`packages/cli/bin/slidev-react.ts:190-202`）。
2. **顶层位置参数不透传**：`slidev-react slides.mdx` 会被 commander 当成未知命令报错。
3. **`slides.mdx` 缺失无兜底**：`packages/node/src/slides/build/artifacts/generateCompiledSlides.ts:296` 直接 `readFile` 抛错。
4. **脚手架与实际 runtime 背离**：`packages/create-app/template/vite.config.mts` 是多余的；`packages/create-app/src/createApp.ts:114` 生成的脚本是 `vp dev`/`vp build`，没走 CLI。
5. **未发布 npm**：根 `package.json:5` 明写 "not published to npm"，`npx` 路径暂不可用。

---

## 2. 目标与非目标

### 2.1 目标

1. `npx @slidev-react/cli@latest`（空目录）→ 自动生成最小 `slides.mdx`，启动 dev server。
2. `npx @slidev-react/cli@latest slides.mdx`、`slidev-react slides.mdx --port 4000` → 等价于 `dev` 子命令。
3. `npm create slidev-react@latest my-deck` → 生成的项目里 `pnpm dev` 就是走 CLI，无需额外 vite 配置。
4. 现有显式子命令（`dev / build / export / lint`）行为不变。

### 2.2 非目标

- 不引入新状态、运行时或 polyfill。
- 不改动 MDX 编译、parse、export 行为。
- 不做 CLI 子命令的大改（不加 `eject / theme / format` 等）。
- 本轮不真正 `changeset publish`，只把路径铺好。

---

## 3. 关键设计决策

### 3.1 默认子命令匹配规则

约定：**"第一个非 flag 参数不在已知子命令集"即视为 `dev` 的位置参数**，此时在 argv 前插 `dev`。

- argv 空 → `['dev']`
- `['--port', '4000']` → `['dev', '--port', '4000']`
- `['slides.mdx']` → `['dev', 'slides.mdx']`
- `['nope']` → `['dev', 'nope']`（dev 会在 preflight 中提示"文件不存在"）
- `['dev', 'slides.mdx']` → 原样（已命中子命令）
- `['--help' | '-h' | '--version']` → 原样（交给 commander）

已知子命令集：`dev / build / export / lint / help`。这组来自 CLI 当前声明，之后新增要同步这里。

### 3.2 dev preflight 兜底策略

在 `startSlidesDevServer` 读文件之前：

- 若 `slidesSourceFile` 存在 → 照常走。
- 若不存在：
  - **用户显式传了 `--file` 或位置参数** → 立即失败并报路径缺失（不做隐式 scaffold，避免写错路径）。
  - **没有显式传且 cwd 无 `slides.mdx`** → 写入一份最小 demo 到 `slidesSourceFile`（即 `<cwd>/slides.mdx`），console 提示"已生成 demo，可自行修改"。
  - 提供 `--no-scaffold` flag 禁用自动写入（保证 CI 可控）。

demo 内容抽成 `packages/node/src/slides/templates/demoSlidesSource.ts` 常量，`create-slidev-react` 的 `template/slides.mdx` 最终也能复用同一份来源。

### 3.3 `create-slidev-react` 模板对齐

- 删 `template/vite.config.mts`。
- 生成的 `package.json.scripts`：
  ```json
  {
    "dev": "slidev-react dev",
    "build": "slidev-react build",
    "export": "slidev-react export",
    "lint": "slidev-react lint --strict"
  }
  ```
- `dependencies` 只保留 `@slidev-react/cli` + `react` + `react-dom` + `@mdx-js/react`；`devDependencies` 留空（或仅 TS 类型）。
- 模板 README 更新为"安装后 `pnpm dev` / 或直接 `npx @slidev-react/cli`"。

### 3.4 发布前置

- 根 `README.md` / `README.zh-CN.md`：把 `not published to npm` 撤下，加三段使用姿势（npx 裸跑、npx 带文件、create-slidev-react）。
- `packages/cli/README.md`：补"零配置使用"一节。
- `packages/create-app/README.md`：列出生成结果、下一步命令。
- 不执行 publish；留发布 checklist 在根 README 的 Contributor 段。

---

## 4. 执行 Phase

### Phase A — CLI 默认命令 & 顶层文件参数

**改动**

- `packages/cli/bin/slidev-react.ts`：在 `program.parseAsync` 之前做 argv 规范化（§3.1 规则），抽成纯函数 `normalizeArgv` 方便测试。
- `packages/cli/bin/__tests__/slidev-react.test.ts`：
  - 现有"unknown command 'nope'"用例更新为"被转发给 dev"（但不启动真正 server：可通过 `--help` 或新加一个打印 argv 的 dry-run flag 来断言改写结果，择一）。
  - 新增单测：`normalizeArgv([])`、`normalizeArgv(['slides.mdx'])`、`normalizeArgv(['--port','4000'])`、`normalizeArgv(['dev','slides.mdx'])`、`normalizeArgv(['--help'])`。

**验收**

- `pnpm -F @slidev-react/cli test`（若无则 `pnpm test` 过滤该文件）通过。
- `pnpm lint` 无新错。
- 手工：`node --import tsx packages/cli/bin/slidev-react.ts --help` 仍展示 help。

### Phase B — dev preflight 兜底

**改动**

- 新文件 `packages/node/src/slides/templates/demoSlidesSource.ts` 导出 `DEMO_SLIDES_MDX` 常量（最小可跑的 demo：1-2 页，引入 theme=moonlit，能通过 lint）。
- `packages/node/src/cli/devArgs.ts`：新增 `noScaffold: boolean`，解析 `--no-scaffold`/`--no-scaffold=true`。
- `packages/node/src/dev.ts` 或新 `packages/node/src/slides/build/config/preflightSlidesSource.ts`：在 `startSlidesDevServer` 内、`createServer` 之前判定 §3.2 三种分支。
- 单测：`packages/node/src/slides/build/config/__tests__/preflightSlidesSource.test.ts`，覆盖三条分支（用 tmp dir）。

**验收**

- 手工：`mkdir /tmp/sr-smoke && cd /tmp/sr-smoke && node --import tsx <repo>/packages/cli/bin/slidev-react.ts` → 自动生成 `slides.mdx`，dev server 启动。
- 手工：同目录下再跑 `slidev-react dev missing.mdx` → 明确报错，不自动生成。
- `pnpm -F @slidev-react/node test` 绿。

### Phase C — `create-slidev-react` 模板瘦身

**改动**

- 删 `packages/create-app/template/vite.config.mts`。
- `packages/create-app/src/createApp.ts`：
  - `scripts` 改为 §3.3 的四条。
  - `dependencies` 去掉 `@slidev-react/node`（让 CLI 自己带传递依赖），保留 cli + react + react-dom + @mdx-js/react。
  - `devDependencies` 去掉 `vite-plus`。
- `packages/create-app/src/__tests__/createApp.test.ts`：更新断言对齐新产物。
- `packages/create-app/template/slides.mdx`：保留，但源文可以直接从 Phase B 的 `DEMO_SLIDES_MDX` 同步（通过 build step 或简单复制 —— 本 Phase 先保留为独立文件，不强耦合）。
- `packages/create-app/README.md`：更新输出说明。

**验收**

- `pnpm -F create-slidev-react test` 绿。
- 手工：`node --import tsx packages/create-app/src/index.ts /tmp/my-deck --yes --force` → 产物只有 `package.json` + `slides.mdx` + `README.md`；`cd /tmp/my-deck && pnpm install && pnpm dev` 应成功（需要 Phase A 已合入）。

### Phase D — 发布前置 & 文档

**改动**

- 根 `README.md` / `README.zh-CN.md`：用例三段（npx 空目录 / npx 带文件 / create-slidev-react）、`not published to npm` 段落替换为 release status。
- `packages/cli/README.md`：零配置章节。
- `packages/create-app/README.md`：产物与下一步。
- 根 `package.json`：`description` 不必改；若现有 release scripts（`release:bump / release:version / release:publish`）缺任何必需步骤则补齐（例如先跑 `test:smoke:*`，已有）。
- 补一个 `docs/plans/release-checklist.md`（可选，短），列实际 publish 顺序。

**验收**

- `pnpm run lint` + `pnpm run format:check` 通过。
- 文档例子手工跑一遍（限本地路径，不真实 publish）。

---

## 5. 验收的总入口

4 个 Phase 都合入后，以下全部真实可跑：

```bash
# 空目录冷启（A + B）
mkdir /tmp/sr-demo && cd /tmp/sr-demo
node --import tsx <repo>/packages/cli/bin/slidev-react.ts
# → 自动生成 slides.mdx，打印 Vite URL

# 指定文件（A）
cd <repo>
node --import tsx packages/cli/bin/slidev-react.ts slides-ar-3-4.mdx --port 5190

# scaffold（C）
node --import tsx packages/create-app/src/index.ts /tmp/sr-new --yes --force
cd /tmp/sr-new && pnpm install && pnpm dev
```

发布后（非本轮）：

```bash
npx @slidev-react/cli@latest
npx @slidev-react/cli@latest slides.mdx
npm create slidev-react@latest my-deck
```

---

## 6. 风险与回退

- **argv 改写与 commander 交互**：必须保证 `--help` / `--version` / 显式子命令路径未被改动。通过纯函数 `normalizeArgv` + 单测隔离风险。
- **自动生成文件的用户预期**：用户在非空目录意外跑 CLI，若目录恰好没有 `slides.mdx`，我们会写一个。通过"只在 cwd 没有 mdx 且用户未显式指定路径时 scaffold"收敛；加 `--no-scaffold` 兜底。
- **模板瘦身后丢失 IDE 提示**：React/MDX types 通过生成 `package.json` 里的 react 依赖保留；不再需要的 vite 配置即使用户想自定义也能后补。
- **回退**：每个 Phase 独立 PR，回退只需 revert 对应 commit。
