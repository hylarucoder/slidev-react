import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { Badge } from "../../ui/primitives/Badge";
import { defaultLayouts } from "../layouts/defaultLayouts";
import { resolveSlideTheme } from "../registry";

afterEach(() => {
  vi.resetModules();
});

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

  it("merges the absolutely theme package with default layouts and mdx components", async () => {
    vi.resetModules();

    const { default: absolutelyTheme } = await import("../../../../theme-absolutely/index");
    vi.doMock("virtual:slidev-react/active-theme", () => ({
      default: absolutelyTheme,
    }));

    const { resolveSlideTheme: resolveActiveSlideTheme } = await import("../registry");
    const theme = resolveActiveSlideTheme();

    expect(theme.definition.id).toBe("absolutely");
    expect(theme.rootAttributes).toEqual({
      "data-slide-theme": "absolutely",
    });
    expect(theme.layouts.default).toBeDefined();
    expect(theme.layouts["two-cols"]).toBeDefined();
    expect(theme.layouts.cover).toBe(absolutelyTheme.layouts?.cover);
    expect(theme.layouts.section).toBe(absolutelyTheme.layouts?.section);
    expect(theme.layouts.statement).toBe(absolutelyTheme.layouts?.statement);
    expect(theme.mdxComponents.CodeMagicMove).toBeDefined();
    expect(theme.mdxComponents.Badge).toBe(absolutelyTheme.mdxComponents?.Badge);
    expect(theme.mdxComponents.Callout).toBe(absolutelyTheme.mdxComponents?.Callout);
    expect(theme.mdxComponents.KeyStat).toBe(absolutelyTheme.mdxComponents?.KeyStat);
    expect(theme.mdxComponents.PullQuote).toBe(absolutelyTheme.mdxComponents?.PullQuote);
  });
});
