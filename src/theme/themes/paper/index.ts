import { Badge } from "../../../ui/primitives/Badge";
import { PaperCoverLayout } from "./CoverLayout";
import { PaperBadge } from "./PaperBadge";
import type { SlideThemeDefinition } from "../../types";

export const theme: SlideThemeDefinition = {
  id: "paper",
  label: "Paper",
  colorScheme: "light",
  rootAttributes: {
    "data-slide-theme": "paper",
  },
  layouts: {
    cover: PaperCoverLayout,
  },
  mdxComponents: {
    Badge: PaperBadge,
    badge: Badge,
  },
};
