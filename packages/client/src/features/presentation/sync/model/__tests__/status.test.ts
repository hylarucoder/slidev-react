import { describe, expect, it } from "vite-plus/test";
import { resolvePresentationSyncStatus } from "../status";

describe("resolvePresentationSyncStatus", () => {
  it("returns disabled when the session is disabled", () => {
    expect(
      resolvePresentationSyncStatus({
        sessionEnabled: false,
        syncMode: "both",
        sessionWsUrl: "ws://localhost:4860/ws",
        transportState: "connected",
        broadcastConnected: true,
      }),
    ).toBe("disabled");
  });

  it("treats websocket connections as connected when the socket is open", () => {
    expect(
      resolvePresentationSyncStatus({
        sessionEnabled: true,
        syncMode: "send",
        sessionWsUrl: "ws://localhost:4860/ws",
        transportState: "connected",
        broadcastConnected: false,
      }),
    ).toBe("connected");
  });

  it("falls back to degraded when websocket is unavailable but broadcast still works", () => {
    expect(
      resolvePresentationSyncStatus({
        sessionEnabled: true,
        syncMode: "receive",
        sessionWsUrl: "ws://localhost:4860/ws",
        transportState: "reconnecting",
        broadcastConnected: true,
      }),
    ).toBe("degraded");
  });

  it("treats broadcast-only sessions as connected when broadcast is available", () => {
    expect(
      resolvePresentationSyncStatus({
        sessionEnabled: true,
        syncMode: "both",
        sessionWsUrl: null,
        transportState: "disabled",
        broadcastConnected: true,
      }),
    ).toBe("connected");
  });
});
