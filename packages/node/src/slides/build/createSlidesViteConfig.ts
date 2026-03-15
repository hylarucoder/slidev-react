import { createRequire } from "node:module";
import path from "node:path";
import react from "@vitejs/plugin-react";
import type { UserConfig } from "vite";
import {
  generatedSlidesAlias,
  generatedSlidesEntry,
  pluginCompileTimeSlides,
} from "./generateCompiledSlides.ts";
import { pluginAddons } from "./addonsPlugin.ts";
import { loadClientRuntimeManifest } from "./runtimeManifest.ts";
import { pluginTheme } from "./themePlugin.ts";
import { pluginVirtualEntry } from "./virtualEntryPlugin.ts";
import { resolveSlidesSourceFile } from "./slidesSourceFile.ts";

const require = createRequire(import.meta.url);
const frameworkDepsToExclude = [
  "react",
  "react-dom",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
  "@mdx-js/react",
];

/**
 * Resolve the real path of a framework-owned dependency from this package's
 * install location, NOT from the user's project root.
 *
 * This is essential for `npx` usage where the user's cwd has no node_modules
 * and all deps live in the npx cache alongside `@slidev-react/node`.
 */
function resolveFrameworkDep(specifier: string) {
  return path.dirname(require.resolve(`${specifier}/package.json`));
}

export function createSlidesViteConfig(options: {
  appRoot: string;
  slidesFile?: string;
}): UserConfig {
  const { appRoot, slidesFile } = options;
  const slidesSourceFile = resolveSlidesSourceFile(appRoot, slidesFile);
  const runtimeManifest = loadClientRuntimeManifest();

  return {
    root: appRoot,
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
      pluginAddons({
        appRoot,
        slidesSourceFile,
      }),
      pluginTheme({
        appRoot,
        slidesSourceFile,
      }),
      react(),
    ],
    optimizeDeps: {
      // In `npx @slidev-react/cli` usage these deps live beside the framework
      // package, not inside the user's cwd. Let our explicit aliases resolve
      // them at runtime instead of asking the dep optimizer to find them from
      // the app root.
      exclude: frameworkDepsToExclude,
    },
    resolve: {
      alias: {
        [generatedSlidesAlias]: path.resolve(appRoot, generatedSlidesEntry),
        "@mdx-js/react": require.resolve("@mdx-js/react"),
        "react/jsx-runtime": resolveFrameworkDep("react") + "/jsx-runtime",
        "react/jsx-dev-runtime": resolveFrameworkDep("react") + "/jsx-dev-runtime",
        react: resolveFrameworkDep("react"),
        "react-dom/client": resolveFrameworkDep("react-dom") + "/client",
        "react-dom": resolveFrameworkDep("react-dom"),
      },
    },
  };
}
