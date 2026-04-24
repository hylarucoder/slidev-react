import { defineTheme } from "@slidev-react/core/theme";
import {
  PlainChapterLayout,
  SlideBadge,
  SlideCallout,
  SlideEyebrow,
  SlideKeyStat,
  SlidePullQuote,
} from "@slidev-react/client/theme-shared";
import { AbsolutelyCoverLayout } from "./layouts/CoverLayout";
import { AbsolutelySectionLayout } from "./layouts/SectionLayout";
import { AbsolutelyStatementLayout } from "./layouts/StatementLayout";

export default defineTheme({
  id: "absolutely",
  label: "Absolutely",
  tokens: {
    fonts: {
      sans: '"Avenir Next", "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
      serif:
        '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", "Source Han Serif SC", "Songti SC", serif',
      mono: '"JetBrains Mono", "SFMono-Regular", ui-monospace, "Cascadia Mono", "Fira Code", monospace',
    },
    ui: {
      background: "#f7f3ed",
      surface: "#fbf8f3",
      surfaceStrong: "#f2ece4",
      text: "#2d2d2b",
      heading: "#2d2d2b",
      muted: "#6f685f",
      mutedSoft: "#a29a90",
      accent: "#cc7d5e",
      accentStrong: "#a9654a",
      accentSoft: "#efd9cf",
      border: "#e8e0d6",
      borderStrong: "#d8cfc4",
    },
    feedback: {
      positive: "#58c7a7",
      negative: "#e88eaf",
      warning: "#f6a62b",
      info: "#88b7ea",
      neutral: "#a9a1e5",
    },
    chart: {
      accent: "#cc7d5e",
      categorical: ["#cc7d5e", "#88b7ea", "#58c7a7", "#f6a62b", "#a9a1e5", "#e88eaf"],
      positive: "#58c7a7",
      negative: "#e88eaf",
      warning: "#f6a62b",
      neutral: "#a9a1e5",
      axis: "#d8cfc4",
      grid: "#eee7de",
    },
    diagram: {
      primary: "#efd9cf",
      primaryBorder: "#cc7d5e",
      line: "#b8aea2",
      surface: "#fbf8f3",
      surfaceAlt: "#f2ece4",
      text: "#2d2d2b",
      note: "#f7f0dd",
      categorical: ["#cc7d5e", "#88b7ea", "#58c7a7", "#f6a62b", "#a9a1e5", "#e88eaf"],
      accent: "#cc7d5e",
    },
    addons: {
      insight: {
        border: "rgba(204, 125, 94, 0.22)",
        background: "rgba(239, 217, 207, 0.62)",
        title: "#a9654a",
        text: "#6f4a39",
        shadow: "0 16px 38px rgba(204, 125, 94, 0.1)",
      },
    },
  },
  colorScheme: "light",
  rootAttributes: {
    "data-slide-theme": "absolutely",
  },
  layoutIds: ["cover", "section", "statement", "chapter"],
  layouts: {
    cover: AbsolutelyCoverLayout,
    section: AbsolutelySectionLayout,
    statement: AbsolutelyStatementLayout,
    chapter: PlainChapterLayout,
  },
  mdxComponents: {
    Badge: SlideBadge,
    Callout: SlideCallout,
    Eyebrow: SlideEyebrow,
    KeyStat: SlideKeyStat,
    PullQuote: SlidePullQuote,
  },
});
