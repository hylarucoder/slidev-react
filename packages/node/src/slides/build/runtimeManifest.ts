import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);

export interface ClientRuntimeAddonManifestEntry {
  id: string;
  module: string;
  style?: string;
}

export interface ClientRuntimeManifest {
  runtimeEntry: string;
  styleEntry: string;
  addons: ClientRuntimeAddonManifestEntry[];
}

let manifestCache: ClientRuntimeManifest | null = null;

function resolveClientPackageRoot() {
  const clientPkgPath = require.resolve("@slidev-react/client/package.json");
  return path.dirname(clientPkgPath);
}

function resolveClientRuntimeAsset(packageRoot: string, relativePath: string) {
  return pathToFileURL(path.join(packageRoot, relativePath)).href;
}

export function loadClientRuntimeManifest(): ClientRuntimeManifest {
  if (manifestCache) return manifestCache;

  const clientPackageRoot = resolveClientPackageRoot();

  try {
    const manifestPath = require.resolve("@slidev-react/client/manifest");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as ClientRuntimeManifest;
    manifestCache = {
      runtimeEntry: resolveClientRuntimeAsset(clientPackageRoot, manifest.runtimeEntry),
      styleEntry: resolveClientRuntimeAsset(clientPackageRoot, manifest.styleEntry),
      addons: manifest.addons.map((addon) => ({
        ...addon,
        module: resolveClientRuntimeAsset(clientPackageRoot, addon.module),
        style: addon.style
          ? resolveClientRuntimeAsset(clientPackageRoot, addon.style)
          : undefined,
      })),
    };
    return manifestCache;
  } catch {
    const manifestPath = path.join(clientPackageRoot, "manifest.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as ClientRuntimeManifest;
    manifestCache = {
      runtimeEntry: resolveClientRuntimeAsset(clientPackageRoot, manifest.runtimeEntry),
      styleEntry: resolveClientRuntimeAsset(clientPackageRoot, manifest.styleEntry),
      addons: manifest.addons.map((addon) => ({
        ...addon,
        module: resolveClientRuntimeAsset(clientPackageRoot, addon.module),
        style: addon.style
          ? resolveClientRuntimeAsset(clientPackageRoot, addon.style)
          : undefined,
      })),
    };
    return manifestCache;
  }
}
