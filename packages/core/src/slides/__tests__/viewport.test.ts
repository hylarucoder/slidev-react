import { describe, expect, it } from "vite-plus/test";
import {
  formatViewportAspectRatio,
  isPortraitViewport,
  resolvePrintPageSize,
  resolveSlidesViewportMeta,
} from "../viewport";

describe("resolveSlidesViewportMeta", () => {
  it("resolves default 16/9 when ar is undefined", () => {
    const result = resolveSlidesViewportMeta(undefined);
    expect(result.ar).toBe("16/9");
    expect(result.viewport).toEqual({ width: 1920, height: 1080 });
  });

  it("resolves default 16/9 when ar is empty string", () => {
    const result = resolveSlidesViewportMeta("  ");
    expect(result.ar).toBe("16/9");
    expect(result.viewport).toEqual({ width: 1920, height: 1080 });
  });

  it("parses a standard 4/3 aspect ratio", () => {
    const result = resolveSlidesViewportMeta("4/3");
    expect(result.ar).toBe("4/3");
    expect(result.viewport.width).toBe(1920);
    expect(result.viewport.height).toBe(1440);
  });

  it("handles portrait aspect ratio where height is the long edge", () => {
    const result = resolveSlidesViewportMeta("9/16");
    expect(result.ar).toBe("9/16");
    expect(result.viewport.width).toBe(1080);
    expect(result.viewport.height).toBe(1920);
  });

  it("handles square 1/1 aspect ratio", () => {
    const result = resolveSlidesViewportMeta("1/1");
    expect(result.ar).toBe("1/1");
    expect(result.viewport.width).toBe(1920);
    expect(result.viewport.height).toBe(1920);
  });

  it("handles fractional aspect ratio units", () => {
    const result = resolveSlidesViewportMeta("2.35/1");
    expect(result.ar).toBe("2.35/1");
    expect(result.viewport.width).toBe(1920);
    expect(result.viewport.height).toBeLessThan(1920);
  });

  it("trims whitespace around the ar string", () => {
    const result = resolveSlidesViewportMeta("  16 / 9  ");
    expect(result.ar).toBe("16/9");
  });

  it("throws on an invalid ar string", () => {
    expect(() => resolveSlidesViewportMeta("widescreen")).toThrow("Invalid slides frontmatter");
  });

  it("throws on negative ratio values", () => {
    expect(() => resolveSlidesViewportMeta("-16/9")).toThrow("Invalid slides frontmatter");
  });

  it("throws on zero ratio values", () => {
    expect(() => resolveSlidesViewportMeta("0/9")).toThrow("Invalid slides frontmatter");
  });
});

describe("isPortraitViewport", () => {
  it("returns true when height exceeds width", () => {
    expect(isPortraitViewport({ width: 1080, height: 1920 })).toBe(true);
  });

  it("returns false for landscape", () => {
    expect(isPortraitViewport({ width: 1920, height: 1080 })).toBe(false);
  });

  it("returns false for square", () => {
    expect(isPortraitViewport({ width: 1920, height: 1920 })).toBe(false);
  });
});

describe("formatViewportAspectRatio", () => {
  it("formats as 'width / height'", () => {
    expect(formatViewportAspectRatio({ width: 1920, height: 1080 })).toBe("1920 / 1080");
  });
});

describe("resolvePrintPageSize", () => {
  it("computes landscape print dimensions from 16:9", () => {
    const result = resolvePrintPageSize({ width: 1920, height: 1080 });
    expect(result.heightMm).toBe(210);
    expect(result.widthMm).toBeGreaterThan(210);
  });

  it("computes portrait print dimensions with widthMm fixed at baseMm", () => {
    const result = resolvePrintPageSize({ width: 1080, height: 1920 });
    expect(result.widthMm).toBe(210);
    expect(result.heightMm).toBeGreaterThan(210);
  });

  it("computes square print dimensions", () => {
    const result = resolvePrintPageSize({ width: 1920, height: 1920 });
    expect(result.widthMm).toBe(210);
    expect(result.heightMm).toBe(210);
  });
});
