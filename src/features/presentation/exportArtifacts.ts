function slugifySegment(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function trimPdfExtension(value: string) {
  return value.replace(/\.pdf$/i, "");
}

export function resolveExportDeckBaseName(documentTitle: string) {
  const trimmed = trimPdfExtension(documentTitle.trim());
  const slug = slugifySegment(trimmed);
  if (slug) return slug;

  return "slide-react-deck";
}

export function createSlideImageFileName({ index, title }: { index: number; title?: string }) {
  const safeIndex = Number.isFinite(index) && index > 0 ? Math.floor(index) : 1;
  const slug = slugifySegment(title ?? "");
  const suffix = slug || `slide-${safeIndex}`;
  return `${String(safeIndex).padStart(3, "0")}-${suffix}.png`;
}

export function createSlideSnapshotFileName({
  index,
  title,
  clickStep,
}: {
  index: number;
  title?: string;
  clickStep?: number | null;
}) {
  const safeIndex = Number.isFinite(index) && index > 0 ? Math.floor(index) : 1;
  const slug = slugifySegment(title ?? "");
  const suffix = slug || `slide-${safeIndex}`;
  const clickSuffix =
    typeof clickStep === "number" && Number.isFinite(clickStep) ? `-click-${clickStep}` : "";
  return `${String(safeIndex).padStart(3, "0")}-${suffix}${clickSuffix}.png`;
}
