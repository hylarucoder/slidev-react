import { readFileSync } from "node:fs";
import type { Plugin } from "vite";
import { parse as parseYaml } from "yaml";

const VIRTUAL_THEME = "virtual:slidev-react/active-theme";
const RESOLVED_VIRTUAL = "\0" + VIRTUAL_THEME;

function extractThemeIdFromSlidesFile(slidesSourceFile: string): string | undefined {
  let source: string;
  try {
    source = readFileSync(slidesSourceFile, "utf8");
  } catch {
    return undefined;
  }

  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return undefined;

  try {
    const data = parseYaml(match[1]);
    return typeof data?.theme === "string" ? data.theme : undefined;
  } catch {
    return undefined;
  }
}

function resolveThemePackage(themeId: string): string | undefined {
  const candidates = [
    `@slidev-react/theme-${themeId}`,
    `slidev-react-theme-${themeId}`,
  ];

  for (const pkg of candidates) {
    try {
      require.resolve(pkg);
      return pkg;
    } catch {
      // Not installed.
    }
  }

  return undefined;
}

function generateThemeModuleCode(options: {
  themeId: string | undefined;
}): string {
  const { themeId } = options;

  if (!themeId) {
    return "export default undefined;\n";
  }

  // Check npm package
  const themePackage = resolveThemePackage(themeId);
  if (themePackage) {
    return [
      `import theme from '${themePackage}';`,
      `import '${themePackage}/style.css';`,
      `export default theme;`,
      "",
    ].join("\n");
  }

  console.warn(
    `[slidev-react] Theme "${themeId}" not found. Falling back to default theme.`,
  );
  return "export default undefined;\n";
}

export function pluginTheme(options: {
  slidesSourceFile: string;
}): Plugin {
  const themeId = extractThemeIdFromSlidesFile(options.slidesSourceFile);

  return {
    name: "slidev-react:themes",
    enforce: "pre",

    resolveId(id) {
      if (id === VIRTUAL_THEME) return RESOLVED_VIRTUAL;
    },

    load(id) {
      if (id !== RESOLVED_VIRTUAL) return;
      return generateThemeModuleCode({ themeId });
    },
  };
}
