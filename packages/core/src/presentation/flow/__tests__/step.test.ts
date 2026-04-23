import { describe, expect, it } from "vite-plus/test";
import {
  normalizeConfiguredStepCount,
  normalizeStep,
  resolveStepTotal,
} from "../step";

describe("flow step metadata", () => {
  it("normalizes configured step counts to non-negative integers", () => {
    expect(normalizeConfiguredStepCount(undefined)).toBe(0);
    expect(normalizeConfiguredStepCount(-3)).toBe(0);
    expect(normalizeConfiguredStepCount(2.9)).toBe(2);
  });

  it("uses the larger value between configured and detected step totals", () => {
    expect(resolveStepTotal({ configuredSteps: 3, detectedSteps: 1 })).toBe(3);
    expect(resolveStepTotal({ configuredSteps: 1, detectedSteps: 4 })).toBe(4);
    expect(resolveStepTotal({ configuredSteps: 0, detectedSteps: 0 })).toBe(0);
  });
});

describe("normalizeStep", () => {
  it("keeps undefined as undefined for always-visible consumers", () => {
    expect(normalizeStep(undefined)).toBeUndefined();
  });

  it("normalizes invalid and fractional steps into positive integers", () => {
    expect(normalizeStep(Number.NaN)).toBe(1);
    expect(normalizeStep(-2)).toBe(1);
    expect(normalizeStep(2.9)).toBe(2);
  });
});
