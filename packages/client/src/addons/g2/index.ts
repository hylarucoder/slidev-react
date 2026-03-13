import type { SlideAddonDefinition } from "../types";
import { Chart } from "./G2Chart";

export const addon: SlideAddonDefinition = {
  id: "g2",
  label: "G2 Charts",
  mdxComponents: {
    Chart,
  },
};
