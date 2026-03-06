import type { LayoutName } from "../../deck/model/layout";
import type { SlideComponent } from "../../deck/model/slide";

export interface CompiledSlide {
  id: string;
  component: SlideComponent;
  meta: {
    title?: string;
    layout?: LayoutName;
    class?: string;
  };
}
