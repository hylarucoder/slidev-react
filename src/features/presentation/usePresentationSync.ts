import { useEffect, useMemo, useRef, useState } from "react";
import type { PresentationSession } from "./session";
import {
  PRESENTATION_PROTOCOL_VERSION,
  parsePresentationEnvelope,
  type PresentationEnvelope,
  type PresentationRole,
  type PresentationSyncMode,
  type PresentationSharedState,
} from "./types";

const BROADCAST_CHANNEL_PREFIX = "slide-react:presentation:session:";
const HEARTBEAT_INTERVAL_MS = 5000;
const MAX_RECONNECT_DELAY_MS = 5000;
const BASE_RECONNECT_DELAY_MS = 800;
const CURSOR_PATCH_INTERVAL_MS = 80;
const PEER_STALE_AFTER_MS = HEARTBEAT_INTERVAL_MS * 3;
const PEER_SWEEP_INTERVAL_MS = 2000;
const REMOTE_ACTIVE_WINDOW_MS = HEARTBEAT_INTERVAL_MS * 2;

type WsState = "disabled" | "connecting" | "connected" | "reconnecting";

export type PresentationSyncStatus = "disabled" | "connecting" | "connected" | "degraded";

export interface UsePresentationSyncResult {
  status: PresentationSyncStatus;
  broadcastConnected: boolean;
  wsConnected: boolean;
  lastSyncedAt: number | null;
  peerCount: number;
  remoteActive: boolean;
}

type EnvelopeInput = Omit<
  PresentationEnvelope,
  "version" | "sessionId" | "senderId" | "seq" | "timestamp"
>;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function resolveStatus(
  sessionEnabled: boolean,
  syncMode: PresentationSyncMode,
  sessionWsUrl: string | null,
  wsState: WsState,
  broadcastConnected: boolean,
): PresentationSyncStatus {
  if (!sessionEnabled) return "disabled";

  if (syncMode === "off") return "disabled";

  if (sessionWsUrl) {
    if (wsState === "connected") return "connected";

    if (broadcastConnected) return "degraded";

    return "connecting";
  }

  if (broadcastConnected) return "connected";

  return "degraded";
}

function canSend(syncMode: PresentationSyncMode) {
  return syncMode === "send" || syncMode === "both";
}

function canReceive(syncMode: PresentationSyncMode) {
  return syncMode === "receive" || syncMode === "both";
}

function canAuthorState(role: PresentationRole) {
  return role === "presenter";
}

function isCursorEqual(
  left: PresentationSharedState["cursor"],
  right: PresentationSharedState["cursor"],
) {
  if (left === right) return true;

  if (!left || !right) return false;

  return left.x === right.x && left.y === right.y;
}

function createSnapshotState(localState: PresentationSharedState): PresentationSharedState {
  return {
    ...localState,
    lastUpdate: Date.now(),
  };
}

export function usePresentationSync({
  session,
  currentIndex,
  total,
  goTo,
  followRemotePage,
  localState,
  onRemoteState,
}: {
  session: PresentationSession;
  currentIndex: number;
  total: number;
  goTo: (index: number) => void;
  followRemotePage: boolean;
  localState: PresentationSharedState;
  onRemoteState: (patch: Partial<PresentationSharedState>, remotePage: number) => void;
}): UsePresentationSyncResult {
  const [broadcastConnected, setBroadcastConnected] = useState(false);
  const [wsState, setWsState] = useState<WsState>("disabled");
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [peerCount, setPeerCount] = useState(0);
  const [remoteActive, setRemoteActive] = useState(false);

  const seqRef = useRef(0);
  const currentIndexRef = useRef(currentIndex);
  const goToRef = useRef(goTo);
  const totalRef = useRef(total);
  const followRemotePageRef = useRef(followRemotePage);
  const localStateRef = useRef(localState);
  const onRemoteStateRef = useRef(onRemoteState);
  const lastRemoteUpdateRef = useRef(0);
  const remotePageRef = useRef(currentIndex);
  const sendEnvelopeRef = useRef<((message: EnvelopeInput) => void) | null>(null);
  const sendSnapshotRef = useRef<(() => void) | null>(null);
  const lastSentStateRef = useRef<PresentationSharedState | null>(null);
  const pendingCursorRef = useRef<PresentationSharedState["cursor"] | null>(null);
  const cursorFlushTimerRef = useRef<number | null>(null);
  const peerLastSeenRef = useRef<Map<string, number>>(new Map());
  const lastRemoteActivityRef = useRef(0);

  currentIndexRef.current = currentIndex;
  goToRef.current = goTo;
  totalRef.current = total;
  followRemotePageRef.current = followRemotePage;
  localStateRef.current = localState;
  onRemoteStateRef.current = onRemoteState;

  useEffect(() => {
    lastSentStateRef.current = null;
    pendingCursorRef.current = null;
    peerLastSeenRef.current.clear();
    lastRemoteActivityRef.current = 0;
    remotePageRef.current = currentIndexRef.current;
    setPeerCount(0);
    setRemoteActive(!canReceive(session.syncMode));
    if (cursorFlushTimerRef.current !== null) {
      window.clearTimeout(cursorFlushTimerRef.current);
      cursorFlushTimerRef.current = null;
    }
  }, [session.enabled, session.role, session.sessionId, session.syncMode]);

  useEffect(() => {
    if (
      !session.enabled ||
      !session.sessionId ||
      (session.role !== "presenter" && session.role !== "viewer")
    )
      return;

    if (!canSend(session.syncMode) && !canReceive(session.syncMode)) return;

    const channelName = `${BROADCAST_CHANNEL_PREFIX}${session.sessionId}`;
    let disposed = false;
    let reconnectAttempt = 0;
    let reconnectTimeoutId: number | null = null;
    let heartbeatIntervalId: number | null = null;
    let peerSweepIntervalId: number | null = null;
    let ws: WebSocket | null = null;
    let wsListeners: {
      open: () => void;
      message: (event: MessageEvent<unknown>) => void;
      error: () => void;
      close: () => void;
    } | null = null;
    let channel: BroadcastChannel | null = null;

    const refreshPeerCount = () => {
      const size = peerLastSeenRef.current.size;
      setPeerCount((previous) => (previous === size ? previous : size));
    };

    const markPeerSeen = (senderId: string, activityAt: number) => {
      peerLastSeenRef.current.set(senderId, activityAt);
      refreshPeerCount();
    };

    const removePeer = (senderId: string) => {
      if (!peerLastSeenRef.current.delete(senderId)) return;

      refreshPeerCount();
    };

    const sendEnvelope = (message: EnvelopeInput) => {
      if (disposed) return;

      seqRef.current += 1;
      const envelope: PresentationEnvelope = {
        version: PRESENTATION_PROTOCOL_VERSION,
        sessionId: session.sessionId,
        senderId: session.senderId,
        seq: seqRef.current,
        timestamp: Date.now(),
        ...message,
      };

      channel?.postMessage(envelope);

      if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(envelope));
    };

    const sendSnapshot = () => {
      if (!canSend(session.syncMode) || !canAuthorState(session.role)) return;

      const state = createSnapshotState(localStateRef.current);
      sendEnvelope({
        type: "state/snapshot",
        payload: {
          state,
        },
      });
    };

    const onIncomingEnvelope = (incoming: unknown) => {
      const envelope = parsePresentationEnvelope(incoming);
      if (!envelope) return;

      if (envelope.sessionId !== session.sessionId || envelope.senderId === session.senderId)
        return;

      const observedAt = Date.now();
      markPeerSeen(envelope.senderId, observedAt);
      lastRemoteActivityRef.current = observedAt;
      if (canReceive(session.syncMode)) setRemoteActive(true);

      if (envelope.type === "session/leave") {
        removePeer(envelope.senderId);
        return;
      }

      if (envelope.type === "heartbeat") return;

      if (
        envelope.type === "session/join" &&
        canSend(session.syncMode) &&
        canAuthorState(session.role)
      ) {
        sendSnapshot();
        return;
      }

      if (envelope.type === "state/snapshot" || envelope.type === "state/patch") {
        if (!canReceive(session.syncMode)) return;

        const patchState = envelope.payload.state;
        const updateAt = patchState.lastUpdate ?? envelope.timestamp;
        if (updateAt <= lastRemoteUpdateRef.current) return;

        lastRemoteUpdateRef.current = updateAt;
        setLastSyncedAt(updateAt);

        let remotePage = remotePageRef.current;
        if (typeof patchState.page === "number") {
          const maxIndex = Math.max(totalRef.current - 1, 0);
          const nextIndex = clamp(Math.round(patchState.page), 0, maxIndex);
          remotePage = nextIndex;
          remotePageRef.current = nextIndex;
          if (followRemotePageRef.current && nextIndex !== currentIndexRef.current)
            goToRef.current(nextIndex);
        }

        onRemoteStateRef.current(patchState, remotePage);
      }
    };

    const onBroadcastMessage = (event: MessageEvent<unknown>) => {
      onIncomingEnvelope(event.data);
    };

    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel(channelName);
      channel.addEventListener("message", onBroadcastMessage);
      setBroadcastConnected(true);
    } else {
      setBroadcastConnected(false);
    }

    const closeWs = () => {
      if (!ws) return;

      if (wsListeners) {
        ws.removeEventListener("open", wsListeners.open);
        ws.removeEventListener("message", wsListeners.message);
        ws.removeEventListener("error", wsListeners.error);
        ws.removeEventListener("close", wsListeners.close);
      }

      ws.close();
      ws = null;
      wsListeners = null;
    };

    const scheduleReconnect = () => {
      if (!session.wsUrl || disposed) return;

      setWsState("reconnecting");
      const delay = Math.min(
        BASE_RECONNECT_DELAY_MS * 2 ** reconnectAttempt,
        MAX_RECONNECT_DELAY_MS,
      );
      reconnectAttempt += 1;
      reconnectTimeoutId = window.setTimeout(() => {
        reconnectTimeoutId = null;
        connectWebSocket();
      }, delay);
    };

    const connectWebSocket = () => {
      if (!session.wsUrl || disposed) return;

      closeWs();
      setWsState("connecting");

      const connectionUrl = new URL(session.wsUrl);
      connectionUrl.searchParams.set("session", session.sessionId);
      connectionUrl.searchParams.set("sender", session.senderId);

      const socket = new WebSocket(connectionUrl.toString());
      ws = socket;

      const onOpen = () => {
        reconnectAttempt = 0;
        setWsState("connected");
        sendEnvelope({
          type: "session/join",
          payload: {
            role: session.role,
          },
        });

        if (canAuthorState(session.role)) sendSnapshot();
      };

      const onMessage = (event: MessageEvent<unknown>) => {
        if (typeof event.data !== "string") return;

        try {
          onIncomingEnvelope(JSON.parse(event.data));
        } catch {
          // Ignore malformed websocket payloads.
        }
      };

      const onError = () => {
        setWsState("reconnecting");
      };

      const onClose = () => {
        if (disposed) return;

        scheduleReconnect();
      };

      wsListeners = {
        open: onOpen,
        message: onMessage,
        error: onError,
        close: onClose,
      };

      socket.addEventListener("open", onOpen);
      socket.addEventListener("message", onMessage);
      socket.addEventListener("error", onError);
      socket.addEventListener("close", onClose);
    };

    if (session.wsUrl) connectWebSocket();
    else setWsState("disabled");

    sendEnvelope({
      type: "session/join",
      payload: {
        role: session.role,
      },
    });

    if (canAuthorState(session.role)) sendSnapshot();

    heartbeatIntervalId = window.setInterval(() => {
      sendEnvelope({
        type: "heartbeat",
        payload: {
          role: session.role,
        },
      });
    }, HEARTBEAT_INTERVAL_MS);

    peerSweepIntervalId = window.setInterval(() => {
      const now = Date.now();
      for (const [peerId, lastSeenAt] of peerLastSeenRef.current) {
        if (now - lastSeenAt > PEER_STALE_AFTER_MS) peerLastSeenRef.current.delete(peerId);
      }

      refreshPeerCount();
      if (canReceive(session.syncMode))
        setRemoteActive(now - lastRemoteActivityRef.current <= REMOTE_ACTIVE_WINDOW_MS);
    }, PEER_SWEEP_INTERVAL_MS);

    sendEnvelopeRef.current = sendEnvelope;
    sendSnapshotRef.current = sendSnapshot;

    return () => {
      sendEnvelope({
        type: "session/leave",
        payload: {
          role: session.role,
        },
      });
      disposed = true;

      if (reconnectTimeoutId !== null) window.clearTimeout(reconnectTimeoutId);

      if (heartbeatIntervalId !== null) window.clearInterval(heartbeatIntervalId);

      if (peerSweepIntervalId !== null) window.clearInterval(peerSweepIntervalId);

      if (channel) {
        channel.removeEventListener("message", onBroadcastMessage);
        channel.close();
      }

      closeWs();
      sendEnvelopeRef.current = null;
      sendSnapshotRef.current = null;
      setBroadcastConnected(false);
      setWsState(session.wsUrl ? "connecting" : "disabled");
      setPeerCount(0);
      setRemoteActive(!canReceive(session.syncMode));
    };
  }, [
    session.enabled,
    session.role,
    session.senderId,
    session.sessionId,
    session.syncMode,
    session.wsUrl,
  ]);

  useEffect(() => {
    if (!session.enabled || !session.sessionId) return;

    if (!canSend(session.syncMode) || !canAuthorState(session.role)) return;

    const sendEnvelope = sendEnvelopeRef.current;
    if (!sendEnvelope) return;

    const previous = lastSentStateRef.current;
    const current = localState;

    if (!previous) {
      sendSnapshotRef.current?.();
      lastSentStateRef.current = current;
      return;
    }

    const hasPageChange = previous.page !== current.page;
    const hasClicksChange = previous.clicks !== current.clicks;
    const hasClicksTotalChange = previous.clicksTotal !== current.clicksTotal;
    const hasTimerChange = previous.timer !== current.timer;
    const hasDrawingsChange = previous.drawingsRevision !== current.drawingsRevision;
    const hasCursorChange = !isCursorEqual(previous.cursor, current.cursor);

    if (
      !hasPageChange &&
      !hasClicksChange &&
      !hasClicksTotalChange &&
      !hasTimerChange &&
      !hasDrawingsChange &&
      !hasCursorChange
    )
      return;

    if (
      hasPageChange ||
      hasClicksChange ||
      hasClicksTotalChange ||
      hasTimerChange ||
      hasDrawingsChange
    ) {
      sendEnvelope({
        type: "state/patch",
        payload: {
          state: {
            ...(hasPageChange ? { page: current.page } : {}),
            ...(hasClicksChange ? { clicks: current.clicks } : {}),
            ...(hasClicksTotalChange ? { clicksTotal: current.clicksTotal } : {}),
            ...(hasTimerChange ? { timer: current.timer } : {}),
            ...(hasDrawingsChange
              ? {
                  drawings: current.drawings,
                  drawingsRevision: current.drawingsRevision,
                }
              : {}),
            lastUpdate: Date.now(),
          },
        },
      });
    }

    if (hasCursorChange) {
      pendingCursorRef.current = current.cursor;
      if (cursorFlushTimerRef.current === null) {
        cursorFlushTimerRef.current = window.setTimeout(() => {
          cursorFlushTimerRef.current = null;
          sendEnvelope({
            type: "state/patch",
            payload: {
              state: {
                cursor: pendingCursorRef.current,
                lastUpdate: Date.now(),
              },
            },
          });
        }, CURSOR_PATCH_INTERVAL_MS);
      }
    }

    lastSentStateRef.current = current;
  }, [localState, session.enabled, session.role, session.sessionId, session.syncMode]);

  useEffect(() => {
    return () => {
      if (cursorFlushTimerRef.current !== null) window.clearTimeout(cursorFlushTimerRef.current);
    };
  }, []);

  const status = useMemo(
    () =>
      resolveStatus(session.enabled, session.syncMode, session.wsUrl, wsState, broadcastConnected),
    [broadcastConnected, session.enabled, session.syncMode, session.wsUrl, wsState],
  );

  return {
    status,
    broadcastConnected,
    wsConnected: wsState === "connected",
    lastSyncedAt,
    peerCount,
    remoteActive,
  };
}
