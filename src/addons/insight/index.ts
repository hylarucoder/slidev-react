import { InsightAddonProvider } from "./InsightAddonProvider";
import { SpotlightLayout } from "./SpotlightLayout";
import { Insight } from "./Insight";
import type { SlideAddonDefinition } from "../types";

export const addon: SlideAddonDefinition = {
  id: "insight",
  label: "Insight",
  experimental: true,
  provider: InsightAddonProvider,
  layouts: {
    spotlight: SpotlightLayout,
  },
  mdxComponents: {
    Insight,
  },
};
