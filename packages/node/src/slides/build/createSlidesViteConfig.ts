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
    resolve: {
      alias: {
        [generatedSlidesAlias]: path.resolve(appRoot, generatedSlidesEntry),
      },
    },
  };
}
