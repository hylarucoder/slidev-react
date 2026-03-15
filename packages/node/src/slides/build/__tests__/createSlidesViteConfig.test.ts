import { describe, expect, it } from "vite-plus/test";
import { createSlidesViteConfig } from "../createSlidesViteConfig.ts";

describe("createSlidesViteConfig", () => {
  it("excludes framework-owned React deps from optimization", () => {
    const config = createSlidesViteConfig({
      appRoot: process.cwd(),
    });

    expect(config.optimizeDeps?.exclude).toEqual([
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@mdx-js/react",
    ]);
  });

  it("does not alias the client package to src", () => {
    const config = createSlidesViteConfig({
      appRoot: process.cwd(),
    });

    expect(config.resolve?.alias).not.toHaveProperty("@");
    expect(config.resolve?.alias).toHaveProperty("@mdx-js/react");
  });
});
