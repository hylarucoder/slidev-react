import type { LayoutName } from "./layout";
import type { SlideUnit } from "./slide";
import type { TransitionName } from "./transition";

export interface DeckMeta {
  title?: string;
  theme?: string;
  addons?: string[];
  layout?: LayoutName;
  background?: string;
  transition?: TransitionName;
  exportFilename?: string;
}

export interface DeckModel {
  meta: DeckMeta;
  slides: SlideUnit[];
}
