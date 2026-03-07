function slugifySegment(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function trimKnownExtension(value: string) {
  return value.replace(/\.(webm|mp4|mov)$/i, "");
}

export function resolvePresentationFileNameBase({
  exportFilename,
  deckTitle,
  fallback = "slide-react-deck",
}: {
  exportFilename?: string;
  deckTitle?: string;
  fallback?: string;
}) {
  const preferred = trimKnownExtension(exportFilename?.trim() ?? "");
  if (preferred) return preferred;

  const titleSlug = slugifySegment(deckTitle ?? "");
  if (titleSlug) return titleSlug;

  return fallback;
}

export function resolveRecordingFileNameBase({
  exportFilename,
  deckTitle,
}: {
  exportFilename?: string;
  deckTitle?: string;
}) {
  return resolvePresentationFileNameBase({
    exportFilename,
    deckTitle,
    fallback: "slide-react-recording",
  });
}

export function createRecordingDownloadName(options: {
  exportFilename?: string;
  deckTitle?: string;
  recordedAt?: Date;
}) {
  const stamp = (options.recordedAt ?? new Date())
    .toISOString()
    .replaceAll(":", "-")
    .replace(/\..+$/, "");

  return `${resolveRecordingFileNameBase(options)}-${stamp}.webm`;
}
