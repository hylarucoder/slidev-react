import { describe, expect, it } from "vite-plus/test";
import {
  createRecordingDownloadName,
  resolvePresentationFileNameBase,
  resolveRecordingFileNameBase,
} from "../recordingFilename";

describe("recording filename", () => {
  it("prefers exportFilename when present", () => {
    expect(
      resolveRecordingFileNameBase({
        exportFilename: "client-demo",
        slidesTitle: "Ignored Title",
      }),
    ).toBe("client-demo");
  });

  it("removes known video extensions from exportFilename", () => {
    expect(
      resolveRecordingFileNameBase({
        exportFilename: "client-demo.webm",
      }),
    ).toBe("client-demo");
  });

  it("falls back to a slugified title", () => {
    expect(
      resolveRecordingFileNameBase({
        slidesTitle: "Q4 Review Deck",
      }),
    ).toBe("q4-review-deck");
  });

  it("uses a configurable fallback for non-recording exports", () => {
    expect(resolvePresentationFileNameBase({})).toBe("slide-react-slides");
  });

  it("creates a deterministic download name", () => {
    expect(
      createRecordingDownloadName({
        exportFilename: "client-demo",
        recordedAt: new Date("2026-03-06T12:34:56.000Z"),
      }),
    ).toBe("client-demo-2026-03-06T12-34-56.webm");
  });
});
