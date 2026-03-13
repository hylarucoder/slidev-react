import path from "node:path";
import react from "@vitejs/plugin-react";
import type { UserConfig } from "vite";
import {
  generatedSlidesAlias,
  generatedSlidesEntry,
  pluginCompileTimeSlides,
} from "./generateCompiledSlides.ts";
import { pluginTheme } from "./themePlugin.ts";
import { resolveSlidesSourceFile } from "./slidesSourceFile.ts";

export function createSlidesViteConfig(options: {
  appRoot: string;
  slidesFile?: string;
}): UserConfig {
  const { appRoot, slidesFile } = options;
  const slidesSourceFile = resolveSlidesSourceFile(appRoot, slidesFile);

  return {
    root: appRoot,
    plugins: [
      pluginCompileTimeSlides({
        appRoot,
        slidesSourceFile,
      }),
      pluginTheme({
        slidesSourceFile,
      }),
      react(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(appRoot, "./packages/client/src"),
        [generatedSlidesAlias]: path.resolve(appRoot, generatedSlidesEntry),
        react: path.resolve(appRoot, "./node_modules/react"),
        "react-dom": path.resolve(appRoot, "./node_modules/react-dom"),
        "react/jsx-runtime": path.resolve(appRoot, "./node_modules/react/jsx-runtime.js"),
        "react/jsx-dev-runtime": path.resolve(appRoot, "./node_modules/react/jsx-dev-runtime.js"),
      },
    },
  };
}

