import path from "node:path";
import type { Plugin } from "vite";
import { readSlidesDeckExtensions } from "./deckExtensions.ts";
import { resolveThemeExtension } from "./resolveExtensions.ts";

const VIRTUAL_THEME = "virtual:slidev-react/active-theme";
const RESOLVED_VIRTUAL = "\0" + VIRTUAL_THEME;

/**
 * Kami is the design language, so a deck with no `theme:` resolves to it through the
 * normal extension path. Falling through to `export default undefined` would leave the
 * client on its Kami token fallback but without `kami/style.css`, which is where the
 * design system's invariants actually live.
 */
const DEFAULT_THEME_ID = "kami";

function generateThemeModuleCode(options: { appRoot: string; slidesSourceFile: string }): string {
  const { appRoot, slidesSourceFile } = options;
  const { themeId } = readSlidesDeckExtensions(slidesSourceFile);
  const activeThemeId = themeId ?? DEFAULT_THEME_ID;

  const resolvedTheme = resolveThemeExtension(appRoot, activeThemeId);
  if (!resolvedTheme) {
    throw new Error(
      `[slidev-react] Theme "${activeThemeId}" was declared but could not be resolved. Use a built-in theme, add packages/theme-${activeThemeId}/index.ts, or install @slidev-react/theme-${activeThemeId}.`,
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
