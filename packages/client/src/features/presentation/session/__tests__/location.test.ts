import { describe, expect, it } from "vite-plus/test";
import {
  buildSlidesPath,
  normalizePathname,
  resolveSessionLocationState,
  resolveSlidesLocationState,
} from "../location";

describe("presentation location", () => {
  it("resolves presenter routes for slides navigation", () => {
    expect(resolveSlidesLocationState("/deck/presenter/3", 10)).toEqual({
      index: 2,
      mode: {
        kind: "role",
        role: "presenter",
        basePath: "/deck",
      },
    });
  });

  it("defaults non-slide routes to the first standalone slide", () => {
    expect(resolveSlidesLocationState("/", 10)).toEqual({
      index: 0,
      mode: {
        kind: "standalone",
        basePath: "",
      },
    });

    expect(resolveSessionLocationState("/")).toEqual({
      enabled: false,
      role: "viewer",
      currentSlideNumber: 1,
      normalizedPath: null,
    });
  });

  it("resolves standalone routes for sessions", () => {
    expect(resolveSessionLocationState("/deck/4")).toEqual({
      enabled: true,
      role: "viewer",
      currentSlideNumber: 4,
      normalizedPath: "/deck/4",
    });
  });

  it("builds paths from route modes", () => {
    expect(
      buildSlidesPath(
        {
          kind: "role",
          role: "presenter",
          basePath: "/deck",
        },
        1,
      ),
    ).toBe("/deck/presenter/2");

    expect(
      buildSlidesPath(
        {
          kind: "standalone",
          basePath: "/deck",
        },
        1,
      ),
    ).toBe("/deck/2");
  });

  it("normalizes trailing slashes", () => {
    expect(normalizePathname("/deck/")).toBe("/deck");
  });
});
