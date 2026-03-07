import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

async function createTempAppRoot() {
  return mkdtemp(path.join(tmpdir(), "slide-react-lint-"));
}

async function writeDeckSource(appRoot: string, source: string) {
  const deckSourceFile = path.join(appRoot, "slides.mdx");
  await writeFile(deckSourceFile, source, "utf8");
  return deckSourceFile;
}

async function writeSupportFile(appRoot: string, relativePath: string, source: string) {
  const filePath = path.join(appRoot, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, source, "utf8");
  return filePath;
}

function runLintDeck({ cwd, args = [] }: { cwd: string; args?: string[] }): Promise<{
  code: number | null;
  stdout: string;
  stderr: string;
}> {
  const scriptFile = path.resolve(process.cwd(), "scripts/lint-deck.ts");

  return new Promise((resolve, reject) => {
    const child = spawn("bun", [scriptFile, ...args], {
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

describe("lint-deck CLI", () => {
  it("passes with a clean deck and exits successfully", async () => {
    const appRoot = await createTempAppRoot();
    tempDirs.push(appRoot);
    await writeDeckSource(
      appRoot,
      ["---", "title: Demo Deck", "layout: center", "---", "", "# Hello"].join("\n"),
    );

    const result = await runLintDeck({
      cwd: appRoot,
    });

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Deck lint passed: no authoring warnings for slides.mdx");
    expect(result.stderr).toBe("");
  });

  it("prints warnings but still exits successfully by default", async () => {
    const appRoot = await createTempAppRoot();
    tempDirs.push(appRoot);
    await writeDeckSource(
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

    const result = await runLintDeck({
      cwd: appRoot,
    });

    expect(result.code).toBe(0);
    expect(result.stderr).toContain("Deck lint found 3 warnings:");
    expect(result.stderr).toContain(
      'Unknown theme "missing-theme". The runtime will fall back to the default theme.',
    );
    expect(result.stderr).toContain(
      'Unknown deck layout "nebula". The runtime will fall back to the default layout.',
    );
    expect(result.stderr).toContain(
      'Unknown layout "orbit" in slide 1 (Intro). The runtime will fall back to the default layout.',
    );
  });

  it("fails in strict mode when warnings are present", async () => {
    const appRoot = await createTempAppRoot();
    tempDirs.push(appRoot);
    await writeDeckSource(
      appRoot,
      ["---", "title: Demo Deck", "layout: nebula", "---", "", "# Hello"].join("\n"),
    );

    const result = await runLintDeck({
      cwd: appRoot,
      args: ["--strict"],
    });

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("Deck lint found 1 warning:");
    expect(result.stderr).toContain(
      'Unknown deck layout "nebula". The runtime will fall back to the default layout.',
    );
  });

  it("accepts local theme and addon layout contributions", async () => {
    const appRoot = await createTempAppRoot();
    tempDirs.push(appRoot);
    await writeSupportFile(
      appRoot,
      "src/theme/themes/paper/index.ts",
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
      "src/addons/insight/index.ts",
      [
        "export const addon = {",
        "  id: 'insight',",
        "  layouts: {",
        "    spotlight: SpotlightLayout,",
        "  },",
        "}",
      ].join("\n"),
    );
    await writeDeckSource(
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

    const result = await runLintDeck({
      cwd: appRoot,
    });

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Deck lint passed: no authoring warnings for slides.mdx");
    expect(result.stderr).toBe("");
  });

  it("fails with a parse error for invalid frontmatter", async () => {
    const appRoot = await createTempAppRoot();
    tempDirs.push(appRoot);
    await writeDeckSource(
      appRoot,
      ["---", "title: Demo Deck", "transition: swirl", "---", "", "# Hello"].join("\n"),
    );

    const result = await runLintDeck({
      cwd: appRoot,
    });

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("Deck lint failed: Invalid deck frontmatter:");
  });
});
