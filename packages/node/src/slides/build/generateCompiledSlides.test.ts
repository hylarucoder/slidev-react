import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { generateCompiledSlidesArtifacts } from "./generateCompiledSlides.ts";

async function createTempAppRoot() {
  return mkdtemp(path.join(tmpdir(), "slide-react-slides-"));
}

async function writeSlidesSource(appRoot: string, source: string) {
  const slidesSourceFile = path.join(appRoot, "slides.mdx");
  await writeFile(slidesSourceFile, source, "utf8");
  return slidesSourceFile;
}

async function writeSupportFile(appRoot: string, relativePath: string, source: string) {
  const filePath = path.join(appRoot, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, source, "utf8");
  return filePath;
}

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("generateCompiledSlidesArtifacts", () => {
  it("generates a manifest and per-slide modules", async () => {
    const appRoot = await createTempAppRoot();
    tempDirs.push(appRoot);
    await writeSupportFile(
      appRoot,
      "slides/intro.mdx",
      ["---", "title: Imported Intro", "layout: center", "---", "", "# Imported hello"].join("\n"),
    );
    const slidesSourceFile = await writeSlidesSource(
      appRoot,
      [
        "---",
        "title: Demo Deck",
        "addons:",
        "  - insight",
        "layout: center",
        "background: '#f8fafc'",
        "transition: fade",
        "exportFilename: client-demo",
        "---",
        "",
        "---",
        "title: Intro",
        "layout: cover",
        "src: ./slides/intro.mdx",
        "background: '/images/hero.png'",
        "transition: slide-up",
        "clicks: 3",
        "notes: |",
        "  Open with the customer pain.",
        "  Land on the thesis.",
        "---",
        "",
        "---",
        "title: Next",
        "---",
        "",
        "```mermaid",
        "graph TD",
        "A-->B",
        "```",
      ].join("\n"),
    );

    const result = await generateCompiledSlidesArtifacts({
      appRoot,
      slidesSourceFile,
    });

    const manifest = await readFile(result.manifestFile, "utf8");
    const firstSlide = await readFile(
      path.join(appRoot, ".generated/slides/slides/slide-1.tsx"),
      "utf8",
    );
    const secondSlide = await readFile(
      path.join(appRoot, ".generated/slides/slides/slide-2.tsx"),
      "utf8",
    );

    expect(result.sourceHash).toHaveLength(12);
    expect(manifest).toContain("const compiledSlides: CompiledSlidesManifest = {");
    expect(manifest).toContain("sourceHash:");
    expect(manifest).toContain('"title": "Demo Deck"');
    expect(manifest).toContain('"addons": [');
    expect(manifest).toContain('"insight"');
    expect(manifest).toContain('"background": "#f8fafc"');
    expect(manifest).toContain('"transition": "fade"');
    expect(manifest).toContain('"exportFilename": "client-demo"');
    expect(manifest).toContain('"ar": "16/9"');
    expect(manifest).toContain('"viewport": {');
    expect(manifest).toContain('"width": 1920');
    expect(manifest).toContain('"height": 1080');
    expect(manifest).toContain('id: "slide-1"');
    expect(manifest).toContain('id: "slide-2"');
    expect(manifest).toContain('"src": "./slides/intro.mdx"');
    expect(manifest).toContain('"background": "/images/hero.png"');
    expect(manifest).toContain('"transition": "slide-up"');
    expect(manifest).toContain('"clicks": 3');
    expect(manifest).toContain('"notes": "Open with the customer pain.\\nLand on the thesis."');
    expect(firstSlide).toContain("export default function MDXContent");
    expect(firstSlide).toContain("Imported hello");
    expect(secondSlide).toContain("export default function MDXContent");
    expect(secondSlide).toContain('<MermaidDiagram>{"graph TD\\nA-->B"}</MermaidDiagram>');
  });

  it("updates the source hash when an imported slide file changes", async () => {
    const appRoot = await createTempAppRoot();
    tempDirs.push(appRoot);
    await writeSupportFile(appRoot, "slides/intro.mdx", "# Imported hello");
    const slidesSourceFile = await writeSlidesSource(
      appRoot,
      [
        "---",
        "title: Demo Deck",
        "---",
        "",
        "---",
        "title: Intro",
        "src: ./slides/intro.mdx",
        "---",
      ].join("\n"),
    );

    const first = await generateCompiledSlidesArtifacts({
      appRoot,
      slidesSourceFile,
    });

    await writeSupportFile(appRoot, "slides/intro.mdx", "# Imported hello again");

    const second = await generateCompiledSlidesArtifacts({
      appRoot,
      slidesSourceFile,
    });

    expect(first.sourceHash).not.toBe(second.sourceHash);
  });

  it("expands imported slide files into multiple generated slides", async () => {
    const appRoot = await createTempAppRoot();
    tempDirs.push(appRoot);
    await writeSupportFile(
      appRoot,
      "slides/module.mdx",
      [
        "---",
        "title: Imported Intro",
        "layout: center",
        "---",
        "",
        "# Imported hello",
        "",
        "---",
        "title: Imported Deep Dive",
        "---",
        "",
        "## Imported details",
      ].join("\n"),
    );
    const slidesSourceFile = await writeSlidesSource(
      appRoot,
      [
        "---",
        "title: Demo Deck",
        "---",
        "",
        "---",
        "src: ./slides/module.mdx",
        "---",
        "",
        "---",
        "title: Final",
        "---",
        "",
        "# Closing",
      ].join("\n"),
    );

    const result = await generateCompiledSlidesArtifacts({
      appRoot,
      slidesSourceFile,
    });
    const manifest = await readFile(result.manifestFile, "utf8");
    const firstSlide = await readFile(
      path.join(appRoot, ".generated/slides/slides/slide-1.tsx"),
      "utf8",
    );
    const secondSlide = await readFile(
      path.join(appRoot, ".generated/slides/slides/slide-2.tsx"),
      "utf8",
    );
    const thirdSlide = await readFile(
      path.join(appRoot, ".generated/slides/slides/slide-3.tsx"),
      "utf8",
    );

    expect(manifest).toContain('id: "slide-1"');
    expect(manifest).toContain('id: "slide-2"');
    expect(manifest).toContain('id: "slide-3"');
    expect(manifest).toContain('"title": "Imported Intro"');
    expect(manifest).toContain('"title": "Imported Deep Dive"');
    expect(manifest).toContain('"title": "Final"');
    expect(manifest).toContain('"src": "./slides/module.mdx"');
    expect(firstSlide).toContain("Imported hello");
    expect(secondSlide).toContain("Imported details");
    expect(thirdSlide).toContain("Closing");
    expect(result.watchedFiles).toContain(path.join(appRoot, "slides/module.mdx"));
  });

  it("fails when a slide mixes src with inline content", async () => {
    const appRoot = await createTempAppRoot();
    tempDirs.push(appRoot);
    await writeSupportFile(appRoot, "slides/intro.mdx", "# Imported hello");
    const slidesSourceFile = await writeSlidesSource(
      appRoot,
      [
        "---",
        "title: Demo Deck",
        "---",
        "",
        "---",
        "title: Intro",
        "src: ./slides/intro.mdx",
        "---",
        "",
        "# Inline body",
      ].join("\n"),
    );

    await expect(
      generateCompiledSlidesArtifacts({
        appRoot,
        slidesSourceFile,
      }),
    ).rejects.toThrow("mixes inline content with src");
  });

  it("fails when an imported slide file contains nested src", async () => {
    const appRoot = await createTempAppRoot();
    tempDirs.push(appRoot);
    await writeSupportFile(
      appRoot,
      "slides/module.mdx",
      [
        "---",
        "title: Imported Intro",
        "src: ./slides/nested.mdx",
        "---",
      ].join("\n"),
    );
    await writeSupportFile(appRoot, "slides/nested.mdx", "# Nested");
    const slidesSourceFile = await writeSlidesSource(
      appRoot,
      [
        "---",
        "title: Demo Deck",
        "---",
        "",
        "---",
        "src: ./slides/module.mdx",
        "---",
      ].join("\n"),
    );

    await expect(
      generateCompiledSlidesArtifacts({
        appRoot,
        slidesSourceFile,
      }),
    ).rejects.toThrow("Nested src is not supported");
  });

  it("removes stale generated slide modules", async () => {
    const appRoot = await createTempAppRoot();
    tempDirs.push(appRoot);
    const slidesSourceFile = await writeSlidesSource(
      appRoot,
      ["---", "title: Demo Deck", "---", "", "# One", "", "---", "", "# Two"].join("\n"),
    );

    await generateCompiledSlidesArtifacts({
      appRoot,
      slidesSourceFile,
    });

    await writeSlidesSource(appRoot, ["---", "title: Demo Deck", "---", "", "# One"].join("\n"));

    await generateCompiledSlidesArtifacts({
      appRoot,
      slidesSourceFile,
    });

    await expect(
      access(path.join(appRoot, ".generated/slides/slides/slide-2.tsx")),
    ).rejects.toThrow();
  });

  it("includes the slide title in compile errors", async () => {
    const appRoot = await createTempAppRoot();
    tempDirs.push(appRoot);
    const slidesSourceFile = await writeSlidesSource(
      appRoot,
      [
        "---",
        "title: Demo Deck",
        "---",
        "",
        "---",
        "title: Intro",
        "---",
        "",
        "# Hello",
        "",
        "---",
        "title: Broken",
        "---",
        "",
        "{",
      ].join("\n"),
    );

    await expect(
      generateCompiledSlidesArtifacts({
        appRoot,
        slidesSourceFile,
      }),
    ).rejects.toThrow("Failed to compile slide 2 (Broken)");
  });

  it("returns authoring warnings for unknown theme and addon references", async () => {
    const appRoot = await createTempAppRoot();
    tempDirs.push(appRoot);
    const slidesSourceFile = await writeSlidesSource(
      appRoot,
      [
        "---",
        "title: Demo Deck",
        "theme: missing-theme",
        "addons:",
        "  - missing-addon",
        "---",
        "",
        "---",
        "title: Intro",
        "layout: cover",
        "---",
        "",
        "# Hello",
      ].join("\n"),
    );

    const result = await generateCompiledSlidesArtifacts({
      appRoot,
      slidesSourceFile,
    });

    expect(result.warnings).toContain(
      'Unknown theme "missing-theme". The runtime will fall back to the default theme.',
    );
    expect(result.warnings).toContain(
      'Unknown addon "missing-addon". It will be ignored until a matching local addon exists.',
    );
  });

  it("returns authoring warnings for unknown slides and slide layouts", async () => {
    const appRoot = await createTempAppRoot();
    tempDirs.push(appRoot);
    const slidesSourceFile = await writeSlidesSource(
      appRoot,
      [
        "---",
        "title: Demo Deck",
        "layout: nebula",
        "---",
        "",
        "---",
        "title: Intro",
        "layout: orbit",
        "---",
        "",
        "# Hello",
      ].join("\n"),
    );

    const result = await generateCompiledSlidesArtifacts({
      appRoot,
      slidesSourceFile,
    });

    expect(result.warnings).toContain(
      'Unknown slides layout "nebula". The runtime will fall back to the default layout.',
    );
    expect(result.warnings).toContain(
      'Unknown layout "orbit" in slide 1 (Intro). The runtime will fall back to the default layout.',
    );
  });

  it("accepts layouts contributed by shipped themes and addons", async () => {
    const appRoot = await createTempAppRoot();
    tempDirs.push(appRoot);
    await writeSupportFile(
      appRoot,
      "packages/theme-paper/index.ts",
      [
        "export const theme = {",
        "  id: 'paper',",
        "  layouts: {",
        "    cover: PaperCoverLayout,",
        "  },",
        "}",
      ].join("\n"),
    );
    await writeSupportFile(
      appRoot,
      "packages/client/src/addons/insight/index.ts",
      [
        "export const addon = {",
        "  id: 'insight',",
        "  layouts: {",
        "    spotlight: SpotlightLayout,",
        "  },",
        "}",
      ].join("\n"),
    );
    const slidesSourceFile = await writeSlidesSource(
      appRoot,
      [
        "---",
        "title: Demo Deck",
        "theme: paper",
        "addons:",
        "  - insight",
        "layout: cover",
        "---",
        "",
        "---",
        "title: Intro",
        "layout: spotlight",
        "---",
        "",
        "# Hello",
      ].join("\n"),
    );

    const result = await generateCompiledSlidesArtifacts({
      appRoot,
      slidesSourceFile,
    });

    expect(result.warnings).not.toContain(
      'Unknown theme "paper". The runtime will fall back to the default theme.',
    );
    expect(result.warnings).not.toContain(
      'Unknown addon "insight". It will be ignored until a matching local addon exists.',
    );
    expect(result.warnings).not.toContain(
      'Unknown layout "spotlight" in slide 1 (Intro). The runtime will fall back to the default layout.',
    );
  });
  it("warns when mermaid code fences are used without the mermaid addon", async () => {
    const appRoot = await createTempAppRoot();
    tempDirs.push(appRoot);
    const slidesSourceFile = await writeSlidesSource(
      appRoot,
      [
        "---",
        "title: Demo Deck",
        "---",
        "",
        "---",
        "title: Diagrams",
        "---",
        "",
        "```mermaid",
        "graph TD",
        "A-->B",
        "```",
      ].join("\n"),
    );

    const result = await generateCompiledSlidesArtifacts({
      appRoot,
      slidesSourceFile,
    });

    expect(result.warnings).toContain(
      'Slides contain mermaid code fences but the "mermaid" addon is not declared. Add addons: ["mermaid"] to the deck frontmatter.',
    );
  });

  it("does not warn about mermaid when the addon is declared", async () => {
    const appRoot = await createTempAppRoot();
    tempDirs.push(appRoot);
    const slidesSourceFile = await writeSlidesSource(
      appRoot,
      [
        "---",
        "title: Demo Deck",
        "addons:",
        "  - mermaid",
        "---",
        "",
        "---",
        "title: Diagrams",
        "---",
        "",
        "```mermaid",
        "graph TD",
        "A-->B",
        "```",
      ].join("\n"),
    );

    const result = await generateCompiledSlidesArtifacts({
      appRoot,
      slidesSourceFile,
    });

    expect(result.warnings).not.toContain(
      'Slides contain mermaid code fences but the "mermaid" addon is not declared. Add addons: ["mermaid"] to the deck frontmatter.',
    );
  });
});
