# `src/` Structure Guide

`apps/slide-react` 的源码目录按职责划分，而不是按技术形态划分。

术语约定见：
`../../docs/slide-react-terminology.md`

## Top-level Folders

- `app/`: 应用装配层。负责 provider 组合、入口编排和模式分发。
- `addons/`: 本地扩展层。负责 addon 注册、runtime seam 和示例 addon。
- `deck/`: slide deck 内容系统。负责 model、parsing、compiling、MDX 编译链路。
- `features/`: 产品能力层。按 presenter、navigation、reveal、presentation 等能力分组。
- `features/player/`: slide 舞台播放与交互层，承接缩放、cursor、stage click、draw overlay 等舞台语义。
- `ui/`: 纯展示组件。默认不直接承载演示状态机或同步逻辑。
- `theme/`: 主题、layout 和视觉 token。

## Placement Rules

- 新增内容解析或编译逻辑时，优先放进 `deck/`。
- 新增本地 addon contract、注册或 addon 示例时，优先放进 `addons/`。
- 新增演示行为时，优先放进对应 `features/<feature>/`。
- 新增舞台渲染与舞台交互逻辑时，优先放进 `features/player/`。
- 新增应用级 provider 或装配逻辑时，优先放进 `app/`。
- 新增纯视觉组件时，优先放进 `ui/`。
- 不再新增万能 `types.ts` 或兜底式 `utils.ts`。

## Quick Decision Guide

1. 这个文件是在解析或编译 deck 内容吗？
   放进 `deck/`
2. 这个文件是在实现某个用户可感知的演示能力吗？
   放进对应 `features/<feature>/`
3. 这个文件是在做应用装配、provider 组合或入口路由吗？
   放进 `app/`
4. 这个文件只是纯展示，不依赖演示状态机吗？
   放进 `ui/`
5. 如果以上都说不清，先停一下，别新建兜底目录
