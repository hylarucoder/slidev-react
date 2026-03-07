import type { MDXComponents } from "mdx/types";
import type { ComponentType, ReactNode } from "react";
import type { LayoutRegistry } from "../theme/layouts/types";

export type AddonProviderComponent = ComponentType<{ children: ReactNode }>;

export interface SlideAddonDefinition {
  id: string;
  label: string;
  experimental?: boolean;
  provider?: AddonProviderComponent;
  layouts?: LayoutRegistry;
  mdxComponents?: MDXComponents;
}

export interface ResolvedSlideAddons {
  definitions: SlideAddonDefinition[];
  providers: AddonProviderComponent[];
  layouts: LayoutRegistry;
  mdxComponents: MDXComponents;
}
