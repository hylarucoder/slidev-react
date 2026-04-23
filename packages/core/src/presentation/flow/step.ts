export function normalizeConfiguredStepCount(steps: number | undefined) {
  if (typeof steps !== "number" || !Number.isFinite(steps)) return 0;

  return Math.max(Math.floor(steps), 0);
}

export function resolveStepTotal({
  configuredSteps,
  detectedSteps,
}: {
  configuredSteps?: number;
  detectedSteps?: number;
}) {
  return Math.max(
    normalizeConfiguredStepCount(configuredSteps),
    normalizeConfiguredStepCount(detectedSteps),
  );
}

export function normalizeStep(step: number | undefined) {
  if (step === undefined) return undefined;
  if (!Number.isFinite(step)) return 1;

  return Math.max(1, Math.floor(step));
}
