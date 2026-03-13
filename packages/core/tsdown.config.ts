import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/theme/types.ts"],
  dts: true,
  deps: {
    neverBundle: [/^[^./]/],
  },
  format: "esm",
  outDir: "dist",
  platform: "neutral",
  unbundle: true,
});
