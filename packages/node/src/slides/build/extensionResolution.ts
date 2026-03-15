import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parse as parseYaml } from "yaml";
import { loadClientRuntimeManifest, type ClientRuntimeAddonManifestEntry } from "./runtimeManifest.ts";

const require = createRequire(import.meta.url);
const LOCAL_DEFINITION_FILES = ["index.ts", "index.tsx", "index.js", "index.jsx"];
const LOCAL_STYLE_FILE = "style.css";
const THEME_PACKAGE_PREFIX = "theme-";
const ADDON_PACKAGE_PREFIX = "addon-";

export interface SlidesDeckExtensions {
  themeId?: string;
  addonIds: string[];
}

export interface ResolvedThemeExtension {
  id: string;
  importPath: string;
  styleImportPath?: string;
  definitionFilePath?: string;
  source: "local" | "package";
}

export interface ResolvedAddonExtension {
  id: string;
  importPath: string;
  styleImportPath?: string;
  definitionFilePath?: string;
  source: "builtin" | "local" | "package";
}

function findDefinitionFile(rootDir: string) {
  for (const fileName of LOCAL_DEFINITION_FILES) {
    const filePath = path.join(rootDir, fileName);
    if (existsSync(filePath)) return filePath;
  }

  return null;
}

function readDeckFrontmatter(slidesSourceFile: string) {
  try {
    const source = readFileSync(slidesSourceFile, "utf8");
    const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) return {};

    return parseYaml(match[1]) ?? {};
  } catch {
    return {};
  }
}

function normalizeAddonIds(addonIds: unknown) {
  if (!Array.isArray(addonIds)) return [];

  return [...new Set(
    addonIds.map((addonId) => (typeof addonId === "string" ? addonId.trim() : ""))
      .filter(Boolean),
  )];
}

function resolvePackageStyleEntry(packageName: string) {
  try {
    require.resolve(`${packageName}/style.css`);
    return `${packageName}/style.css`;
  } catch {
    return undefined;
  }
}

function resolveThemePackage(id: string) {
  const candidates = [`@slidev-react/theme-${id}`, `slidev-react-theme-${id}`];

  for (const packageName of candidates) {
    try {
      require.resolve(packageName);
      return {
        id,
        importPath: packageName,
        styleImportPath: resolvePackageStyleEntry(packageName),
        source: "package" as const,
      };
    } catch {
      // Try the next package candidate.
    }
  }

  return null;
}

function resolveAddonPackage(id: string) {
  const candidates = [`@slidev-react/addon-${id}`, `slidev-react-addon-${id}`];

  for (const packageName of candidates) {
    try {
      require.resolve(packageName);
      return {
        id,
        importPath: packageName,
        styleImportPath: resolvePackageStyleEntry(packageName),
        source: "package" as const,
      };
    } catch {
      // Try the next package candidate.
    }
  }

  return null;
}

function resolveLocalTheme(appRoot: string, id: string): ResolvedThemeExtension | null {
  const rootDir = path.join(appRoot, "packages", `${THEME_PACKAGE_PREFIX}${id}`);
  const definitionFilePath = findDefinitionFile(rootDir);
  if (!definitionFilePath) return null;

  const styleFilePath = path.join(rootDir, LOCAL_STYLE_FILE);

  return {
    id,
    importPath: pathToFileURL(definitionFilePath).href,
    styleImportPath: existsSync(styleFilePath) ? pathToFileURL(styleFilePath).href : undefined,
    definitionFilePath,
    source: "local",
  };
}

function resolveLocalAddon(appRoot: string, id: string): ResolvedAddonExtension | null {
  const rootDir = path.join(appRoot, "packages", `${ADDON_PACKAGE_PREFIX}${id}`);
  const definitionFilePath = findDefinitionFile(rootDir);
  if (!definitionFilePath) return null;

  const styleFilePath = path.join(rootDir, LOCAL_STYLE_FILE);

  return {
    id,
    importPath: pathToFileURL(definitionFilePath).href,
    styleImportPath: existsSync(styleFilePath) ? pathToFileURL(styleFilePath).href : undefined,
    definitionFilePath,
    source: "local",
  };
}

function resolveBuiltinAddon(id: string): ResolvedAddonExtension | null {
  const addon = loadClientRuntimeManifest().addons.find((entry) => entry.id === id);
  if (!addon) return null;

  return {
    id: addon.id,
    importPath: addon.module,
    styleImportPath: addon.style,
    source: "builtin",
  };
}

function extractObjectLiteralKeys(source: string, propertyName: string) {
  const propertyIndex = source.indexOf(`${propertyName}:`);
  if (propertyIndex === -1) return [];

  const objectStart = source.indexOf("{", propertyIndex);
  if (objectStart === -1) return [];

  let depth = 0;
  let objectEnd = -1;
  for (let index = objectStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;

    if (depth === 0) {
      objectEnd = index;
      break;
    }
  }

  if (objectEnd === -1) return [];

  const objectBody = source.slice(objectStart + 1, objectEnd);
  const keys = objectBody.matchAll(/(?:^|\n|\s)(["']?[\w-]+["']?)\s*:/g);

  return [...keys]
    .map((match) => match[1]?.replace(/^["']|["']$/g, ""))
    .filter((key): key is string => Boolean(key));
}

async function readLayoutsFromLocalDefinition(definitionFilePath: string) {
  try {
    const source = readFileSync(definitionFilePath, "utf8");
    return extractObjectLiteralKeys(source, "layouts");
  } catch {
    return [];
  }
}

function readLayoutsFromResolvedImport(importPath: string) {
  try {
    const resolvedImportPath = importPath.startsWith("file:")
      ? path.normalize(new URL(importPath).pathname)
      : require.resolve(importPath);
    const source = readFileSync(resolvedImportPath, "utf8");
    return extractObjectLiteralKeys(source, "layouts");
  } catch {
    return [];
  }
}

export function readSlidesDeckExtensions(slidesSourceFile: string): SlidesDeckExtensions {
  const frontmatter = readDeckFrontmatter(slidesSourceFile) as {
    theme?: unknown;
    addons?: unknown;
  };

  return {
    themeId: typeof frontmatter.theme === "string" ? frontmatter.theme.trim() || undefined : undefined,
    addonIds: normalizeAddonIds(frontmatter.addons),
  };
}

export function resolveThemeExtension(appRoot: string, id: string) {
  return resolveLocalTheme(appRoot, id) ?? resolveThemePackage(id);
}

export function resolveAddonExtension(appRoot: string, id: string) {
  return resolveBuiltinAddon(id) ?? resolveLocalAddon(appRoot, id) ?? resolveAddonPackage(id);
}

export function resolveThemeExtensionForSlides(appRoot: string, slidesSourceFile: string) {
  const { themeId } = readSlidesDeckExtensions(slidesSourceFile);
  return themeId ? resolveThemeExtension(appRoot, themeId) : null;
}

export function resolveAddonExtensionsForSlides(appRoot: string, slidesSourceFile: string) {
  const { addonIds } = readSlidesDeckExtensions(slidesSourceFile);
  return addonIds
    .map((addonId) => ({
      addonId,
      resolved: resolveAddonExtension(appRoot, addonId),
    }));
}

export async function readThemeLayoutIds(resolvedTheme: ResolvedThemeExtension | null) {
  if (!resolvedTheme) return [];

  if (resolvedTheme.source === "local" && resolvedTheme.definitionFilePath) {
    return readLayoutsFromLocalDefinition(resolvedTheme.definitionFilePath);
  }

  return readLayoutsFromResolvedImport(resolvedTheme.importPath);
}

export async function readAddonLayoutIds(resolvedAddon: ResolvedAddonExtension | null) {
  if (!resolvedAddon) return [];

  if (resolvedAddon.source === "local" && resolvedAddon.definitionFilePath) {
    return readLayoutsFromLocalDefinition(resolvedAddon.definitionFilePath);
  }

  return readLayoutsFromResolvedImport(resolvedAddon.importPath);
}

export function listBuiltinAddonIds() {
  return loadClientRuntimeManifest().addons.map((addon) => addon.id);
}

export function listBuiltinAddons() {
  return loadClientRuntimeManifest().addons.slice() as ClientRuntimeAddonManifestEntry[];
}
