import { describe, expect, it } from "vite-plus/test";
import { normalizeArgv } from "../normalizeArgv.ts";

describe("normalizeArgv", () => {
  it("defaults to dev when argv is empty", () => {
    expect(normalizeArgv([])).toEqual(["dev"]);
  });

  it("prepends dev when argv starts with a flag", () => {
    expect(normalizeArgv(["--port", "4000"])).toEqual(["dev", "--port", "4000"]);
    expect(normalizeArgv(["--host=0.0.0.0"])).toEqual(["dev", "--host=0.0.0.0"]);
  });

  it("prepends dev when argv starts with a slides file path", () => {
    expect(normalizeArgv(["slides.mdx"])).toEqual(["dev", "slides.mdx"]);
    expect(normalizeArgv(["decks/intro.mdx", "--open"])).toEqual([
      "dev",
      "decks/intro.mdx",
      "--open",
    ]);
  });

  it("treats unknown strings as dev file paths", () => {
    expect(normalizeArgv(["nope"])).toEqual(["dev", "nope"]);
  });

  it("does not rewrite when the first arg is a known subcommand", () => {
    expect(normalizeArgv(["dev"])).toEqual(["dev"]);
    expect(normalizeArgv(["dev", "slides.mdx"])).toEqual(["dev", "slides.mdx"]);
    expect(normalizeArgv(["build", "slides.mdx"])).toEqual(["build", "slides.mdx"]);
    expect(normalizeArgv(["export", "slides.mdx", "--format", "pdf"])).toEqual([
      "export",
      "slides.mdx",
      "--format",
      "pdf",
    ]);
    expect(normalizeArgv(["lint", "slides.mdx", "--strict"])).toEqual([
      "lint",
      "slides.mdx",
      "--strict",
    ]);
    expect(normalizeArgv(["help"])).toEqual(["help"]);
  });

  it("passes through top-level help and version flags", () => {
    expect(normalizeArgv(["--help"])).toEqual(["--help"]);
    expect(normalizeArgv(["-h"])).toEqual(["-h"]);
    expect(normalizeArgv(["--version"])).toEqual(["--version"]);
    expect(normalizeArgv(["-V"])).toEqual(["-V"]);
  });
});
