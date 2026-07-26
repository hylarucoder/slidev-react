import { defineTheme } from "@slidev-react/core/theme";
import { SlideBadge, SlideCallout, SlideEyebrow, SlideKeyStat, SlidePullQuote } from "../../shared";
import { KamiChapterLayout } from "./layouts/ChapterLayout";
import { KamiCoverLayout } from "./layouts/CoverLayout";
import { KamiSectionLayout } from "./layouts/SectionLayout";
import { KamiStatementLayout } from "./layouts/StatementLayout";
import { kamiThemeTokens } from "./tokens";

/**
 * Kami — a warm parchment design system, ported from https://github.com/tw93/Kami.
 *
 * This is the default theme: a deck with no `theme:` in its frontmatter renders as
 * Kami. The palette lives in `./tokens.ts`; the invariants it exists to hold (flat
 * canvas, serif at 400/500, whisper shadows, brand left rule) are enforced in
 * `./style.css`.
 */
export default defineTheme({
  id: "kami",
  label: "Kami",
  tokens: kamiThemeTokens,
  colorScheme: "light",
  rootAttributes: {
    "data-slide-theme": "kami",
  },
  layoutIds: ["cover", "section", "statement", "chapter"],
  layouts: {
    cover: KamiCoverLayout,
    section: KamiSectionLayout,
    statement: KamiStatementLayout,
    chapter: KamiChapterLayout,
  },
  mdxComponents: {
    Badge: SlideBadge,
    Callout: SlideCallout,
    Eyebrow: SlideEyebrow,
    KeyStat: SlideKeyStat,
    PullQuote: SlidePullQuote,
  },
});
