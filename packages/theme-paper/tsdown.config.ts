import { defineConfig } from "vite-plus/pack";

export default defineConfig({
  entry: ["index.ts"],
  dts: true,
  deps: {
    neverBundle: [/^[^./]/],
  },
  copy: ["style.css"],
  format: "esm",
  outDir: "dist",
  platform: "neutral",
  unbundle: true,
});
