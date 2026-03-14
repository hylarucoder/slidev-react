import { describe, expect, it } from "vite-plus/test";
import { normalizeCueStep } from "../step";

describe("flow cue step", () => {
  it("keeps undefined as undefined for always-visible consumers", () => {
    expect(normalizeCueStep(undefined)).toBeUndefined();
  });

  it("normalizes invalid and fractional steps into positive integers", () => {
    expect(normalizeCueStep(Number.NaN)).toBe(1);
    expect(normalizeCueStep(-2)).toBe(1);
    expect(normalizeCueStep(2.9)).toBe(2);
  });
});
