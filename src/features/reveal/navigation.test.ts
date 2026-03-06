import { describe, expect, it } from "vitest";
import {
  canAdvanceReveal,
  canRetreatReveal,
  clampRevealCount,
  resolveAdvanceReveal,
  resolveRetreatReveal,
} from "./navigation";

describe("reveal navigation", () => {
  it("advances clicks before moving to the next page", () => {
    expect(
      resolveAdvanceReveal({
        currentClicks: 1,
        currentClicksTotal: 3,
        currentIndex: 4,
        totalSlides: 10,
      }),
    ).toEqual({
      page: 4,
      clicks: 2,
    });
  });

  it("moves to the next page and resets clicks when the current page is exhausted", () => {
    expect(
      resolveAdvanceReveal({
        currentClicks: 3,
        currentClicksTotal: 3,
        currentIndex: 4,
        totalSlides: 10,
      }),
    ).toEqual({
      page: 5,
      clicks: 0,
    });
  });

  it("does nothing when already at the end of the deck", () => {
    expect(
      resolveAdvanceReveal({
        currentClicks: 0,
        currentClicksTotal: 0,
        currentIndex: 9,
        totalSlides: 10,
      }),
    ).toBeNull();
  });

  it("retreats clicks before jumping to the previous page", () => {
    expect(
      resolveRetreatReveal({
        currentClicks: 2,
        currentIndex: 5,
        previousClicks: 4,
        previousClicksTotal: 4,
      }),
    ).toEqual({
      page: 5,
      clicks: 1,
    });
  });

  it("restores the previous page reveal progress when returning to it", () => {
    expect(
      resolveRetreatReveal({
        currentClicks: 0,
        currentIndex: 5,
        previousClicks: 2,
        previousClicksTotal: 4,
      }),
    ).toEqual({
      page: 4,
      clicks: 2,
    });
  });

  it("falls back to the previous page total when no stored clicks exist", () => {
    expect(
      resolveRetreatReveal({
        currentClicks: 0,
        currentIndex: 2,
        previousClicksTotal: 3,
      }),
    ).toEqual({
      page: 1,
      clicks: 3,
    });
  });

  it("computes availability correctly", () => {
    expect(
      canAdvanceReveal({
        currentClicks: 0,
        currentClicksTotal: 1,
        currentIndex: 0,
        totalSlides: 3,
      }),
    ).toBe(true);
    expect(
      canAdvanceReveal({
        currentClicks: 0,
        currentClicksTotal: 0,
        currentIndex: 2,
        totalSlides: 3,
      }),
    ).toBe(false);
    expect(
      canRetreatReveal({
        currentClicks: 1,
        currentIndex: 0,
      }),
    ).toBe(true);
    expect(
      canRetreatReveal({
        currentClicks: 0,
        currentIndex: 0,
      }),
    ).toBe(false);
  });

  it("clamps reveal counts to non-negative totals", () => {
    expect(clampRevealCount(-3, 4)).toBe(0);
    expect(clampRevealCount(7, 4)).toBe(4);
    expect(clampRevealCount(3)).toBe(3);
  });
});
