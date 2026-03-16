import { defineConfig } from "vite-plus/pack";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    runtime: "src/runtime/entry.tsx",
    "runtime/manifest": "src/runtime/manifest.ts",
    "addons/mermaid": "src/addons/builtin/mermaid/index.ts",
    "addons/g2": "src/addons/builtin/g2/index.ts",
    "addons/insight": "src/addons/builtin/insight/index.ts",
    "themes/moonlit": "src/theme/builtin/moonlit/index.ts",
  },
  dts: true,
  deps: {
    neverBundle: [/^[^./]/],
  },
  copy: [
    "manifest.json",
    "src/style.css",
    { from: "src/theme", to: "dist" },
    { from: "src/addons/builtin/g2/style.css", to: "dist/addons/g2" },
    { from: "src/addons/builtin/insight/style.css", to: "dist/addons/insight" },
    { from: "src/theme/builtin/moonlit/style.css", to: "dist/themes/moonlit" },
  ],
  format: "esm",
  outDir: "dist",
  platform: "neutral",
  unbundle: true,
});
