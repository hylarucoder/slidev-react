import { describe, expect, it } from "vite-plus/test";
import {
  canAdvanceFlow,
  canRetreatFlow,
  clampStepIndex,
  resolveAdvanceFlow,
  resolveRetreatFlow,
} from "../navigation";

describe("presentation flow navigation", () => {
  it("advances steps before moving to the next page", () => {
    expect(
      resolveAdvanceFlow({
        currentStepIndex: 1,
        currentStepTotal: 3,
        currentPageIndex: 4,
        totalPages: 10,
      }),
    ).toEqual({
      pageIndex: 4,
      stepIndex: 2,
    });
  });

  it("moves to the next page and resets the step index when the current page is exhausted", () => {
    expect(
      resolveAdvanceFlow({
        currentStepIndex: 3,
        currentStepTotal: 3,
        currentPageIndex: 4,
        totalPages: 10,
      }),
    ).toEqual({
      pageIndex: 5,
      stepIndex: 0,
    });
  });

  it("does nothing when already at the end of the deck", () => {
    expect(
      resolveAdvanceFlow({
        currentStepIndex: 0,
        currentStepTotal: 0,
        currentPageIndex: 9,
        totalPages: 10,
      }),
    ).toBeNull();
  });

  it("retreats steps before jumping to the previous page", () => {
    expect(
      resolveRetreatFlow({
        currentStepIndex: 2,
        currentPageIndex: 5,
        previousStepIndex: 4,
        previousStepTotal: 4,
      }),
    ).toEqual({
      pageIndex: 5,
      stepIndex: 1,
    });
  });

  it("restores the previous page progression when returning to it", () => {
    expect(
      resolveRetreatFlow({
        currentStepIndex: 0,
        currentPageIndex: 5,
        previousStepIndex: 2,
        previousStepTotal: 4,
      }),
    ).toEqual({
      pageIndex: 4,
      stepIndex: 2,
    });
  });

  it("falls back to the previous page total when no stored step index exists", () => {
    expect(
      resolveRetreatFlow({
        currentStepIndex: 0,
        currentPageIndex: 2,
        previousStepTotal: 3,
      }),
    ).toEqual({
      pageIndex: 1,
      stepIndex: 3,
    });
  });

  it("computes availability correctly", () => {
    expect(
      canAdvanceFlow({
        currentStepIndex: 0,
        currentStepTotal: 1,
        currentPageIndex: 0,
        totalPages: 3,
      }),
    ).toBe(true);
    expect(
      canAdvanceFlow({
        currentStepIndex: 0,
        currentStepTotal: 0,
        currentPageIndex: 2,
        totalPages: 3,
      }),
    ).toBe(false);
    expect(
      canRetreatFlow({
        currentStepIndex: 1,
        currentPageIndex: 0,
      }),
    ).toBe(true);
    expect(
      canRetreatFlow({
        currentStepIndex: 0,
        currentPageIndex: 0,
      }),
    ).toBe(false);
  });

  it("clamps step indices to non-negative totals", () => {
    expect(clampStepIndex(-3, 4)).toBe(0);
    expect(clampStepIndex(7, 4)).toBe(4);
    expect(clampStepIndex(3)).toBe(3);
  });
});
