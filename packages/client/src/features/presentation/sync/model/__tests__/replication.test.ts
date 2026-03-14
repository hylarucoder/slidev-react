import { describe, expect, it, vi } from "vite-plus/test";
import {
  canAuthorState,
  canReceive,
  canSend,
  createEnvelope,
  createSnapshotState,
  isCursorEqual,
} from "../replication";

describe("replication model", () => {
  it("creates join envelopes with protocol metadata", () => {
    expect(
      createEnvelope({
        sessionId: "deck-default",
        senderId: "sender-1",
        seq: 3,
        timestamp: 42,
        message: {
          type: "session/join",
          payload: {
            role: "presenter",
          },
        },
      }),
    ).toMatchObject({
      sessionId: "deck-default",
      senderId: "sender-1",
      seq: 3,
      timestamp: 42,
      type: "session/join",
      payload: {
        role: "presenter",
      },
    });
  });

  it("stamps snapshots with the current time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-08T09:00:00.000Z"));

    expect(
      createSnapshotState({
        page: 1,
        cue: 2,
        cueTotal: 3,
        timer: 4,
        cursor: null,
        drawings: {},
        drawingsRevision: 5,
        lastUpdate: 0,
      }).lastUpdate,
    ).toBe(new Date("2026-03-08T09:00:00.000Z").getTime());

    vi.useRealTimers();
  });

  it("evaluates sync permissions by mode and role", () => {
    expect(canSend("send")).toBe(true);
    expect(canSend("receive")).toBe(false);
    expect(canReceive("receive")).toBe(true);
    expect(canReceive("off")).toBe(false);
    expect(canAuthorState("presenter")).toBe(true);
    expect(canAuthorState("viewer")).toBe(false);
  });

  it("compares cursor positions structurally", () => {
    expect(isCursorEqual(null, null)).toBe(true);
    expect(isCursorEqual({ x: 1, y: 2 }, { x: 1, y: 2 })).toBe(true);
    expect(isCursorEqual({ x: 1, y: 2 }, { x: 2, y: 1 })).toBe(false);
  });
});
