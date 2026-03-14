import { describe, expect, it } from "vite-plus/test";
import {
  canAdvanceFlow,
  canRetreatFlow,
  clampCueIndex,
  resolveAdvanceFlow,
  resolveRetreatFlow,
} from "../navigation";

describe("presentation flow navigation", () => {
  it("advances cues before moving to the next page", () => {
    expect(
      resolveAdvanceFlow({
        currentCueIndex: 1,
        currentCueTotal: 3,
        currentPageIndex: 4,
        totalPages: 10,
      }),
    ).toEqual({
      pageIndex: 4,
      cueIndex: 2,
    });
  });

  it("moves to the next page and resets the cue index when the current page is exhausted", () => {
    expect(
      resolveAdvanceFlow({
        currentCueIndex: 3,
        currentCueTotal: 3,
        currentPageIndex: 4,
        totalPages: 10,
      }),
    ).toEqual({
      pageIndex: 5,
      cueIndex: 0,
    });
  });

  it("does nothing when already at the end of the deck", () => {
    expect(
      resolveAdvanceFlow({
        currentCueIndex: 0,
        currentCueTotal: 0,
        currentPageIndex: 9,
        totalPages: 10,
      }),
    ).toBeNull();
  });

  it("retreats cues before jumping to the previous page", () => {
    expect(
      resolveRetreatFlow({
        currentCueIndex: 2,
        currentPageIndex: 5,
        previousCueIndex: 4,
        previousCueTotal: 4,
      }),
    ).toEqual({
      pageIndex: 5,
      cueIndex: 1,
    });
  });

  it("restores the previous page progression when returning to it", () => {
    expect(
      resolveRetreatFlow({
        currentCueIndex: 0,
        currentPageIndex: 5,
        previousCueIndex: 2,
        previousCueTotal: 4,
      }),
    ).toEqual({
      pageIndex: 4,
      cueIndex: 2,
    });
  });

  it("falls back to the previous page total when no stored cue index exists", () => {
    expect(
      resolveRetreatFlow({
        currentCueIndex: 0,
        currentPageIndex: 2,
        previousCueTotal: 3,
      }),
    ).toEqual({
      pageIndex: 1,
      cueIndex: 3,
    });
  });

  it("computes availability correctly", () => {
    expect(
      canAdvanceFlow({
        currentCueIndex: 0,
        currentCueTotal: 1,
        currentPageIndex: 0,
        totalPages: 3,
      }),
    ).toBe(true);
    expect(
      canAdvanceFlow({
        currentCueIndex: 0,
        currentCueTotal: 0,
        currentPageIndex: 2,
        totalPages: 3,
      }),
    ).toBe(false);
    expect(
      canRetreatFlow({
        currentCueIndex: 1,
        currentPageIndex: 0,
      }),
    ).toBe(true);
    expect(
      canRetreatFlow({
        currentCueIndex: 0,
        currentPageIndex: 0,
      }),
    ).toBe(false);
  });

  it("clamps cue indices to non-negative totals", () => {
    expect(clampCueIndex(-3, 4)).toBe(0);
    expect(clampCueIndex(7, 4)).toBe(4);
    expect(clampCueIndex(3)).toBe(3);
  });
});
