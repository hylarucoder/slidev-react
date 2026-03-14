import { describe, expect, it } from "vite-plus/test";
import {
  DRAW_STORAGE_VERSION,
  createPersistedDrawState,
  parsePersistedDrawState,
} from "../persistence";

describe("draw persistence", () => {
  it("parses persisted draw state", () => {
    expect(
      parsePersistedDrawState(
        JSON.stringify({
          version: DRAW_STORAGE_VERSION,
          strokesBySlideId: {
            "slide-1": [
              {
                id: "stroke-1",
                color: "#ef4444",
                width: 4,
                kind: "pen",
                points: [{ x: 1, y: 2 }],
              },
            ],
          },
        }),
      ),
    ).toEqual({
      version: DRAW_STORAGE_VERSION,
      strokesBySlideId: {
        "slide-1": [
          {
            id: "stroke-1",
            color: "#ef4444",
            width: 4,
            kind: "pen",
            points: [{ x: 1, y: 2 }],
          },
        ],
      },
    });
  });

  it("rejects invalid persisted state", () => {
    expect(
      parsePersistedDrawState(
        JSON.stringify({
          version: DRAW_STORAGE_VERSION,
          strokesBySlideId: {
            "slide-1": [
              {
                id: "stroke-1",
                color: "#ef4444",
                width: "4",
                points: [{ x: 1, y: 2 }],
              },
            ],
          },
        }),
      ),
    ).toBeNull();
  });

  it("rejects unexpected storage versions", () => {
    expect(
      parsePersistedDrawState(
        JSON.stringify({
          version: 2,
          strokesBySlideId: {},
        }),
      ),
    ).toBeNull();
  });

  it("creates versioned persisted state", () => {
    expect(createPersistedDrawState({})).toEqual({
      version: DRAW_STORAGE_VERSION,
      strokesBySlideId: {},
    });
  });
});
