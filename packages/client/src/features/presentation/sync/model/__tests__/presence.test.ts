import { describe, expect, it } from "vite-plus/test";
import {
  countPeers,
  markPeerSeen,
  removePeer,
  resolveRemoteActive,
  sweepStalePeers,
} from "../presence";

describe("presence model", () => {
  it("tracks peer activity and counts peers", () => {
    const peers = new Map<string, number>();

    markPeerSeen(peers, "viewer-1", 100);
    markPeerSeen(peers, "viewer-2", 200);

    expect(countPeers(peers)).toBe(2);
  });

  it("removes stale peers during sweeps", () => {
    const peers = new Map<string, number>([
      ["viewer-1", 100],
      ["viewer-2", 5000],
    ]);

    sweepStalePeers(peers, 6000, 2000);

    expect([...peers.keys()]).toEqual(["viewer-2"]);
  });

  it("returns whether a peer was removed", () => {
    const peers = new Map<string, number>([["viewer-1", 100]]);

    expect(removePeer(peers, "viewer-1")).toBe(true);
    expect(removePeer(peers, "viewer-1")).toBe(false);
  });

  it("marks remote activity as stale outside the active window", () => {
    expect(resolveRemoteActive(2000, 3000, 1500)).toBe(true);
    expect(resolveRemoteActive(2000, 5000, 1500)).toBe(false);
  });
});
