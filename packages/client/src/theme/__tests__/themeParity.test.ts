import { describe, expect, it } from "vite-plus/test";
import kami from "../builtin/kami";
import moonlit from "../builtin/moonlit";

const MDX_COMPONENTS = ["Badge", "Callout", "Eyebrow", "KeyStat", "PullQuote"] as const;
const CORE_LAYOUTS = ["cover", "section", "statement", "chapter"] as const;

const THEMES = [
  { name: "kami", theme: kami },
  { name: "moonlit", theme: moonlit },
];

describe("theme parity", () => {
  for (const { name, theme } of THEMES) {
    it(`${name} exports the full mdx component set`, () => {
      for (const key of MDX_COMPONENTS) {
        expect(theme.mdxComponents?.[key]).toBeDefined();
      }
    });

    it(`${name} supports the core layout ids`, () => {
      for (const id of CORE_LAYOUTS) {
        expect(theme.layoutIds).toContain(id);
        expect(theme.layouts?.[id]).toBeDefined();
      }
    });
  }
});
