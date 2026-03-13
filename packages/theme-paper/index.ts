import { defineTheme } from "@slidev-react/core/theme";
import { PaperCoverLayout } from "./layouts/CoverLayout";
import { PaperBadge } from "./components/PaperBadge";

export default defineTheme({
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
  },
});
