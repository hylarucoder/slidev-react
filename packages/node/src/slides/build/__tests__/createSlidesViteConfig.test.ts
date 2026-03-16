import { describe, expect, it } from "vite-plus/test";
import { createSlidesViteConfig } from "../config/createSlidesViteConfig.ts";

function getAliasFindList() {
  const config = createSlidesViteConfig({
    appRoot: process.cwd(),
  });

  return (config.resolve?.alias ?? []).map((entry) => {
    if (typeof entry === "string") return entry;
    return String(entry.find);
  });
}

describe("createSlidesViteConfig", () => {
  it("prebundles browser-heavy addon runtimes for dev startup", () => {
    const config = createSlidesViteConfig({
      appRoot: process.cwd(),
    });

    expect(config.optimizeDeps?.include).toEqual([
      "@antv/g2",
      "@antv/g2/esm/lib/plot",
      "@antv/g-svg",
      "mermaid/dist/mermaid.esm.min.mjs",
    ]);
  });

  it("aliases generated modules and self-contained runtime fallbacks", () => {
    const aliasFindList = getAliasFindList();

    expect(aliasFindList).not.toContain("@");
    expect(aliasFindList).toContain("@generated/slides");
    expect(aliasFindList).toContain("@mdx-js/react");
    expect(aliasFindList).toContain("react");
    expect(aliasFindList).toContain("react-dom");
    expect(aliasFindList).toContain("react-dom/client");
    expect(aliasFindList).toContain("react/jsx-runtime");
    expect(aliasFindList).toContain("react/jsx-dev-runtime");
    expect(aliasFindList).toContain("/^@antv\\/g2\\/esm\\/lib\\/plot$/");
    expect(aliasFindList).toContain("/^@antv\\/g2$/");
    expect(aliasFindList).toContain("/^@antv\\/g-svg$/");
    expect(aliasFindList).toContain("/^mermaid\\/dist\\/mermaid\\.esm\\.min\\.mjs$/");
    expect(aliasFindList).toHaveLength(11);
  });
});
