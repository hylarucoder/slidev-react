import { describe, expect, it } from "vite-plus/test";
import {
  PRESENTATION_PROTOCOL_VERSION,
  parsePresentationDrawingsState,
  parsePresentationEnvelope,
} from "../protocol";

describe("presentation protocol parsing", () => {
  it("parses snapshot envelopes", () => {
    expect(
      parsePresentationEnvelope({
        version: PRESENTATION_PROTOCOL_VERSION,
        type: "state/snapshot",
        sessionId: "session-1",
        senderId: "sender-1",
        seq: 3,
        timestamp: 123,
        payload: {
          state: {
            page: 2,
            cue: 1,
            cueTotal: 4,
            timer: 900,
            cursor: {
              x: 10,
              y: 12,
            },
            drawings: {
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
            drawingsRevision: 6,
            lastUpdate: 999,
          },
        },
      }),
    ).toEqual({
      version: PRESENTATION_PROTOCOL_VERSION,
      type: "state/snapshot",
      sessionId: "session-1",
      senderId: "sender-1",
      seq: 3,
      timestamp: 123,
      payload: {
        state: {
          page: 2,
          cue: 1,
          cueTotal: 4,
          timer: 900,
          cursor: {
            x: 10,
            y: 12,
          },
          drawings: {
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
          drawingsRevision: 6,
          lastUpdate: 999,
        },
      },
    });
  });

  it("parses patch envelopes with partial state", () => {
    expect(
      parsePresentationEnvelope({
        version: PRESENTATION_PROTOCOL_VERSION,
        type: "state/patch",
        sessionId: "session-1",
        senderId: "sender-1",
        seq: 4,
        timestamp: 456,
        payload: {
          state: {
            page: 5,
            cursor: null,
          },
        },
      }),
    ).toEqual({
      version: PRESENTATION_PROTOCOL_VERSION,
      type: "state/patch",
      sessionId: "session-1",
      senderId: "sender-1",
      seq: 4,
      timestamp: 456,
      payload: {
        state: {
          page: 5,
          cursor: null,
        },
      },
    });
  });

  it("rejects malformed websocket payloads", () => {
    expect(
      parsePresentationEnvelope({
        version: PRESENTATION_PROTOCOL_VERSION,
        type: "state/patch",
        sessionId: "session-1",
        senderId: "sender-1",
        seq: 4,
        timestamp: 456,
        payload: {
          state: {
            drawings: {
              "slide-1": [
                {
                  id: "stroke-1",
                  color: "#ef4444",
                  width: "4",
                  points: [{ x: 1, y: 2 }],
                },
              ],
            },
          },
        },
      }),
    ).toBeNull();
  });

  it("rejects malformed drawing maps", () => {
    expect(
      parsePresentationDrawingsState({
        "slide-1": [
          {
            id: "stroke-1",
            color: "#ef4444",
            width: 4,
            points: [{ x: "1", y: 2 }],
          },
        ],
      }),
    ).toBeNull();
  });
});
