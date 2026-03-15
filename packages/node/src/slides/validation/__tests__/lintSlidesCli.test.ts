import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { afterEach, describe, expect, it } from "vite-plus/test";

const require = createRequire(import.meta.url);
const tsxImport = require.resolve("tsx");

async function createTempAppRoot() {
  return mkdtemp(path.join(tmpdir(), "slide-react-lint-"));
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

function runLintSlides({ cwd, args = [] }: { cwd: string; args?: string[] }): Promise<{
  code: number | null;
  stdout: string;
  stderr: string;
}> {
  const cliFile = path.resolve(process.cwd(), "packages/cli/bin/slidev-react.ts");

  return new Promise((resolve, reject) => {
    const child = spawn("node", ["--import", tsxImport, cliFile, "lint", ...args], {
      cwd,
      stdio: "pipe",
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("error", reject);
    child.on("close", (code) => {
      resolve({
        code,
        stdout,
        stderr,
      });
    });
  });
}

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("lint-slides CLI", () => {
  it("passes with clean slides and exits successfully", async () => {
    const appRoot = await createTempAppRoot();
    tempDirs.push(appRoot);
    await writeSlidesSource(
      appRoot,
      ["---", "title: Demo Deck", "layout: center", "---", "", "# Hello"].join("\n"),
    );

    const result = await runLintSlides({
      cwd: appRoot,
    });

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Slides lint passed: no authoring warnings for slides.mdx");
    expect(result.stderr).toBe("");
  });

  it("prints warnings but still exits successfully by default", async () => {
    const appRoot = await createTempAppRoot();
    tempDirs.push(appRoot);
    await writeSlidesSource(
      appRoot,
      [
        "---",
        "title: Demo Deck",
        "theme: missing-theme",
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

    const result = await runLintSlides({
      cwd: appRoot,
    });

    expect(result.code).toBe(0);
    expect(result.stderr).toContain("Slides lint found 3 warnings:");
    expect(result.stderr).toContain(
      'Unknown theme "missing-theme". Add packages/theme-missing-theme/index.ts or install @slidev-react/theme-missing-theme.',
    );
    expect(result.stderr).toContain(
      'Unknown slides layout "nebula". The runtime will fall back to the default layout.',
    );
    expect(result.stderr).toContain(
      'Unknown layout "orbit" in slide 1 (Intro). The runtime will fall back to the default layout.',
    );
  });

  it("fails in strict mode when warnings are present", async () => {
    const appRoot = await createTempAppRoot();
    tempDirs.push(appRoot);
    await writeSlidesSource(
      appRoot,
      ["---", "title: Demo Deck", "layout: nebula", "---", "", "# Hello"].join("\n"),
    );

    const result = await runLintSlides({
      cwd: appRoot,
      args: ["--strict"],
    });

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("Slides lint found 1 warning:");
    expect(result.stderr).toContain(
      'Unknown slides layout "nebula". The runtime will fall back to the default layout.',
    );
  });

  it("accepts local theme and addon layout contributions", async () => {
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
      "packages/addon-focus/index.ts",
      [
        "export const addon = {",
        "  id: 'focus',",
        "  layouts: {",
        "    spotlight: SpotlightLayout,",
        "  },",
        "}",
      ].join("\n"),
    );
    await writeSlidesSource(
      appRoot,
      [
        "---",
        "title: Demo Deck",
        "theme: paper",
        "addons:",
        "  - focus",
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

    const result = await runLintSlides({
      cwd: appRoot,
    });

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Slides lint passed: no authoring warnings for slides.mdx");
    expect(result.stderr).toBe("");
  });

  it("fails with a parse error for invalid frontmatter", async () => {
    const appRoot = await createTempAppRoot();
    tempDirs.push(appRoot);
    await writeSlidesSource(
      appRoot,
      ["---", "title: Demo Deck", "transition: swirl", "---", "", "# Hello"].join("\n"),
    );

    const result = await runLintSlides({
      cwd: appRoot,
    });

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("[slidev-react] Invalid slides frontmatter:");
  });
});
