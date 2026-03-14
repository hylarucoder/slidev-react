import { describe, expect, it, vi } from "vite-plus/test";
import { buildPresentationSharedState, mapRemotePresentationPatch } from "../presentationSyncBridge";

describe("presentationSyncBridge", () => {
  it("builds a shared state payload without mutating timestamps", () => {
    expect(
      buildPresentationSharedState({
        page: 2,
        cue: 1,
        cueTotal: 3,
        timer: 9,
        cursor: { x: 10, y: 20 },
        drawings: {
          "slide-1": [],
        },
        drawingsRevision: 4,
      }),
    ).toEqual({
      page: 2,
      cue: 1,
      cueTotal: 3,
      timer: 9,
      cursor: { x: 10, y: 20 },
      drawings: {
        "slide-1": [],
      },
      drawingsRevision: 4,
      lastUpdate: 0,
    });
  });

  it("maps remote patches back to presenter-side effects", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-08T10:00:00.000Z"));

    expect(
      mapRemotePresentationPatch({
        patch: {
          timer: 12,
          cursor: { x: 4, y: 8 },
          cue: 2,
          cueTotal: 5,
          drawings: {
            "slide-2": [],
          },
        },
        remotePage: 1,
        currentPage: 1,
        resolveSlideId: (index) => `slide-${index + 1}`,
      }),
    ).toEqual({
      remoteTimer: 12,
      remoteCursor: { x: 4, y: 8 },
      slideClicks: {
        slideId: "slide-2",
        clicks: 2,
      },
      slideClicksTotal: {
        slideId: "slide-2",
        clicksTotal: 5,
      },
      remoteDrawings: {
        revision: new Date("2026-03-08T10:00:00.000Z").getTime(),
        strokesBySlideId: {
          "slide-2": [],
        },
      },
    });

    vi.useRealTimers();
  });

  it("clears remote cursors when the remote page differs from the current page", () => {
    expect(
      mapRemotePresentationPatch({
        patch: {
          cursor: { x: 1, y: 1 },
        },
        remotePage: 2,
        currentPage: 1,
        resolveSlideId: () => null,
      }),
    ).toEqual({
      remoteCursor: null,
    });
  });
});
