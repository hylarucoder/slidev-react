import type { ComponentType } from "react"
import type { LayoutName } from "./layout"

export interface SlideMeta {
  title?: string
  layout?: LayoutName
  class?: string
}

export interface SlideUnit {
  id: string
  index: number
  meta: SlideMeta
  source: string
}

export type SlideComponent = ComponentType<Record<string, unknown>>
