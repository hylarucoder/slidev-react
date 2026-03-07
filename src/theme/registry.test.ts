import { describe, expect, it } from "vitest";
import { Badge } from "../ui/primitives/Badge";
import { defaultLayouts } from "./layouts/defaultLayouts";
import { listRegisteredThemes, resolveSlideTheme, resolveThemeDefinition } from "./registry";
import { PaperBadge } from "./themes/paper/PaperBadge";
import { PaperCoverLayout } from "./themes/paper/CoverLayout";

describe("theme registry", () => {
  it("registers local themes discovered from the theme directory", () => {
    const themeIds = listRegisteredThemes().map((theme) => theme.id);

    expect(themeIds).toContain("default");
    expect(themeIds).toContain("paper");
  });

  it("falls back to the default theme when the theme is missing", () => {
    expect(resolveThemeDefinition(undefined).id).toBe("default");
    expect(resolveThemeDefinition("missing-theme").id).toBe("default");
  });

  it("merges theme layouts and mdx components over the default contract", () => {
    const theme = resolveSlideTheme("paper");

    expect(theme.definition.id).toBe("paper");
    expect(theme.rootAttributes["data-slide-theme"]).toBe("paper");
    expect(theme.layouts.default).toBe(defaultLayouts.default);
    expect(theme.layouts.cover).toBe(PaperCoverLayout);
    expect(theme.mdxComponents.Badge).toBe(PaperBadge);
    expect(theme.mdxComponents.badge).toBe(Badge);
    expect(theme.mdxComponents.Callout).toBeDefined();
  });
});
