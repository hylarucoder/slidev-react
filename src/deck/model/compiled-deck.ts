import type { DeckMeta } from "./deck";
import type { SlideComponent, SlideMeta } from "./slide";

export interface CompiledDeckSlide {
  id: string;
  component: SlideComponent;
  meta: SlideMeta;
}

export interface CompiledDeckManifest {
  meta: DeckMeta;
  slides: CompiledDeckSlide[];
  sourceHash: string;
}
