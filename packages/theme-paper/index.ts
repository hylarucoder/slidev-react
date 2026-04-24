import { defineTheme } from "@slidev-react/core/theme";
import {
  PlainChapterLayout,
  PlainSectionLayout,
  PlainStatementLayout,
  SlideBadge,
  SlideCallout,
  SlideEyebrow,
  SlideKeyStat,
  SlidePullQuote,
} from "@slidev-react/client/theme-shared";
import { PaperCoverLayout } from "./layouts/CoverLayout";

export default defineTheme({
  id: "paper",
  label: "Paper",
  tokens: {
    fonts: {
      sans: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", "Source Han Serif SC", "Songti SC", serif',
      serif:
        '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", "Source Han Serif SC", "Songti SC", serif',
      mono: '"JetBrains Mono", "SFMono-Regular", ui-monospace, "Cascadia Mono", "Fira Code", monospace',
    },
    ui: {
      background: "#f5efe5",
      surface: "#fff7ed",
      surfaceStrong: "#f8f1e4",
      text: "#3f2a1d",
      heading: "#2b1d12",
      muted: "#6b4f3a",
      mutedSoft: "#b08968",
      accent: "#d97706",
      accentStrong: "#b45309",
      accentSoft: "#ffedd5",
      border: "rgba(120, 53, 15, 0.12)",
      borderStrong: "rgba(120, 53, 15, 0.2)",
    },
    feedback: {
      positive: "#65a30d",
      negative: "#dc2626",
      warning: "#d97706",
      info: "#0284c7",
      neutral: "#a16207",
    },
    chart: {
      accent: "#d97706",
      categorical: ["#d97706", "#b45309", "#92400e", "#a16207", "#78350f", "#57534e"],
      positive: "#65a30d",
      negative: "#dc2626",
      warning: "#d97706",
      neutral: "#a16207",
      axis: "rgba(120, 53, 15, 0.2)",
      grid: "#eadfce",
    },
    diagram: {
      primary: "#ffedd5",
      primaryBorder: "#d97706",
      line: "#6b4f3a",
      surface: "#fff7ed",
      surfaceAlt: "#f8f1e4",
      text: "#2b1d12",
      note: "#fef3c7",
      categorical: ["#d97706", "#b45309", "#92400e", "#a16207", "#78350f", "#57534e"],
      accent: "#d97706",
    },
    addons: {
      insight: {
        border: "rgba(146, 64, 14, 0.18)",
        background: "rgba(255, 247, 237, 0.92)",
        title: "#9a3412",
        text: "#7c2d12",
        shadow: "0 16px 38px rgba(120, 53, 15, 0.08)",
      },
    },
  },
  colorScheme: "light",
  rootAttributes: {
    "data-slide-theme": "paper",
  },
  layoutIds: ["cover", "section", "statement", "chapter"],
  layouts: {
    cover: PaperCoverLayout,
    section: PlainSectionLayout,
    statement: PlainStatementLayout,
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
