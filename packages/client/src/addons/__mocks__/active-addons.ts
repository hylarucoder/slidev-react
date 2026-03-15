import type { ResolvedSlideAddons } from "../types";
import { addon as insightAddon } from "../insight/index";

const activeAddons: ResolvedSlideAddons = {
  definitions: [insightAddon],
  providers: insightAddon.provider ? [insightAddon.provider] : [],
  layouts: {
    ...insightAddon.layouts,
  },
  mdxComponents: {
    ...insightAddon.mdxComponents,
  },
};

export default activeAddons;
