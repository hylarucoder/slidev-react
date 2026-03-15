import { defineConfig } from "vite-plus/pack";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "slides/build/createSlidesViteConfig": "src/slides/build/createSlidesViteConfig.ts",
    "src/slides/build/reactCompat": "src/slides/build/reactCompat.ts",
  },
  dts: true,
  deps: {
    neverBundle: [/^[^./]/],
  },
  format: "esm",
  outDir: "dist",
  platform: "node",
  unbundle: true,
});
