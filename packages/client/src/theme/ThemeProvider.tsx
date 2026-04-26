import { createContext, useContext, useInsertionEffect, useMemo, type ReactNode } from "react";
import { isPortraitViewport, type SlidesViewport } from "@slidev-react/core/slides/viewport";
import { resolveSlideTheme } from "./registry";
import { themeTokensToCssVars } from "./themeTokens";
import type { ResolvedSlideTheme } from "./types";

const ThemeContext = createContext<ResolvedSlideTheme | null>(null);

export function resolveThemeRootAttributes(
  theme: ResolvedSlideTheme,
  slidesViewport?: SlidesViewport,
) {
  return {
    ...theme.rootAttributes,
    "data-slide-color-scheme": theme.definition.colorScheme ?? "light",
    ...(slidesViewport
      ? {
          "data-slide-viewport-orientation": isPortraitViewport(slidesViewport)
            ? "portrait"
            : "landscape",
        }
      : {}),
  };
}

function applyRootThemeAttributes(theme: ResolvedSlideTheme, slidesViewport?: SlidesViewport) {
  if (typeof document === "undefined") return () => {};

  const root = document.documentElement;
  const appliedEntries = Object.entries(resolveThemeRootAttributes(theme, slidesViewport));
  const cssVars = Object.entries(themeTokensToCssVars(theme.tokens));
  const previousAttributes = new Map(
    appliedEntries.map(([name]) => [name, root.getAttribute(name)]),
  );
  const previousCssVars = new Map(
    cssVars.map(([name]) => [
      name,
      {
        priority: root.style.getPropertyPriority(name),
        value: root.style.getPropertyValue(name),
      },
    ]),
  );
  const hadThemeClass = theme.rootClassName ? root.classList.contains(theme.rootClassName) : false;
  const previousColorScheme = root.style.colorScheme;

  for (const [name, value] of appliedEntries) {
    root.setAttribute(name, value);
  }

  for (const [name, value] of cssVars) {
    root.style.setProperty(name, value);
  }

  root.style.colorScheme = theme.definition.colorScheme ?? "light";
  if (theme.rootClassName) root.classList.add(theme.rootClassName);

  return () => {
    for (const [name] of appliedEntries) {
      const previousValue = previousAttributes.get(name);
      if (previousValue === null || previousValue === undefined) root.removeAttribute(name);
      else root.setAttribute(name, previousValue);
    }

    for (const [name] of cssVars) {
      const previousValue = previousCssVars.get(name);
      if (!previousValue?.value) root.style.removeProperty(name);
      else root.style.setProperty(name, previousValue.value, previousValue.priority);
    }

    root.style.colorScheme = previousColorScheme;
    if (theme.rootClassName && !hadThemeClass) root.classList.remove(theme.rootClassName);
  };
}

export function ThemeProvider({
  slidesViewport,
  children,
}: {
  slidesViewport?: SlidesViewport;
  children: ReactNode;
}) {
  const theme = useMemo(() => resolveSlideTheme(), []);

  useInsertionEffect(
    () => applyRootThemeAttributes(theme, slidesViewport),
    [slidesViewport, theme],
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useSlideTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useSlideTheme must be used inside ThemeProvider");

  return context;
}

export function useSlideThemeTokens() {
  return useSlideTheme().tokens;
}
