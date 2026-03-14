import { describe, expect, it } from "vite-plus/test";
import { resolveSlideSurface, resolveSlideSurfaceClassName } from "../slideSurface";

describe("resolveSlideSurfaceClassName", () => {
  it("includes base classes for a default layout", () => {
    const result = resolveSlideSurfaceClassName({ layout: "default" });
    expect(result).toContain("slide-prose");
    expect(result).toContain("slide-surface-frame");
  });

  it("uses zero padding for immersive layout", () => {
    const result = resolveSlideSurfaceClassName({ layout: "immersive" });
    expect(result).toContain("px-0 py-0");
    expect(result).not.toContain("slide-surface-frame");
  });

  it("includes overflow-hidden when requested", () => {
    const result = resolveSlideSurfaceClassName({
      layout: "default",
      overflowHidden: true,
    });
    expect(result).toContain("overflow-hidden");
  });

  it("omits overflow-hidden by default", () => {
    const result = resolveSlideSurfaceClassName({ layout: "default" });
    expect(result).not.toContain("overflow-hidden");
  });

  it("appends custom shadow class", () => {
    const result = resolveSlideSurfaceClassName({
      layout: "default",
      shadowClass: "shadow-lg",
    });
    expect(result).toContain("shadow-lg");
  });
});

describe("resolveSlideSurface", () => {
  it("returns default white background when no background is set", () => {
    const result = resolveSlideSurface({
      meta: { layout: "default" },
    });
    expect(result.style.backgroundColor).toBe("#ffffff");
  });

  it("detects bare image URLs and sets backgroundImage", () => {
    const result = resolveSlideSurface({
      meta: { layout: "default", background: "https://example.com/bg.jpg" },
    });
    expect(result.style.backgroundImage).toContain("url(");
    expect(result.style.backgroundSize).toBe("cover");
  });

  it("detects relative image paths", () => {
    const result = resolveSlideSurface({
      meta: { layout: "default", background: "./images/bg.png" },
    });
    expect(result.style.backgroundImage).toContain("url(");
  });

  it("detects data URI images", () => {
    const result = resolveSlideSurface({
      meta: { layout: "default", background: "data:image/svg+xml;base64,abc" },
    });
    expect(result.style.backgroundImage).toContain("url(");
  });

  it("treats CSS values as raw background property", () => {
    const result = resolveSlideSurface({
      meta: { layout: "default", background: "linear-gradient(to right, #000, #fff)" },
    });
    expect(result.style.background).toContain("linear-gradient");
    expect(result.style.backgroundImage).toBeUndefined();
  });

  it("falls back to slidesBackground when slide has no background", () => {
    const result = resolveSlideSurface({
      meta: { layout: "default" },
      slidesBackground: "#333",
    });
    expect(result.style.background).toBe("#333");
  });

  it("merges meta.class into className", () => {
    const result = resolveSlideSurface({
      meta: { layout: "default", class: "custom-slide" },
      className: "base-class",
    });
    expect(result.className).toContain("base-class");
    expect(result.className).toContain("custom-slide");
  });
});
