import { existsSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import tailwindcss from "@tailwindcss/postcss";
import react from "@vitejs/plugin-react";
import type { Alias, UserConfig } from "vite";
import {
  generatedSlidesAlias,
  generatedSlidesEntry,
  pluginCompileTimeSlides,
} from "../artifacts/generateCompiledSlides.ts";
import { pluginAddonsModule } from "../extensions/injectAddonsModule.ts";
import { loadClientRuntimeManifest } from "../runtime/runtimeManifest.ts";
import { pluginThemeModule } from "../extensions/injectThemeModule.ts";
import { pluginVirtualEntry } from "../runtime/virtualEntryPlugin.ts";
import { resolveSlidesSourceFile } from "./slidesSourceFile.ts";

const require = createRequire(import.meta.url);

const prebundledPresentationDeps = [
  "@antv/g2",
  "@antv/g2/esm/lib/plot",
  "@antv/g-svg",
  "mermaid/dist/mermaid.esm.min.mjs",
];

const clientRuntimeRequire = createRequire(resolvePackageImport("@slidev-react/client/package.json"));

function resolvePackageImport(specifier: string) {
  return require.resolve(specifier);
}

function resolveClientRuntimeImport(specifier: string) {
  return clientRuntimeRequire.resolve(specifier);
}

function findPackageRoot(resolvedFile: string) {
  let currentDir = path.dirname(resolvedFile);

  while (true) {
    if (existsSync(path.join(currentDir, "package.json"))) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      throw new Error(`Failed to find package root for ${resolvedFile}`);
    }

    currentDir = parentDir;
  }
}

function resolveClientRuntimeEntry(packageSpecifier: string, entryPath: string) {
  return path.join(findPackageRoot(resolveClientRuntimeImport(packageSpecifier)), entryPath);
}

const presentationRuntimeAliases: Alias[] = [
  {
    find: /^@antv\/g2\/esm\/lib\/plot$/,
    replacement: resolveClientRuntimeEntry("@antv/g2", "esm/lib/plot.js"),
  },
  {
    find: /^@antv\/g2$/,
    replacement: resolveClientRuntimeEntry("@antv/g2", "esm/index.js"),
  },
  {
    find: /^@antv\/g-svg$/,
    replacement: resolveClientRuntimeEntry("@antv/g-svg", "dist/index.esm.js"),
  },
  {
    find: /^mermaid\/dist\/mermaid\.esm\.min\.mjs$/,
    replacement: resolveClientRuntimeEntry("mermaid", "dist/mermaid.esm.min.mjs"),
  },
];

export function createSlidesViteConfig(options: {
  appRoot: string;
  slidesFile?: string;
}): UserConfig {
  const { appRoot, slidesFile } = options;
  const slidesSourceFile = resolveSlidesSourceFile(appRoot, slidesFile);
  const runtimeManifest = loadClientRuntimeManifest();

  return {
    root: appRoot,
    css: {
      postcss: {
        plugins: [tailwindcss()],
      },
    },
    optimizeDeps: {
      include: prebundledPresentationDeps,
    },
    plugins: [
      pluginVirtualEntry({
        appRoot,
        slidesSourceFile,
        clientEntryPath: runtimeManifest.runtimeEntry,
        clientStylePath: runtimeManifest.styleEntry,
      }),
      pluginCompileTimeSlides({
        appRoot,
        slidesSourceFile,
      }),
      pluginAddonsModule({
        appRoot,
        slidesSourceFile,
      }),
      pluginThemeModule({
        appRoot,
        slidesSourceFile,
      }),
      react(),
    ],
    resolve: {
      alias: [
        {
          find: "@mdx-js/react",
          replacement: resolvePackageImport("@mdx-js/react"),
        },
        {
          find: "react/jsx-runtime",
          replacement: resolvePackageImport("react/jsx-runtime"),
        },
        {
          find: "react/jsx-dev-runtime",
          replacement: resolvePackageImport("react/jsx-dev-runtime"),
        },
        {
          find: "react-dom/client",
          replacement: resolvePackageImport("react-dom/client"),
        },
        {
          find: "react-dom",
          replacement: resolvePackageImport("react-dom"),
        },
        {
          find: "react",
          replacement: resolvePackageImport("react"),
        },
        ...presentationRuntimeAliases,
        {
          find: generatedSlidesAlias,
          replacement: path.resolve(appRoot, generatedSlidesEntry),
        },
      ],
    },
  };
}
