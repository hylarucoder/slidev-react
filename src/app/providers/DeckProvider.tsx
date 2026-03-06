import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  buildRolePathFromBase,
  buildStandalonePathFromBase,
  parsePresentationPath,
  parseStandalonePath,
  resolvePresentationBasePath,
  type PresentationPathRole,
} from "../../features/presentation/path";

interface DeckContextValue {
  currentIndex: number;
  total: number;
  next: () => void;
  prev: () => void;
  first: () => void;
  last: () => void;
  goTo: (index: number) => void;
}

const DeckContext = createContext<DeckContextValue | null>(null);

interface PathMatch {
  role: PresentationPathRole;
  index: number;
  basePath: string;
}

interface StandalonePathMatch {
  index: number;
  basePath: string;
}

type RouteMode =
  | {
      kind: "role";
      role: PresentationPathRole;
      basePath: string;
    }
  | {
      kind: "standalone";
      basePath: string;
    };

function clamp(index: number, total: number): number {
  return Math.min(Math.max(index, 0), Math.max(total - 1, 0));
}

function parseLegacyHash(hash: string, total: number): number | null {
  const match = hash.match(/^#\/(\d+)$/);
  if (!match) return null;

  const oneBased = Number.parseInt(match[1], 10);
  if (Number.isNaN(oneBased)) return null;

  return clamp(oneBased - 1, total);
}

function parsePresentationPathMatch(pathname: string, total: number): PathMatch | null {
  const parsed = parsePresentationPath(pathname);
  if (!parsed) return null;

  const oneBased = parsed.slideNumber ?? 1;

  if (Number.isNaN(oneBased) || oneBased < 1) {
    return {
      role: parsed.role,
      index: 0,
      basePath: parsed.basePath,
    };
  }

  return {
    role: parsed.role,
    index: clamp(oneBased - 1, total),
    basePath: parsed.basePath,
  };
}

function parseStandalonePathMatch(pathname: string, total: number): StandalonePathMatch | null {
  const parsed = parseStandalonePath(pathname);
  if (!parsed) return null;

  return {
    index: clamp(parsed.slideNumber - 1, total),
    basePath: parsed.basePath,
  };
}

function normalizePath(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);

  return pathname;
}

export function DeckProvider({ total, children }: { total: number; children: React.ReactNode }) {
  const initialLocation =
    typeof window === "undefined"
      ? null
      : (() => {
          const rolePath = parsePresentationPathMatch(window.location.pathname, total);
          if (rolePath) {
            return {
              index: rolePath.index,
              mode: {
                kind: "role",
                role: rolePath.role,
                basePath: rolePath.basePath,
              } satisfies RouteMode,
            };
          }

          const standalonePath = parseStandalonePathMatch(window.location.pathname, total);
          if (standalonePath) {
            return {
              index: standalonePath.index,
              mode: {
                kind: "standalone",
                basePath: standalonePath.basePath,
              } satisfies RouteMode,
            };
          }

          return {
            index: parseLegacyHash(window.location.hash, total) ?? 0,
            mode: {
              kind: "standalone",
              basePath: resolvePresentationBasePath(window.location.pathname),
            } satisfies RouteMode,
          };
        })();
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (typeof window === "undefined") return 0;

    return initialLocation?.index ?? 0;
  });
  const routeModeRef = useRef<RouteMode | null>(initialLocation?.mode ?? null);

  useEffect(() => {
    setCurrentIndex((index) => clamp(index, total));
  }, [total]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncFromLocation = () => {
      const rolePath = parsePresentationPathMatch(window.location.pathname, total);
      if (rolePath) {
        routeModeRef.current = {
          kind: "role",
          role: rolePath.role,
          basePath: rolePath.basePath,
        };
        setCurrentIndex(rolePath.index);
        return;
      }

      const standalonePath = parseStandalonePathMatch(window.location.pathname, total);
      if (standalonePath) {
        routeModeRef.current = {
          kind: "standalone",
          basePath: standalonePath.basePath,
        };
        setCurrentIndex(standalonePath.index);
        return;
      }

      routeModeRef.current = {
        kind: "standalone",
        basePath: resolvePresentationBasePath(window.location.pathname),
      };

      const legacyIndex = parseLegacyHash(window.location.hash, total);
      if (legacyIndex !== null) setCurrentIndex(legacyIndex);
    };

    window.addEventListener("hashchange", syncFromLocation);
    window.addEventListener("popstate", syncFromLocation);
    return () => {
      window.removeEventListener("hashchange", syncFromLocation);
      window.removeEventListener("popstate", syncFromLocation);
    };
  }, [total]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const routeMode = routeModeRef.current ?? {
      kind: "standalone" as const,
      basePath: resolvePresentationBasePath(window.location.pathname),
    };

    const nextPath =
      routeMode.kind === "role"
        ? buildRolePathFromBase(routeMode.basePath, routeMode.role, currentIndex + 1)
        : buildStandalonePathFromBase(routeMode.basePath, currentIndex + 1);
    const currentPath = normalizePath(window.location.pathname);

    if (currentPath !== nextPath || window.location.hash)
      window.history.replaceState(null, "", nextPath);
  }, [currentIndex]);

  const value = useMemo<DeckContextValue>(
    () => ({
      currentIndex,
      total,
      next: () => setCurrentIndex((index) => clamp(index + 1, total)),
      prev: () => setCurrentIndex((index) => clamp(index - 1, total)),
      first: () => setCurrentIndex(0),
      last: () => setCurrentIndex(Math.max(total - 1, 0)),
      goTo: (index: number) => setCurrentIndex(clamp(index, total)),
    }),
    [currentIndex, total],
  );

  return <DeckContext.Provider value={value}>{children}</DeckContext.Provider>;
}

export function useDeck() {
  const context = useContext(DeckContext);
  if (!context) throw new Error("useDeck must be used inside DeckProvider");

  return context;
}
