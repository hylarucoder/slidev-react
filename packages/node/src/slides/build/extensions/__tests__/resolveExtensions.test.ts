import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { resolveThemeExtension } from "../resolveExtensions.ts";

const tempDirs: string[] = [];
const fixtureDirs: string[] = [];

async function writeFileRecursive(filePath: string, contents: string) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents, "utf8");
}

async function createTempAppRoot() {
  const appRoot = await mkdtemp(path.join(tmpdir(), "slidev-react-resolve-"));
  tempDirs.push(appRoot);
  return appRoot;
}

async function createThemeFixture(id: string) {
  const fixtureDir = path.join(
    path.dirname(fileURLToPath(new URL("../resolveExtensions.ts", import.meta.url))),
    "node_modules",
    "@slidev-react",
    `theme-${id}`,
  );
  fixtureDirs.push(fixtureDir);

  await writeFileRecursive(
    path.join(fixtureDir, "package.json"),
    JSON.stringify({
      name: `@slidev-react/theme-${id}`,
      type: "module",
      exports: {
        ".": {
          import: "./dist/index.js",
        },
        "./style.css": "./dist/style.css",
      },
    }, null, 2),
  );
  await writeFileRecursive(
    path.join(fixtureDir, "dist/index.js"),
    "export default { id: 'fixture-theme' };\n",
  );
  await writeFileRecursive(
    path.join(fixtureDir, "dist/style.css"),
    ":root { --fixture-theme: 1; }\n",
  );
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  await Promise.all(fixtureDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("resolveThemeExtension", () => {
  it("resolves built-in themes from the client runtime manifest before checking packages", async () => {
    const appRoot = await createTempAppRoot();

    const theme = resolveThemeExtension(appRoot, "moonlit");

    expect(theme).toMatchObject({
      id: "moonlit",
      source: "builtin",
      importPath: expect.stringContaining("/dist/themes/moonlit.js"),
      styleImportPath: expect.stringContaining("/dist/themes/moonlit/style.css"),
    });
    expect(theme?.importPath.startsWith("file://")).toBe(true);
    expect(theme?.styleImportPath?.startsWith("file://")).toBe(true);
  });

  it("resolves installed theme packages that only expose import exports", async () => {
    await createThemeFixture("export-only");
    const appRoot = await createTempAppRoot();

    const theme = resolveThemeExtension(appRoot, "export-only");

    expect(theme).toMatchObject({
      id: "export-only",
      source: "package",
    });
    expect(theme?.importPath).toContain("/dist/index.js");
    expect(theme?.importPath.startsWith("file://")).toBe(true);
    expect(theme?.styleImportPath).toContain("/dist/style.css");
    expect(theme?.styleImportPath?.startsWith("file://")).toBe(true);
  });
});
