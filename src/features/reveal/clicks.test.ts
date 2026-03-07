import { describe, expect, it } from "vitest";
import { normalizeConfiguredClicks, resolveRevealTotal } from "./clicks";

describe("reveal clicks metadata", () => {
  it("normalizes configured clicks to non-negative integers", () => {
    expect(normalizeConfiguredClicks(undefined)).toBe(0);
    expect(normalizeConfiguredClicks(-3)).toBe(0);
    expect(normalizeConfiguredClicks(2.9)).toBe(2);
  });

  it("uses the larger value between configured and detected reveal totals", () => {
    expect(resolveRevealTotal({ configuredClicks: 3, detectedClicks: 1 })).toBe(3);
    expect(resolveRevealTotal({ configuredClicks: 1, detectedClicks: 4 })).toBe(4);
    expect(resolveRevealTotal({ configuredClicks: 0, detectedClicks: 0 })).toBe(0);
  });
});
