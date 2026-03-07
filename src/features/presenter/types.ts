import type { LayoutName } from "../../deck/model/layout";
import type { SlideComponent } from "../../deck/model/slide";
import type { TransitionName } from "../../deck/model/transition";

export interface CompiledSlide {
  id: string;
  component: SlideComponent;
  meta: {
    title?: string;
    layout?: LayoutName;
    class?: string;
    background?: string;
    transition?: TransitionName;
    clicks?: number;
    notes?: string;
    src?: string;
  };
}
