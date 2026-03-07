export function normalizeConfiguredClicks(clicks: number | undefined) {
  if (typeof clicks !== "number" || !Number.isFinite(clicks)) return 0;

  return Math.max(Math.floor(clicks), 0);
}

export function resolveRevealTotal({
  configuredClicks,
  detectedClicks,
}: {
  configuredClicks?: number;
  detectedClicks?: number;
}) {
  return Math.max(
    normalizeConfiguredClicks(configuredClicks),
    normalizeConfiguredClicks(detectedClicks),
  );
}
