import type { ThemeMDXComponents, LayoutRegistry } from "../theme/types";
import type { ComponentType, ReactNode } from "react";

export type AddonProviderComponent = ComponentType<{ children: ReactNode }>;

export interface SlideAddonDefinition {
  id: string;
  label: string;
  experimental?: boolean;
  provider?: AddonProviderComponent;
  layouts?: LayoutRegistry;
  mdxComponents?: ThemeMDXComponents;
}

export interface ResolvedSlideAddons {
  definitions: SlideAddonDefinition[];
  providers: AddonProviderComponent[];
  layouts: LayoutRegistry;
  mdxComponents: ThemeMDXComponents;
}
