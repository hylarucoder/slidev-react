import {
  buildRolePathFromBase,
  buildStandalonePathFromBase,
  parsePresentationPath,
  parseStandalonePath,
  resolvePresentationBasePath,
  type PresentationPathRole,
} from "./path";

export interface PresentationRouteMode {
  kind: "role" | "standalone";
  basePath: string;
  role?: PresentationPathRole;
}

export interface SlidesLocationState {
  index: number;
  mode: PresentationRouteMode;
}

export interface SessionLocationState {
  enabled: boolean;
  role: "presenter" | "viewer";
  currentSlideNumber: number;
  normalizedPath: string | null;
}

export function clampSlideIndex(index: number, total: number): number {
  return Math.min(Math.max(index, 0), Math.max(total - 1, 0));
}

export function resolveSlidesLocationState(pathname: string, total: number): SlidesLocationState {
  const parsedPresentation = parsePresentationPath(pathname);
  if (parsedPresentation) {
    return {
      index: clampSlideIndex((parsedPresentation.slideNumber ?? 1) - 1, total),
      mode: {
        kind: "role",
        role: parsedPresentation.role,
        basePath: parsedPresentation.basePath,
      },
    };
  }

  const parsedStandalone = parseStandalonePath(pathname);
  if (parsedStandalone) {
    return {
      index: clampSlideIndex(parsedStandalone.slideNumber - 1, total),
      mode: {
        kind: "standalone",
        basePath: parsedStandalone.basePath,
      },
    };
  }

  return {
    index: clampSlideIndex(0, total),
    mode: {
      kind: "standalone",
      basePath: resolvePresentationBasePath(pathname),
    },
  };
}

export function resolveSessionLocationState(pathname: string): SessionLocationState {
  const parsedPresentation = parsePresentationPath(pathname);
  if (parsedPresentation) {
    const currentSlideNumber = parsedPresentation.slideNumber ?? 1;
    return {
      enabled: true,
      role: "presenter",
      currentSlideNumber,
      normalizedPath: buildRolePathFromBase(
        parsedPresentation.basePath,
        parsedPresentation.role,
        currentSlideNumber,
      ),
    };
  }

  const parsedStandalone = parseStandalonePath(pathname);
  if (parsedStandalone) {
    return {
      enabled: true,
      role: "viewer",
      currentSlideNumber: parsedStandalone.slideNumber,
      normalizedPath: buildStandalonePathFromBase(
        parsedStandalone.basePath,
        parsedStandalone.slideNumber,
      ),
    };
  }

  return {
    enabled: false,
    role: "viewer",
    currentSlideNumber: 1,
    normalizedPath: null,
  };
}

export function buildSlidesPath(mode: PresentationRouteMode, index: number) {
  const slideNumber = index + 1;
  return mode.kind === "role"
    ? buildRolePathFromBase(mode.basePath, mode.role ?? "presenter", slideNumber)
    : buildStandalonePathFromBase(mode.basePath, slideNumber);
}

export function normalizePathname(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);

  return pathname;
}
