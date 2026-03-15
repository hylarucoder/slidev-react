import { describe, expect, it } from "vite-plus/test";
import { createSlidesViteConfig } from "../createSlidesViteConfig.ts";

describe("createSlidesViteConfig", () => {
  it("keeps dependency optimization on the default Vite path", () => {
    const config = createSlidesViteConfig({
      appRoot: process.cwd(),
    });

    expect(config.optimizeDeps).toBeUndefined();
  });

  it("only aliases app-owned runtime modules", () => {
    const config = createSlidesViteConfig({
      appRoot: process.cwd(),
    });

    expect(config.resolve?.alias).not.toHaveProperty("@");
    expect(config.resolve?.alias).toHaveProperty("@generated/slides");
    expect(Object.keys(config.resolve?.alias ?? {})).toHaveLength(1);
    expect(config.resolve?.alias).not.toHaveProperty("react");
    expect(config.resolve?.alias).not.toHaveProperty("react-dom");
    expect(config.resolve?.alias).not.toHaveProperty("react-dom/client");
  });
});
