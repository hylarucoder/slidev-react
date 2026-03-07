import type { MDXComponents } from "mdx/types";
import { mdxComponents as baseMdxComponents } from "../ui/mdx";
import { defaultLayouts } from "./layouts/defaultLayouts";
import type { ResolvedSlideTheme, SlideThemeDefinition } from "./types";

const defaultTheme: SlideThemeDefinition = {
  id: "default",
  label: "Default",
  colorScheme: "light",
  rootAttributes: {
    "data-slide-theme": "default",
  },
};

import.meta.glob("./themes/*/style.css", { eager: true });

const themeModules = import.meta.glob<{ theme?: SlideThemeDefinition }>("./themes/*/index.ts", {
  eager: true,
});

const registeredThemes = [
  defaultTheme,
  ...Object.values(themeModules)
    .map((module) => module.theme)
    .filter((theme): theme is SlideThemeDefinition => Boolean(theme)),
];

const themeMap = new Map(registeredThemes.map((theme) => [theme.id, theme]));

function mergeMdxComponents(themeComponents?: MDXComponents): MDXComponents {
  return {
    ...baseMdxComponents,
    ...themeComponents,
  };
}

export function listRegisteredThemes() {
  return [...themeMap.values()];
}

export function resolveThemeDefinition(themeId: string | undefined): SlideThemeDefinition {
  if (!themeId) return defaultTheme;

  return themeMap.get(themeId) ?? defaultTheme;
}

export function resolveSlideTheme(themeId: string | undefined): ResolvedSlideTheme {
  const definition = resolveThemeDefinition(themeId);

  return {
    definition,
    rootAttributes: definition.rootAttributes ?? {
      "data-slide-theme": definition.id,
    },
    rootClassName: definition.rootClassName,
    provider: definition.provider,
    layouts: {
      ...defaultLayouts,
      ...definition.layouts,
    },
    mdxComponents: mergeMdxComponents(definition.mdxComponents),
  };
}
