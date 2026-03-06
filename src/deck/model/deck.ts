import type { LayoutName } from "./layout";
import type { SlideUnit } from "./slide";

export interface DeckMeta {
  title?: string;
  theme?: string;
  layout?: LayoutName;
}

export interface DeckModel {
  meta: DeckMeta;
  slides: SlideUnit[];
}
