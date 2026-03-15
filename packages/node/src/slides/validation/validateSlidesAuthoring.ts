import type { SlidesDocument } from "@slidev-react/core/slides/slides";
import { layoutNames } from "@slidev-react/core/slides/layout";
import {
  readAddonLayoutIds,
  readThemeLayoutIds,
  resolveAddonExtension,
  resolveThemeExtension,
} from "../build/extensionResolution.ts";

function collectKnownLayouts() {
  return new Set<string>(layoutNames);
}

function formatSlideLabel(slide: SlidesDocument["slides"][number]) {
  return slide.meta.title
    ? `slide ${slide.index + 1} (${slide.meta.title})`
    : `slide ${slide.index + 1}`;
}

export async function validateSlidesAuthoring({
  appRoot,
  slides,
}: {
  appRoot: string;
  slides: SlidesDocument;
}) {
  const warnings: string[] = [];
  const knownLayouts = collectKnownLayouts();

  const resolvedTheme = slides.meta.theme
    ? resolveThemeExtension(appRoot, slides.meta.theme)
    : null;

  if (slides.meta.theme && !resolvedTheme) {
    warnings.push(
      `Unknown theme "${slides.meta.theme}". Add packages/theme-${slides.meta.theme}/index.ts or install @slidev-react/theme-${slides.meta.theme}.`,
    );
  }

  for (const layoutName of await readThemeLayoutIds(resolvedTheme)) {
    knownLayouts.add(layoutName);
  }

  for (const addonId of slides.meta.addons ?? []) {
    const resolvedAddon = resolveAddonExtension(appRoot, addonId);
    if (!resolvedAddon) {
      warnings.push(
        `Unknown addon "${addonId}". Add packages/addon-${addonId}/index.ts or install @slidev-react/addon-${addonId}.`,
      );
      continue;
    }

    for (const layoutName of await readAddonLayoutIds(resolvedAddon)) {
      knownLayouts.add(layoutName);
    }
  }

  if (slides.meta.layout && !knownLayouts.has(slides.meta.layout)) {
    warnings.push(
      `Unknown slides layout "${slides.meta.layout}". The runtime will fall back to the default layout.`,
    );
  }

  for (const slide of slides.slides) {
    const slideLayout = slide.meta.layout;
    if (!slideLayout || knownLayouts.has(slideLayout)) continue;

    warnings.push(
      `Unknown layout "${slideLayout}" in ${formatSlideLabel(slide)}. The runtime will fall back to the default layout.`,
    );
  }

  const declaredAddons = new Set(slides.meta.addons ?? []);
  const allSource = slides.slides.map((slide) => slide.source).join("\n");

  if (!declaredAddons.has("mermaid") && /^```mermaid\s*$/m.test(allSource)) {
    warnings.push(
      'Slides contain mermaid code fences but the "mermaid" addon is not declared. Add addons: ["mermaid"] to the deck frontmatter.',
    );
  }

  return warnings;
}
