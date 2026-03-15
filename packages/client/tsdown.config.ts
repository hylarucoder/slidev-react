import { defineConfig } from "vite-plus/pack";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    runtime: "src/runtime.tsx",
    "addons/mermaid": "src/addons/mermaid/index.ts",
    "addons/g2": "src/addons/g2/index.ts",
    "addons/insight": "src/addons/insight/index.ts",
  },
  dts: true,
  deps: {
    neverBundle: [/^[^./]/],
  },
  copy: [
    "manifest.json",
    "src/style.css",
    { from: "src/theme", to: "dist" },
    { from: "src/addons/g2/style.css", to: "dist/addons/g2" },
    { from: "src/addons/insight/style.css", to: "dist/addons/insight" },
  ],
  format: "esm",
  outDir: "dist",
  platform: "neutral",
  unbundle: true,
});
