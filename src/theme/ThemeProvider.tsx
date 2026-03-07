import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { resolveSlideTheme } from "./registry";
import type { ResolvedSlideTheme } from "./types";

const ThemeContext = createContext<ResolvedSlideTheme | null>(null);

function applyRootThemeAttributes(theme: ResolvedSlideTheme) {
  if (typeof document === "undefined") return () => {};

  const root = document.documentElement;
  const appliedEntries = Object.entries(theme.rootAttributes);
  const previousAttributes = new Map(
    appliedEntries.map(([name]) => [name, root.getAttribute(name)]),
  );
  const hadThemeClass = theme.rootClassName ? root.classList.contains(theme.rootClassName) : false;

  for (const [name, value] of appliedEntries) {
    root.setAttribute(name, value);
  }

  if (theme.rootClassName) root.classList.add(theme.rootClassName);

  return () => {
    for (const [name] of appliedEntries) {
      const previousValue = previousAttributes.get(name);
      if (previousValue === null || previousValue === undefined) root.removeAttribute(name);
      else root.setAttribute(name, previousValue);
    }

    if (theme.rootClassName && !hadThemeClass) root.classList.remove(theme.rootClassName);
  };
}

export function ThemeProvider({ themeId, children }: { themeId?: string; children: ReactNode }) {
  const theme = useMemo(() => resolveSlideTheme(themeId), [themeId]);

  useEffect(() => applyRootThemeAttributes(theme), [theme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useSlideTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useSlideTheme must be used inside ThemeProvider");

  return context;
}
