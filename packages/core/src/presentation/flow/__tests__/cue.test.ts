import { describe, expect, it } from "vite-plus/test";
import { normalizeConfiguredCueCount, resolveCueTotal } from "../cue";

describe("flow cue metadata", () => {
  it("normalizes configured cue counts to non-negative integers", () => {
    expect(normalizeConfiguredCueCount(undefined)).toBe(0);
    expect(normalizeConfiguredCueCount(-3)).toBe(0);
    expect(normalizeConfiguredCueCount(2.9)).toBe(2);
  });

  it("uses the larger value between configured and detected cue totals", () => {
    expect(resolveCueTotal({ configuredCues: 3, detectedCues: 1 })).toBe(3);
    expect(resolveCueTotal({ configuredCues: 1, detectedCues: 4 })).toBe(4);
    expect(resolveCueTotal({ configuredCues: 0, detectedCues: 0 })).toBe(0);
  });
});
