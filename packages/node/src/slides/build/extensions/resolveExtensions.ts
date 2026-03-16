import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  loadClientRuntimeManifest,
  type ClientRuntimeAddonManifestEntry,
  type ClientRuntimeThemeManifestEntry,
} from "../runtime/runtimeManifest.ts";
import type { ResolvedAddonExtension, ResolvedThemeExtension } from "./types.ts";

const LOCAL_DEFINITION_FILES = ["index.ts", "index.tsx", "index.js", "index.jsx"];
const LOCAL_STYLE_FILE = "style.css";
const THEME_PACKAGE_PREFIX = "theme-";
const ADDON_PACKAGE_PREFIX = "addon-";

function findDefinitionFile(rootDir: string) {
  for (const fileName of LOCAL_DEFINITION_FILES) {
    const filePath = path.join(rootDir, fileName);
    if (existsSync(filePath)) return filePath;
  }

  return null;
}

function resolvePackageStyleEntry(packageName: string) {
  try {
    return import.meta.resolve(`${packageName}/style.css`);
  } catch {
    return undefined;
  }
}

function resolvePackageImport(specifier: string) {
  try {
    return import.meta.resolve(specifier);
  } catch {
    return null;
  }
}

function resolveThemePackage(id: string) {
  const candidates = [`@slidev-react/theme-${id}`, `slidev-react-theme-${id}`];

  for (const packageName of candidates) {
    const importPath = resolvePackageImport(packageName);
    if (importPath) {
      return {
        id,
        importPath,
        styleImportPath: resolvePackageStyleEntry(packageName),
        source: "package" as const,
      };
    }
  }

  return null;
}

function resolveAddonPackage(id: string) {
  const candidates = [`@slidev-react/addon-${id}`, `slidev-react-addon-${id}`];

  for (const packageName of candidates) {
    const importPath = resolvePackageImport(packageName);
    if (importPath) {
      return {
        id,
        importPath,
        styleImportPath: resolvePackageStyleEntry(packageName),
        source: "package" as const,
      };
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

function resolveBuiltinTheme(id: string): ResolvedThemeExtension | null {
  const theme = loadClientRuntimeManifest().themes.find((entry) => entry.id === id);
  if (!theme) return null;

  return {
    id: theme.id,
    importPath: theme.module,
    styleImportPath: theme.style,
    source: "builtin",
  };
}

export function resolveThemeExtension(appRoot: string, id: string) {
  return resolveBuiltinTheme(id) ?? resolveLocalTheme(appRoot, id) ?? resolveThemePackage(id);
}

export function resolveAddonExtension(appRoot: string, id: string) {
  return resolveBuiltinAddon(id) ?? resolveLocalAddon(appRoot, id) ?? resolveAddonPackage(id);
}

export function listBuiltinAddonIds() {
  return loadClientRuntimeManifest().addons.map((addon) => addon.id);
}

export function listBuiltinAddons() {
  return loadClientRuntimeManifest().addons.slice() as ClientRuntimeAddonManifestEntry[];
}

export function listBuiltinThemes() {
  return loadClientRuntimeManifest().themes.slice() as ClientRuntimeThemeManifestEntry[];
}
