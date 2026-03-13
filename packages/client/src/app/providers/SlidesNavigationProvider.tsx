import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  buildSlidesPath,
  clampSlideIndex,
  normalizePathname,
  resolveSlidesLocationState,
  type PresentationRouteMode,
} from "../../features/presentation/location";

interface SlidesContextValue {
  currentIndex: number;
  total: number;
  next: () => void;
  prev: () => void;
  first: () => void;
  last: () => void;
  goTo: (index: number) => void;
}

const SlidesContext = createContext<SlidesContextValue | null>(null);

export function SlidesNavigationProvider({
  total,
  children,
}: {
  total: number;
  children: React.ReactNode;
}) {
  const initialLocation = resolveSlidesLocationState(window.location.pathname, total);
  const [currentIndex, setCurrentIndex] = useState(initialLocation.index);
  const routeModeRef = useRef<PresentationRouteMode | null>(initialLocation.mode);

  useEffect(() => {
    setCurrentIndex((index) => clampSlideIndex(index, total));
  }, [total]);

  useEffect(() => {
    const syncFromLocation = () => {
      const locationState = resolveSlidesLocationState(window.location.pathname, total);
      routeModeRef.current = locationState.mode;
      setCurrentIndex(locationState.index);
    };

    window.addEventListener("popstate", syncFromLocation);
    return () => {
      window.removeEventListener("popstate", syncFromLocation);
    };
  }, [total]);

  useEffect(() => {
    const routeMode =
      routeModeRef.current ?? resolveSlidesLocationState(window.location.pathname, total).mode;

    const nextPath = buildSlidesPath(routeMode, currentIndex);
    const currentPath = normalizePathname(window.location.pathname);

    if (currentPath !== nextPath || window.location.hash)
      window.history.replaceState(null, "", nextPath);
  }, [currentIndex]);

  const value = useMemo<SlidesContextValue>(
    () => ({
      currentIndex,
      total,
      next: () => setCurrentIndex((index) => clampSlideIndex(index + 1, total)),
      prev: () => setCurrentIndex((index) => clampSlideIndex(index - 1, total)),
      first: () => setCurrentIndex(0),
      last: () => setCurrentIndex(Math.max(total - 1, 0)),
      goTo: (index: number) => setCurrentIndex(clampSlideIndex(index, total)),
    }),
    [currentIndex, total],
  );

  return <SlidesContext.Provider value={value}>{children}</SlidesContext.Provider>;
}

export function useSlidesState() {
  const context = useContext(SlidesContext);
  if (!context) throw new Error("useSlidesState must be used inside SlidesNavigationProvider");

  return context;
}
