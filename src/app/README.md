# `app/` Guide

`app/` 负责应用装配，而不是承载具体产品能力。

术语约定见：
`../../../docs/slide-react-terminology.md`

## What Belongs Here

- 入口级组件装配，例如 `App.tsx`
- 应用级 provider，例如页码导航、路由模式、全局 composition
- 未来若有 `shell/`，应承接模式切换和页面级骨架

## What Does Not Belong Here

- reveal、draw、presentation sync 这类明确 feature 语义
- 纯展示组件
- deck parsing / compiling 逻辑
