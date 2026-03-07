import type { ComponentType } from "react";
import type { LayoutName } from "./layout";
import type { TransitionName } from "./transition";

export interface SlideMeta {
  title?: string;
  layout?: LayoutName;
  class?: string;
  background?: string;
  transition?: TransitionName;
  clicks?: number;
  notes?: string;
  src?: string;
}

export interface SlideUnit {
  id: string;
  index: number;
  meta: SlideMeta;
  source: string;
  hasInlineSource: boolean;
}

export type SlideComponent = ComponentType<Record<string, unknown>>;
