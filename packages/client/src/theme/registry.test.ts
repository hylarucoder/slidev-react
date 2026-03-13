import { describe, expect, it } from "vitest";
import { Badge } from "../ui/primitives/Badge";
import { defaultLayouts } from "./layouts/defaultLayouts";
import { resolveSlideTheme } from "./registry";

describe("theme registry", () => {
  it("falls back to the default theme when no active theme is set", () => {
    const theme = resolveSlideTheme();

    expect(theme.definition.id).toBe("default");
  });

  it("provides default layouts and base mdx components", () => {
    const theme = resolveSlideTheme();

    expect(theme.layouts.default).toBe(defaultLayouts.default);
    expect(theme.layouts.cover).toBe(defaultLayouts.cover);
    expect(theme.mdxComponents.Badge).toBe(Badge);
    expect(theme.mdxComponents.Callout).toBeDefined();
  });
});
