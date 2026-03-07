export type PresentationExportMode = "print";

function normalizeExportMode(value: string | null): PresentationExportMode | null {
  if (!value) return null;

  return value === "print" ? value : null;
}

export function resolvePresentationExportMode(search: string): PresentationExportMode | null {
  return normalizeExportMode(new URLSearchParams(search).get("export"));
}

export function resolvePrintExportWithClicks(search: string) {
  const value = new URLSearchParams(search).get("with-clicks");
  return value === "1" || value === "true";
}

export function buildPrintExportUrl(
  url: string,
  options?: {
    withClicks?: boolean;
  },
) {
  const next = new URL(url);
  next.searchParams.set("export", "print");
  if (options?.withClicks) next.searchParams.set("with-clicks", "1");
  else next.searchParams.delete("with-clicks");
  next.hash = "";
  return next.toString();
}

export function buildDeckUrl(url: string) {
  const next = new URL(url);
  next.searchParams.delete("export");
  next.hash = "";
  return next.toString();
}
