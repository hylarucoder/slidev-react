import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { prepareBuildIndexHtml } from "../runtime/buildIndexHtml.ts";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("prepareBuildIndexHtml", () => {
  it("writes the build entry under .slidev-react/build without touching a root index file", async () => {
    const appRoot = await mkdtemp(path.join(tmpdir(), "slide-react-build-index-"));
    tempDirs.push(appRoot);

    const rootIndexFile = path.join(appRoot, "index.html");
    await writeFile(rootIndexFile, "<html><body>keep me</body></html>", "utf8");

    const prepared = prepareBuildIndexHtml({
      appRoot,
      html: "<html><body>virtual build</body></html>",
    });

    expect(prepared.filePath).toBe(path.join(appRoot, ".slidev-react", "build", "index.html"));
    await expect(readFile(prepared.filePath, "utf8")).resolves.toContain("virtual build");
    await expect(readFile(rootIndexFile, "utf8")).resolves.toContain("keep me");

    prepared.cleanup();

    await expect(readFile(rootIndexFile, "utf8")).resolves.toContain("keep me");
    await expect(readFile(prepared.filePath, "utf8")).rejects.toThrow();
  });
});
