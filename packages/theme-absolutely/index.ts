import { defineTheme } from "@slidev-react/core/theme";
import { AbsolutelyBadge } from "./components/Badge";
import { AbsolutelyCallout } from "./components/Callout";
import { Eyebrow } from "./components/Eyebrow";
import { KeyStat } from "./components/KeyStat";
import { PullQuote } from "./components/PullQuote";
import { AbsolutelyCoverLayout } from "./layouts/CoverLayout";
import { AbsolutelySectionLayout } from "./layouts/SectionLayout";
import { AbsolutelyStatementLayout } from "./layouts/StatementLayout";

export default defineTheme({
  id: "absolutely",
  label: "Absolutely",
  colorScheme: "light",
  rootAttributes: {
    "data-slide-theme": "absolutely",
  },
  layouts: {
    cover: AbsolutelyCoverLayout,
    section: AbsolutelySectionLayout,
    statement: AbsolutelyStatementLayout,
  },
  mdxComponents: {
    Badge: AbsolutelyBadge,
    Callout: AbsolutelyCallout,
    Eyebrow,
    KeyStat,
    PullQuote,
  },
});
