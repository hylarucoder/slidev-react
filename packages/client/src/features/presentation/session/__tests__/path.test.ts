import { describe, expect, it } from "vite-plus/test";
import {
  buildRolePathFromBase,
  buildRolePathFromPathname,
  buildStandalonePathFromBase,
  buildStandalonePathFromPathname,
  parsePresentationPath,
  parseStandalonePath,
  resolvePresentationBasePath,
} from "../path";

describe("parsePresentationPath", () => {
  it("parses /presenter as a presenter role with no slide number", () => {
    expect(parsePresentationPath("/presenter")).toEqual({
      role: "presenter",
      slideNumber: null,
      basePath: "",
    });
  });

  it("parses /presenter/3 as presenter role on slide 3", () => {
    expect(parsePresentationPath("/presenter/3")).toEqual({
      role: "presenter",
      slideNumber: 3,
      basePath: "",
    });
  });

  it("parses a nested basePath like /app/presenter/5", () => {
    expect(parsePresentationPath("/app/presenter/5")).toEqual({
      role: "presenter",
      slideNumber: 5,
      basePath: "/app",
    });
  });

  it("returns null for a plain path without a role", () => {
    expect(parsePresentationPath("/slides")).toBeNull();
  });

  it("returns null for an empty path", () => {
    expect(parsePresentationPath("/")).toBeNull();
  });

  it("returns null for slide-only paths", () => {
    expect(parsePresentationPath("/3")).toBeNull();
  });
});

describe("parseStandalonePath", () => {
  it("parses /3 as slide number 3", () => {
    expect(parseStandalonePath("/3")).toEqual({
      slideNumber: 3,
      basePath: "",
    });
  });

  it("parses /app/7 with a basePath", () => {
    expect(parseStandalonePath("/app/7")).toEqual({
      slideNumber: 7,
      basePath: "/app",
    });
  });

  it("returns null for non-numeric paths", () => {
    expect(parseStandalonePath("/about")).toBeNull();
  });

  it("returns null for presenter paths (handled by parsePresentationPath)", () => {
    expect(parseStandalonePath("/presenter/3")).toBeNull();
  });

  it("returns null for slide number 0 or negative", () => {
    expect(parseStandalonePath("/0")).toBeNull();
    expect(parseStandalonePath("/-1")).toBeNull();
  });
});

describe("resolvePresentationBasePath", () => {
  it("returns empty string for root", () => {
    expect(resolvePresentationBasePath("/")).toBe("");
  });

  it("returns empty string for /index.html", () => {
    expect(resolvePresentationBasePath("/index.html")).toBe("");
  });

  it("strips /index.html suffix", () => {
    expect(resolvePresentationBasePath("/app/index.html")).toBe("/app");
  });

  it("extracts basePath from presenter paths", () => {
    expect(resolvePresentationBasePath("/app/presenter/3")).toBe("/app");
  });

  it("extracts basePath from standalone slide paths", () => {
    expect(resolvePresentationBasePath("/app/5")).toBe("/app");
  });
});

describe("buildRolePathFromBase", () => {
  it("builds /presenter/1 from empty base", () => {
    expect(buildRolePathFromBase("", "presenter", 1)).toBe("/presenter/1");
  });

  it("builds /app/presenter/5 from /app base", () => {
    expect(buildRolePathFromBase("/app", "presenter", 5)).toBe("/app/presenter/5");
  });

  it("clamps non-positive slide numbers to 1", () => {
    expect(buildRolePathFromBase("", "presenter", 0)).toBe("/presenter/1");
    expect(buildRolePathFromBase("", "presenter", -3)).toBe("/presenter/1");
  });

  it("floors fractional slide numbers", () => {
    expect(buildRolePathFromBase("", "presenter", 3.7)).toBe("/presenter/3");
  });
});

describe("buildRolePathFromPathname", () => {
  it("derives basePath from a full pathname and builds the role path", () => {
    expect(buildRolePathFromPathname("/app/presenter/2", "presenter", 5)).toBe(
      "/app/presenter/5",
    );
  });
});

describe("buildStandalonePathFromBase", () => {
  it("builds /3 from empty base", () => {
    expect(buildStandalonePathFromBase("", 3)).toBe("/3");
  });

  it("builds /app/3 from /app base", () => {
    expect(buildStandalonePathFromBase("/app", 3)).toBe("/app/3");
  });

  it("clamps non-positive slide numbers to 1", () => {
    expect(buildStandalonePathFromBase("", 0)).toBe("/1");
  });
});

describe("buildStandalonePathFromPathname", () => {
  it("derives basePath from pathname and builds standalone path", () => {
    expect(buildStandalonePathFromPathname("/app/5", 3)).toBe("/app/3");
  });
});
