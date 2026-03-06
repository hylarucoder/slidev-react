export type PresentationPathRole = "presenter";

const ROLE_SET: ReadonlySet<PresentationPathRole> = new Set(["presenter"]);

export interface ParsedPresentationPath {
  role: PresentationPathRole;
  slideNumber: number | null;
  basePath: string;
}

export interface ParsedStandalonePath {
  slideNumber: number;
  basePath: string;
}

function normalizePath(pathname: string) {
  if (!pathname) return "/";

  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);

  return pathname;
}

function normalizeBasePath(basePath: string) {
  const normalized = normalizePath(basePath);
  if (normalized === "/") return "";

  return normalized;
}

function toSegments(pathname: string) {
  return normalizePath(pathname).split("/").filter(Boolean);
}

function toPath(segments: string[]) {
  if (segments.length === 0) return "";

  return `/${segments.join("/")}`;
}

export function parsePresentationPath(pathname: string): ParsedPresentationPath | null {
  const segments = toSegments(pathname);
  if (segments.length === 0) return null;

  const last = segments[segments.length - 1];
  if (ROLE_SET.has(last as PresentationPathRole)) {
    return {
      role: last as PresentationPathRole,
      slideNumber: null,
      basePath: toPath(segments.slice(0, -1)),
    };
  }

  const maybeSlideNumber = Number.parseInt(last, 10);
  if (!Number.isNaN(maybeSlideNumber) && maybeSlideNumber > 0 && segments.length >= 2) {
    const maybeRole = segments[segments.length - 2];
    if (ROLE_SET.has(maybeRole as PresentationPathRole)) {
      return {
        role: maybeRole as PresentationPathRole,
        slideNumber: maybeSlideNumber,
        basePath: toPath(segments.slice(0, -2)),
      };
    }
  }

  return null;
}

export function parseStandalonePath(pathname: string): ParsedStandalonePath | null {
  const parsedPresentation = parsePresentationPath(pathname);
  if (parsedPresentation) return null;

  const segments = toSegments(pathname);
  if (segments.length === 0) return null;

  const maybeSlideNumber = Number.parseInt(segments[segments.length - 1], 10);
  if (Number.isNaN(maybeSlideNumber) || maybeSlideNumber < 1) return null;

  return {
    slideNumber: maybeSlideNumber,
    basePath: toPath(segments.slice(0, -1)),
  };
}

export function resolvePresentationBasePath(pathname: string) {
  const parsed = parsePresentationPath(pathname);
  if (parsed) return normalizeBasePath(parsed.basePath);

  const parsedStandalone = parseStandalonePath(pathname);
  if (parsedStandalone) return normalizeBasePath(parsedStandalone.basePath);

  const normalized = normalizePath(pathname);
  if (normalized === "/") return "";

  if (normalized === "/index.html") return "";

  if (normalized.endsWith("/index.html"))
    return normalizeBasePath(normalized.slice(0, -"/index.html".length));

  return normalizeBasePath(normalized);
}

export function buildRolePathFromBase(
  basePath: string,
  role: PresentationPathRole,
  slideNumber: number,
) {
  const normalizedBase = normalizeBasePath(basePath);
  const safeSlideNumber =
    Number.isFinite(slideNumber) && slideNumber > 0 ? Math.floor(slideNumber) : 1;

  if (!normalizedBase) return `/${role}/${safeSlideNumber}`;

  return `${normalizedBase}/${role}/${safeSlideNumber}`;
}

export function buildRolePathFromPathname(
  pathname: string,
  role: PresentationPathRole,
  slideNumber: number,
) {
  return buildRolePathFromBase(resolvePresentationBasePath(pathname), role, slideNumber);
}

export function buildStandalonePathFromBase(basePath: string, slideNumber: number) {
  const normalizedBase = normalizeBasePath(basePath);
  const safeSlideNumber =
    Number.isFinite(slideNumber) && slideNumber > 0 ? Math.floor(slideNumber) : 1;

  if (!normalizedBase) return `/${safeSlideNumber}`;

  return `${normalizedBase}/${safeSlideNumber}`;
}

export function buildStandalonePathFromPathname(pathname: string, slideNumber: number) {
  return buildStandalonePathFromBase(resolvePresentationBasePath(pathname), slideNumber);
}
