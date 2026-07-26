import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { Badge } from "../../ui/primitives/Badge";
import { defaultLayouts } from "../layouts/defaultLayouts";
import { resolveSlideTheme } from "../registry";

afterEach(() => {
  vi.resetModules();
});

describe("theme registry", () => {
  it("falls back to kami when no active theme is set", () => {
    const theme = resolveSlideTheme();

    expect(theme.definition.id).toBe("kami");
    // Kami's single accent: ink-blue.
    expect(theme.tokens.ui.accent).toBe("#1B365D");
    // Parchment, never pure white.
    expect(theme.tokens.ui.background).toBe("#f5f4ed");
  });

  it("carries kami's own layouts into the fallback, not just its tokens", () => {
    const theme = resolveSlideTheme();

    expect(theme.layouts.cover).not.toBe(defaultLayouts.cover);
    for (const id of ["cover", "section", "statement", "chapter"] as const) {
      expect(theme.layouts[id]).toBeDefined();
    }
  });

  it("keeps base layouts and mdx components the theme does not override", () => {
    const theme = resolveSlideTheme();

    expect(theme.layouts.default).toBe(defaultLayouts.default);
    expect(theme.layouts["two-cols"]).toBe(defaultLayouts["two-cols"]);
    expect(theme.mdxComponents.CodeMagicMove).toBeDefined();
  });

  it("lets the theme's own mdx components win over the base set", () => {
    const theme = resolveSlideTheme();

    // Kami styles its own Badge, so the base primitive must not leak through.
    expect(theme.mdxComponents.Badge).not.toBe(Badge);
    expect(theme.mdxComponents.Callout).toBeDefined();
  });

  it("merges the built-in kami theme with default layouts and mdx components", async () => {
    vi.resetModules();

    const { default: kamiTheme } = await import("../builtin/kami/index");
    vi.doMock("virtual:slidev-react/active-theme", () => ({
      default: kamiTheme,
    }));

    const { resolveSlideTheme: resolveActiveSlideTheme } = await import("../registry");
    const theme = resolveActiveSlideTheme();

    expect(theme.definition.id).toBe("kami");
    expect(theme.rootAttributes).toEqual({
      "data-slide-theme": "kami",
    });
    expect(theme.layouts.default).toBeDefined();
    expect(theme.layouts["two-cols"]).toBeDefined();
    expect(theme.layouts.cover).toBe(kamiTheme.layouts?.cover);
    expect(theme.layouts.section).toBe(kamiTheme.layouts?.section);
    expect(theme.layouts.statement).toBe(kamiTheme.layouts?.statement);
    expect(theme.layouts.chapter).toBe(kamiTheme.layouts?.chapter);
    expect(theme.mdxComponents.CodeMagicMove).toBeDefined();
    expect(theme.mdxComponents.Badge).toBe(kamiTheme.mdxComponents?.Badge);
    expect(theme.mdxComponents.Callout).toBe(kamiTheme.mdxComponents?.Callout);
    expect(theme.mdxComponents.KeyStat).toBe(kamiTheme.mdxComponents?.KeyStat);
    expect(theme.mdxComponents.PullQuote).toBe(kamiTheme.mdxComponents?.PullQuote);
  });

  it("merges the built-in moonlit theme with default layouts and mdx components", async () => {
    vi.resetModules();

    const { default: moonlitTheme } = await import("../builtin/moonlit/index");
    vi.doMock("virtual:slidev-react/active-theme", () => ({
      default: moonlitTheme,
    }));

    const { resolveSlideTheme: resolveActiveSlideTheme } = await import("../registry");
    const theme = resolveActiveSlideTheme();

    expect(theme.definition.id).toBe("moonlit");
    expect(theme.rootAttributes).toEqual({
      "data-slide-theme": "moonlit",
    });
    expect(theme.tokens.ui.background).toBe("#1c1c1c");
    expect(theme.layouts.default).toBeDefined();
    expect(theme.layouts["two-cols"]).toBeDefined();
    expect(theme.layouts.cover).toBe(moonlitTheme.layouts?.cover);
    expect(theme.layouts.section).toBe(moonlitTheme.layouts?.section);
    expect(theme.layouts.statement).toBe(moonlitTheme.layouts?.statement);
    expect(theme.layouts.chapter).toBe(moonlitTheme.layouts?.chapter);
    expect(theme.mdxComponents.Badge).toBe(moonlitTheme.mdxComponents?.Badge);
    expect(theme.mdxComponents.Callout).toBe(moonlitTheme.mdxComponents?.Callout);
    expect(theme.mdxComponents.KeyStat).toBe(moonlitTheme.mdxComponents?.KeyStat);
    expect(theme.mdxComponents.PullQuote).toBe(moonlitTheme.mdxComponents?.PullQuote);
  });
});
