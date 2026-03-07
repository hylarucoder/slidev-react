import type { ComponentType, ReactNode } from "react";
import type { MDXComponents } from "mdx/types";
import type { LayoutRegistry } from "./layouts/types";

export interface SlideThemeDefinition {
  id: string;
  label: string;
  colorScheme?: "light" | "dark";
  rootAttributes?: Record<string, string>;
  rootClassName?: string;
  provider?: ThemeProviderComponent;
  layouts?: LayoutRegistry;
  mdxComponents?: MDXComponents;
}

export interface ResolvedSlideTheme {
  definition: SlideThemeDefinition;
  rootAttributes: Record<string, string>;
  rootClassName?: string;
  provider?: ThemeProviderComponent;
  layouts: LayoutRegistry;
  mdxComponents: MDXComponents;
}

export type ThemeProviderComponent = ComponentType<{ children: ReactNode }>;
