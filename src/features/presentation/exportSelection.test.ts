import { describe, expect, it } from "vitest";
import {
  clampSlideSelection,
  createRangesFromSlides,
  createSlideSelectionLabel,
  expandSlideSelection,
  parseSlideSelection,
  toPdfPageRanges,
} from "./exportSelection";

describe("presentation export selection", () => {
  it("parses and merges slide ranges", () => {
    expect(parseSlideSelection("1, 2-4, 4-6, 9")).toEqual([
      { start: 1, end: 6 },
      { start: 9, end: 9 },
    ]);
  });

  it("returns null when no selection is provided", () => {
    expect(parseSlideSelection("")).toBeNull();
    expect(parseSlideSelection(undefined)).toBeNull();
  });

  it("throws on invalid ranges", () => {
    expect(() => parseSlideSelection("3-1")).toThrow('Invalid slide range: "3-1"');
    expect(() => parseSlideSelection("a")).toThrow('Invalid slide selection segment: "a"');
  });

  it("clamps ranges to the available deck size", () => {
    expect(clampSlideSelection(parseSlideSelection("2-5, 9-12"), 10)).toEqual([
      { start: 2, end: 5 },
      { start: 9, end: 10 },
    ]);
  });

  it("expands ranges into slide numbers", () => {
    expect(expandSlideSelection([{ start: 3, end: 5 }])).toEqual([3, 4, 5]);
  });

  it("creates PDF page ranges and selection labels", () => {
    const ranges = [
      { start: 2, end: 4 },
      { start: 7, end: 7 },
    ];

    expect(toPdfPageRanges(ranges)).toBe("2-4,7");
    expect(createSlideSelectionLabel(ranges)).toBe("slides-2-4_7");
  });

  it("compresses slide numbers back into contiguous ranges", () => {
    expect(createRangesFromSlides([5, 3, 4, 7, 7])).toEqual([
      { start: 3, end: 5 },
      { start: 7, end: 7 },
    ]);
  });
});
