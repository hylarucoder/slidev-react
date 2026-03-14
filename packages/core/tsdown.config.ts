import { defineConfig } from "vite-plus/pack";

export default defineConfig({
  entry: ["src/index.ts", "src/theme/types.ts", "src/addon/types.ts"],
  dts: true,
  deps: {
    neverBundle: [/^[^./]/],
  },
  format: "esm",
  outDir: "dist",
  platform: "neutral",
  unbundle: true,
});
