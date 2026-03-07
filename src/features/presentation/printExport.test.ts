import { describe, expect, it } from "vitest";
import {
  buildDeckUrl,
  buildPrintExportUrl,
  resolvePresentationExportMode,
  resolvePrintExportWithClicks,
} from "./printExport";

describe("presentation print export", () => {
  it("detects print export mode from the search string", () => {
    expect(resolvePresentationExportMode("?export=print")).toBe("print");
  });

  it("ignores unsupported export modes", () => {
    expect(resolvePresentationExportMode("?export=pdf")).toBeNull();
    expect(resolvePresentationExportMode("")).toBeNull();
  });

  it("builds a print export url while preserving unrelated params", () => {
    expect(buildPrintExportUrl("http://localhost:5173/presenter/3?foo=bar#ignored")).toBe(
      "http://localhost:5173/presenter/3?foo=bar&export=print",
    );
  });

  it("includes with-clicks when requested", () => {
    expect(
      buildPrintExportUrl("http://localhost:5173/presenter/3?foo=bar#ignored", {
        withClicks: true,
      }),
    ).toBe("http://localhost:5173/presenter/3?foo=bar&export=print&with-clicks=1");
  });

  it("detects with-clicks from the search string", () => {
    expect(resolvePrintExportWithClicks("?export=print&with-clicks=1")).toBe(true);
    expect(resolvePrintExportWithClicks("?export=print")).toBe(false);
  });

  it("removes export mode when returning to the live deck", () => {
    expect(buildDeckUrl("http://localhost:5173/presenter/3?foo=bar&export=print")).toBe(
      "http://localhost:5173/presenter/3?foo=bar",
    );
  });
});
