import path from "node:path";
import type { Plugin } from "vite";
import { readSlidesDeckExtensions } from "./deckExtensions.ts";
import { resolveThemeExtension } from "./resolveExtensions.ts";

const VIRTUAL_THEME = "virtual:slidev-react/active-theme";
const RESOLVED_VIRTUAL = "\0" + VIRTUAL_THEME;

function generateThemeModuleCode(options: { appRoot: string; slidesSourceFile: string }): string {
  const { appRoot, slidesSourceFile } = options;
  const { themeId } = readSlidesDeckExtensions(slidesSourceFile);

  if (!themeId) {
    return "export default undefined;\n";
  }

  const resolvedTheme = resolveThemeExtension(appRoot, themeId);
  if (!resolvedTheme) {
    throw new Error(
      `[slidev-react] Theme "${themeId}" was declared but could not be resolved. Use a built-in theme, add packages/theme-${themeId}/index.ts, or install @slidev-react/theme-${themeId}.`,
    );
  }

  return [
    `import theme from '${resolvedTheme.importPath}';`,
    ...(resolvedTheme.styleImportPath ? [`import '${resolvedTheme.styleImportPath}';`] : []),
    `export default theme;`,
    "",
  ].join("\n");
}

export function pluginThemeModule(options: { appRoot: string; slidesSourceFile: string }): Plugin {
  const slidesSourceFile = path.resolve(options.slidesSourceFile);

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

    configureServer(server) {
      server.watcher.add(slidesSourceFile);
      const handleChange = (filePath: string) => {
        if (path.resolve(filePath) !== slidesSourceFile) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL);
        if (mod) server.moduleGraph.invalidateModule(mod);
      };

      server.watcher.on("change", handleChange);
      server.watcher.on("add", handleChange);
    },
  };
}
