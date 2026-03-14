import { describe, expect, it } from "vite-plus/test";
import { defaultLayouts } from "../defaultLayouts";
import { resolveLayout } from "../resolveLayout";

describe("resolveLayout", () => {
  it("returns the default layout when layout is undefined", () => {
    expect(resolveLayout(undefined)).toBe(defaultLayouts.default);
  });

  it("returns the matching layout from the default registry", () => {
    expect(resolveLayout("cover")).toBe(defaultLayouts.cover);
  });

  it("falls back to default layout for an unknown layout name", () => {
    expect(resolveLayout("nonexistent")).toBe(defaultLayouts.default);
  });

  it("uses a custom registry when provided", () => {
    const customDefault = () => null;
    const customCover = () => null;
    const registry = { default: customDefault, cover: customCover };

    expect(resolveLayout("cover", registry)).toBe(customCover);
    expect(resolveLayout(undefined, registry)).toBe(customDefault);
  });

  it("falls back to defaultLayouts.default when custom registry has no default", () => {
    const registry = { cover: () => null };
    expect(resolveLayout("missing", registry)).toBe(defaultLayouts.default);
  });
});
