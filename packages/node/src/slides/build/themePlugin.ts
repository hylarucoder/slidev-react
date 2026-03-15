import type { Plugin } from "vite";
import { readSlidesDeckExtensions, resolveThemeExtension } from "./extensionResolution.ts";

const VIRTUAL_THEME = "virtual:slidev-react/active-theme";
const RESOLVED_VIRTUAL = "\0" + VIRTUAL_THEME;

function generateThemeModuleCode(options: {
  appRoot: string;
  slidesSourceFile: string;
}): string {
  const { appRoot, slidesSourceFile } = options;
  const { themeId } = readSlidesDeckExtensions(slidesSourceFile);

  if (!themeId) {
    return "export default undefined;\n";
  }

  const resolvedTheme = resolveThemeExtension(appRoot, themeId);
  if (!resolvedTheme) {
    throw new Error(
      `[slidev-react] Theme "${themeId}" was declared but could not be resolved. Add packages/theme-${themeId}/index.ts or install @slidev-react/theme-${themeId}.`,
    );
  }

  return [
    `import theme from '${resolvedTheme.importPath}';`,
    ...(resolvedTheme.styleImportPath ? [`import '${resolvedTheme.styleImportPath}';`] : []),
    `export default theme;`,
    "",
  ].join("\n");
}

export function pluginTheme(options: {
  appRoot: string;
  slidesSourceFile: string;
}): Plugin {
  return {
    name: "slidev-react:themes",
    enforce: "pre",

    resolveId(id) {
      if (id === VIRTUAL_THEME) return RESOLVED_VIRTUAL;
    },

    load(id) {
      if (id !== RESOLVED_VIRTUAL) return;
      return generateThemeModuleCode(options);
    },
  };
}
