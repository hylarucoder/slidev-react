import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { DEMO_SLIDES_MDX } from "../../../templates/demoSlidesSource.ts";
import { preflightSlidesSource } from "../preflightSlidesSource.ts";

const createdDirs: string[] = [];

function makeTempDir() {
  const dir = mkdtempSync(path.join(tmpdir(), "slidev-react-preflight-"));
  createdDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of createdDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("preflightSlidesSource", () => {
  it("returns scaffolded:false when the slides file already exists", () => {
    const appRoot = makeTempDir();
    const slidesSourceFile = path.join(appRoot, "slides.mdx");
    writeFileSync(slidesSourceFile, "# existing\n", "utf8");

    const result = preflightSlidesSource({
      appRoot,
      slidesSourceFile,
      explicit: false,
      allowScaffold: true,
      logger: () => {},
    });

    expect(result).toEqual({ scaffolded: false });
    expect(readFileSync(slidesSourceFile, "utf8")).toBe("# existing\n");
  });

  it("scaffolds a demo deck when the file is missing and user did not specify one", () => {
    const appRoot = makeTempDir();
    const slidesSourceFile = path.join(appRoot, "slides.mdx");
    const messages: string[] = [];

    const result = preflightSlidesSource({
      appRoot,
      slidesSourceFile,
      explicit: false,
      allowScaffold: true,
      logger: (message) => messages.push(message),
    });

    expect(result).toEqual({ scaffolded: true });
    expect(existsSync(slidesSourceFile)).toBe(true);
    expect(readFileSync(slidesSourceFile, "utf8")).toBe(DEMO_SLIDES_MDX);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain("Generated starter deck at slides.mdx");
  });

  it("throws when the user explicitly passed a missing file (never scaffolds under explicit path)", () => {
    const appRoot = makeTempDir();
    const slidesSourceFile = path.join(appRoot, "custom.mdx");

    expect(() =>
      preflightSlidesSource({
        appRoot,
        slidesSourceFile,
        explicit: true,
        allowScaffold: true,
        logger: () => {},
      }),
    ).toThrow(/^Slides file not found: custom\.mdx/);
    expect(existsSync(slidesSourceFile)).toBe(false);
  });

  it("throws when scaffold is disabled and the file is missing", () => {
    const appRoot = makeTempDir();
    const slidesSourceFile = path.join(appRoot, "slides.mdx");

    expect(() =>
      preflightSlidesSource({
        appRoot,
        slidesSourceFile,
        explicit: false,
        allowScaffold: false,
        logger: () => {},
      }),
    ).toThrow(/Remove --no-scaffold/);
    expect(existsSync(slidesSourceFile)).toBe(false);
  });
});
