import type { ComponentType, ReactNode } from "react";
import type { LayoutName } from "../slides/layout";

export type LayoutComponent = ComponentType<{ children: ReactNode }>;

export type LayoutRegistry = Partial<Record<LayoutName, LayoutComponent>>;

export type ThemeProviderComponent = ComponentType<{ children: ReactNode }>;

/**
 * MDX component overrides that a theme can provide.
 * Keys are component names (e.g. "Badge", "Callout"), values are React components.
 */
export type ThemeMDXComponents = Record<string, ComponentType<any>>;

export interface SlideThemeDefinition {
  id: string;
  label: string;
  colorScheme?: "light" | "dark";
  rootAttributes?: Record<string, string>;
  rootClassName?: string;
  provider?: ThemeProviderComponent;
  layouts?: LayoutRegistry;
  mdxComponents?: ThemeMDXComponents;
}

export interface ResolvedSlideTheme {
  definition: SlideThemeDefinition;
  rootAttributes: Record<string, string>;
  rootClassName?: string;
  provider?: ThemeProviderComponent;
  layouts: LayoutRegistry;
  mdxComponents: ThemeMDXComponents;
}

export function defineTheme(theme: SlideThemeDefinition): SlideThemeDefinition {
  return theme;
}
