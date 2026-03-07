import type { MDXComponents } from "mdx/types";
import type { LayoutRegistry } from "../theme/layouts/types";
import type { ResolvedSlideAddons, SlideAddonDefinition } from "./types";

import.meta.glob("./*/style.css", { eager: true });

const addonModules = import.meta.glob<{ addon?: SlideAddonDefinition }>("./*/index.ts", {
  eager: true,
});

const registeredAddons = Object.values(addonModules)
  .map((module) => module.addon)
  .filter((addon): addon is SlideAddonDefinition => Boolean(addon));

const addonMap = new Map(registeredAddons.map((addon) => [addon.id, addon]));

function normalizeAddonIds(addonIds?: string[]) {
  return [...new Set((addonIds ?? []).map((addonId) => addonId.trim()).filter(Boolean))];
}

function mergeLayouts(definitions: SlideAddonDefinition[]): LayoutRegistry {
  return definitions.reduce<LayoutRegistry>(
    (layouts, definition) => ({
      ...layouts,
      ...definition.layouts,
    }),
    {},
  );
}

function mergeMdxComponents(definitions: SlideAddonDefinition[]): MDXComponents {
  return definitions.reduce<MDXComponents>(
    (components, definition) => ({
      ...components,
      ...definition.mdxComponents,
    }),
    {},
  );
}

export function listRegisteredAddons() {
  return [...addonMap.values()];
}

export function resolveAddonDefinitions(addonIds?: string[]) {
  return normalizeAddonIds(addonIds)
    .map((addonId) => addonMap.get(addonId))
    .filter((addon): addon is SlideAddonDefinition => Boolean(addon));
}

export function resolveSlideAddons(addonIds?: string[]): ResolvedSlideAddons {
  const definitions = resolveAddonDefinitions(addonIds);

  return {
    definitions,
    providers: definitions
      .map((definition) => definition.provider)
      .filter((provider): provider is NonNullable<typeof provider> => Boolean(provider)),
    layouts: mergeLayouts(definitions),
    mdxComponents: mergeMdxComponents(definitions),
  };
}
