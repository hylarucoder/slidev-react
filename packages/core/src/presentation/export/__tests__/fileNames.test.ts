import { describe, expect, it } from "vite-plus/test";
import {
  createSlideImageFileName,
  createSlideSnapshotFileName,
  resolveExportSlidesBaseName,
  trimPdfExtension,
} from "../fileNames";

describe("presentation export artifact names", () => {
  it("removes a trailing pdf extension from document titles", () => {
    expect(trimPdfExtension("client-demo.pdf")).toBe("client-demo");
  });

  it("resolves a stable slides base name", () => {
    expect(resolveExportSlidesBaseName("Q4 Review Deck.pdf")).toBe("q4-review-deck");
  });

  it("falls back when the document title is empty", () => {
    expect(resolveExportSlidesBaseName("   ")).toBe("slide-react-slides");
  });

  it("builds slide image names from the slide index and title", () => {
    expect(
      createSlideImageFileName({
        index: 3,
        title: "API Boundary & Tradeoffs",
      }),
    ).toBe("003-api-boundary-tradeoffs.png");
  });

  it("falls back to the slide index when no title exists", () => {
    expect(
      createSlideImageFileName({
        index: 7,
      }),
    ).toBe("007-slide-7.png");
  });

  it("adds click-step suffixes for snapshot exports", () => {
    expect(
      createSlideSnapshotFileName({
        index: 3,
        title: "API Boundary & Tradeoffs",
        clickStep: 2,
      }),
    ).toBe("003-api-boundary-tradeoffs-click-2.png");
  });
});
