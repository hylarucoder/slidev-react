import { defineTheme } from "@slidev-react/core/theme";
import { MoonlitBadge } from "./components/Badge";
import { MoonlitCallout } from "./components/Callout";
import { MoonlitEyebrow } from "./components/Eyebrow";
import { MoonlitKeyStat } from "./components/KeyStat";
import { MoonlitPullQuote } from "./components/PullQuote";
import { MoonlitCoverLayout } from "./layouts/CoverLayout";
import { MoonlitSectionLayout } from "./layouts/SectionLayout";
import { MoonlitStatementLayout } from "./layouts/StatementLayout";

export default defineTheme({
  id: "moonlit",
  label: "Moonlit",
  tokens: {
    fonts: {
      sans: '"Avenir Next", "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
      serif:
        '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", "Source Han Serif SC", "Songti SC", serif',
      mono: '"JetBrains Mono", "SFMono-Regular", ui-monospace, "Cascadia Mono", "Fira Code", monospace',
    },
    ui: {
      background: "#1c1c1c",
      surface: "#252525",
      surfaceStrong: "#18181b",
      text: "#ededed",
      heading: "#f3f4f6",
      muted: "#a1a1a1",
      mutedSoft: "#666666",
      accent: "#9fb4ff",
      accentStrong: "#d6e0ff",
      accentSoft: "rgba(159, 180, 255, 0.14)",
      border: "rgba(161, 161, 161, 0.18)",
      borderStrong: "rgba(199, 210, 254, 0.24)",
    },
    feedback: {
      positive: "#22c55e",
      negative: "#ef4444",
      warning: "#f97316",
      info: "#3b82f6",
      neutral: "#a855f7",
    },
    chart: {
      accent: "#9fb4ff",
      categorical: ["#9fb4ff", "#3b82f6", "#22c55e", "#f97316", "#a855f7", "#ef4444"],
      positive: "#22c55e",
      negative: "#ef4444",
      warning: "#f97316",
      neutral: "#a855f7",
      axis: "rgba(161, 161, 161, 0.24)",
      grid: "rgba(255, 255, 255, 0.08)",
    },
    diagram: {
      primary: "rgba(159, 180, 255, 0.18)",
      primaryBorder: "#9fb4ff",
      line: "#64748b",
      surface: "#252525",
      surfaceAlt: "#18181b",
      text: "#ededed",
      note: "#27272a",
      categorical: ["#9fb4ff", "#3b82f6", "#22c55e", "#f97316", "#a855f7", "#ef4444"],
      accent: "#9fb4ff",
    },
    addons: {
      insight: {
        border: "rgba(159, 180, 255, 0.22)",
        background: "rgba(37, 37, 37, 0.92)",
        title: "#d6e0ff",
        text: "#d4d4d8",
        shadow: "0 18px 42px rgba(2, 6, 23, 0.32)",
      },
    },
  },
  colorScheme: "dark",
  rootAttributes: {
    "data-slide-theme": "moonlit",
  },
  layoutIds: ["cover", "section", "statement"],
  layouts: {
    cover: MoonlitCoverLayout,
    section: MoonlitSectionLayout,
    statement: MoonlitStatementLayout,
  },
  mdxComponents: {
    Badge: MoonlitBadge,
    Callout: MoonlitCallout,
    Eyebrow: MoonlitEyebrow,
    KeyStat: MoonlitKeyStat,
    PullQuote: MoonlitPullQuote,
  },
});
