import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);

export interface ClientRuntimeAddonManifestEntry {
  id: string;
  module: string;
  style?: string;
}

export interface ClientRuntimeThemeManifestEntry {
  id: string;
  module: string;
  style?: string;
}

export interface ClientRuntimeManifest {
  runtimeEntry: string;
  styleEntry: string;
  addons: ClientRuntimeAddonManifestEntry[];
  themes: ClientRuntimeThemeManifestEntry[];
}

let manifestCache: ClientRuntimeManifest | null = null;

function resolveClientRuntimeSpecifier(specifier: string, packageRoot?: string) {
  const resolver = packageRoot
    ? createRequire(path.join(packageRoot, "package.json"))
    : require;

  return pathToFileURL(resolver.resolve(specifier)).href;
}

function findPackageRoot(startDir: string) {
  let currentDir = startDir;

  while (true) {
    const packageJsonPath = path.join(currentDir, "package.json");
    if (existsSync(packageJsonPath)) return currentDir;

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) return null;
    currentDir = parentDir;
  }
}

function findWorkspaceClientManifestPath() {
  const nodePackageRoot = findPackageRoot(path.dirname(fileURLToPath(import.meta.url)));
  if (!nodePackageRoot) return null;

  const workspaceClientRoot = path.resolve(nodePackageRoot, "..", "client");
  const manifestCandidates = [
    path.join(workspaceClientRoot, "dist", "manifest.json"),
    path.join(workspaceClientRoot, "manifest.json"),
  ];

  return manifestCandidates.find((candidate) => existsSync(candidate)) ?? null;
}

function readManifestFromPath(manifestPath: string) {
  return JSON.parse(readFileSync(manifestPath, "utf8")) as ClientRuntimeManifest;
}

function normalizeManifest(manifest: ClientRuntimeManifest, packageRoot?: string) {
  manifestCache = {
    runtimeEntry: resolveClientRuntimeSpecifier(manifest.runtimeEntry, packageRoot),
    styleEntry: resolveClientRuntimeSpecifier(manifest.styleEntry, packageRoot),
    addons: manifest.addons.map((addon) => ({
      ...addon,
      module: resolveClientRuntimeSpecifier(addon.module, packageRoot),
      style: addon.style
        ? resolveClientRuntimeSpecifier(addon.style, packageRoot)
        : undefined,
    })),
    themes: manifest.themes.map((theme) => ({
      ...theme,
      module: resolveClientRuntimeSpecifier(theme.module, packageRoot),
      style: theme.style
        ? resolveClientRuntimeSpecifier(theme.style, packageRoot)
        : undefined,
    })),
  };

  return manifestCache;
}

export function loadClientRuntimeManifest(): ClientRuntimeManifest {
  if (manifestCache) return manifestCache;

  const workspaceManifestPath = findWorkspaceClientManifestPath();
  if (workspaceManifestPath) {
    const workspaceClientRoot = findPackageRoot(path.dirname(workspaceManifestPath)) ?? undefined;
    return normalizeManifest(readManifestFromPath(workspaceManifestPath), workspaceClientRoot);
  }

  try {
    const manifestPath = require.resolve("@slidev-react/client/manifest");
    const clientPackageRoot = findPackageRoot(path.dirname(manifestPath)) ?? undefined;
    return normalizeManifest(readManifestFromPath(manifestPath), clientPackageRoot);
  } catch {
    const clientPackageRoot = path.dirname(require.resolve("@slidev-react/client/package.json"));
    const manifestCandidates = [
      path.join(clientPackageRoot, "dist", "manifest.json"),
      path.join(clientPackageRoot, "manifest.json"),
    ];
    const manifestPath = manifestCandidates.find((candidate) => existsSync(candidate));

    if (!manifestPath) {
      throw new Error(`Unable to locate the @slidev-react/client runtime manifest under ${clientPackageRoot}.`);
    }

    return normalizeManifest(readManifestFromPath(manifestPath), clientPackageRoot);
  }
}
