import type { Plugin } from "vite";
import { readSlidesDeckExtensions, resolveAddonExtension } from "./extensionResolution.ts";

const VIRTUAL_ADDONS = "virtual:slidev-react/active-addons";
const RESOLVED_VIRTUAL_ADDONS = "\0" + VIRTUAL_ADDONS;

function generateAddonsModuleCode(options: {
  appRoot: string;
  slidesSourceFile: string;
}) {
  const { appRoot, slidesSourceFile } = options;
  const { addonIds } = readSlidesDeckExtensions(slidesSourceFile);

  const imports: string[] = [];
  const addonNames: string[] = [];

  addonIds.forEach((addonId, index) => {
    const resolvedAddon = resolveAddonExtension(appRoot, addonId);
    if (!resolvedAddon) {
      throw new Error(
        `[slidev-react] Addon "${addonId}" was declared but could not be resolved. Add packages/addon-${addonId}/index.ts or install @slidev-react/addon-${addonId}.`,
      );
    }

    const importName = `addon${index}`;
    imports.push(`import { addon as ${importName} } from '${resolvedAddon.importPath}'`);
    if (resolvedAddon.styleImportPath) {
      imports.push(`import '${resolvedAddon.styleImportPath}'`);
    }
    addonNames.push(importName);
  });

  return [
    ...imports,
    "",
    `const definitions = [${addonNames.join(", ")}]`,
    "",
    "const resolvedAddons = {",
    "  definitions,",
    "  providers: definitions",
    "    .map((definition) => definition.provider)",
    "    .filter(Boolean),",
    "  layouts: definitions.reduce((layouts, definition) => ({",
    "    ...layouts,",
    "    ...(definition.layouts ?? {}),",
    "  }), {}),",
    "  mdxComponents: definitions.reduce((components, definition) => ({",
    "    ...components,",
    "    ...(definition.mdxComponents ?? {}),",
    "  }), {}),",
    "}",
    "",
    "export default resolvedAddons",
    "",
  ].join("\n");
}

export function pluginAddons(options: {
  appRoot: string;
  slidesSourceFile: string;
}): Plugin {
  return {
    name: "slidev-react:addons",
    enforce: "pre",

    resolveId(id) {
      if (id === VIRTUAL_ADDONS) return RESOLVED_VIRTUAL_ADDONS;
    },

    load(id) {
      if (id !== RESOLVED_VIRTUAL_ADDONS) return;
      return generateAddonsModuleCode(options);
    },
  };
}
