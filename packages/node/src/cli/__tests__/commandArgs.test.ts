import { describe, expect, it } from "vite-plus/test";
import { parseBuildArgs } from "../buildArgs.ts";
import { parseDevArgs } from "../devArgs.ts";
import { parseLintArgs } from "../lintArgs.ts";

describe("CLI arg parsers", () => {
  it("accepts --file for dev", () => {
    expect(parseDevArgs(["--file", "slides-dev.mdx", "--host", "0.0.0.0"])).toEqual({
      slidesFile: "slides-dev.mdx",
      host: "0.0.0.0",
      port: undefined,
      open: undefined,
      strictPort: undefined,
      base: undefined,
      mode: undefined,
      noScaffold: undefined,
    });
  });

  it("accepts --no-scaffold for dev", () => {
    expect(parseDevArgs(["--no-scaffold"])).toEqual({
      slidesFile: undefined,
      host: undefined,
      port: undefined,
      open: undefined,
      strictPort: undefined,
      base: undefined,
      mode: undefined,
      noScaffold: true,
    });
  });

  it("accepts --file for build", () => {
    expect(parseBuildArgs(["--file=slides-build.mdx", "--outDir", "dist/slides"])).toEqual({
      slidesFile: "slides-build.mdx",
      outDir: "dist/slides",
      base: undefined,
      mode: undefined,
      emptyOutDir: undefined,
      sourcemap: undefined,
      minify: undefined,
    });
  });

  it("rejects extra positional args for lint", () => {
    expect(() => parseLintArgs(["slides-a.mdx", "slides-b.mdx"])).toThrow(
      'Unknown lint argument "slides-b.mdx".',
    );
  });
});
