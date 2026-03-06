export const PRESENTATION_PROTOCOL_VERSION = 1 as const;

export type PresentationRole = "standalone" | "presenter" | "viewer";
export type PresentationSyncMode = "send" | "receive" | "both" | "off";

export interface PresentationCursorState {
  x: number;
  y: number;
}

export interface PresentationDrawPoint {
  x: number;
  y: number;
}

export interface PresentationDrawStroke {
  id: string;
  color: string;
  width: number;
  kind?: "pen" | "circle" | "rectangle";
  points: PresentationDrawPoint[];
}

export type PresentationDrawingsState = Record<string, PresentationDrawStroke[]>;

export interface PresentationSharedState {
  page: number;
  clicks: number;
  clicksTotal: number;
  timer: number;
  cursor: PresentationCursorState | null;
  drawings: PresentationDrawingsState;
  drawingsRevision: number;
  lastUpdate: number;
}

interface PresentationEnvelopeBase {
  version: typeof PRESENTATION_PROTOCOL_VERSION;
  sessionId: string;
  senderId: string;
  seq: number;
  timestamp: number;
}

export interface PresentationJoinEnvelope extends PresentationEnvelopeBase {
  type: "session/join";
  payload: {
    role: Exclude<PresentationRole, "standalone">;
  };
}

export interface PresentationLeaveEnvelope extends PresentationEnvelopeBase {
  type: "session/leave";
  payload: {
    role: Exclude<PresentationRole, "standalone">;
  };
}

export interface PresentationSnapshotEnvelope extends PresentationEnvelopeBase {
  type: "state/snapshot";
  payload: {
    state: PresentationSharedState;
  };
}

export interface PresentationPatchEnvelope extends PresentationEnvelopeBase {
  type: "state/patch";
  payload: {
    state: Partial<PresentationSharedState>;
  };
}

export interface PresentationHeartbeatEnvelope extends PresentationEnvelopeBase {
  type: "heartbeat";
  payload: {
    role: Exclude<PresentationRole, "standalone">;
  };
}

export type PresentationEnvelope =
  | PresentationJoinEnvelope
  | PresentationLeaveEnvelope
  | PresentationSnapshotEnvelope
  | PresentationPatchEnvelope
  | PresentationHeartbeatEnvelope;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDrawPoint(value: unknown): value is PresentationDrawPoint {
  return isRecord(value) && typeof value.x === "number" && typeof value.y === "number";
}

function isDrawStroke(value: unknown): value is PresentationDrawStroke {
  if (!isRecord(value)) return false;

  if (
    typeof value.id !== "string" ||
    typeof value.color !== "string" ||
    typeof value.width !== "number"
  )
    return false;

  if (
    "kind" in value &&
    value.kind !== "pen" &&
    value.kind !== "circle" &&
    value.kind !== "rectangle"
  )
    return false;

  if (!Array.isArray(value.points)) return false;

  return value.points.every(isDrawPoint);
}

function isDrawingsState(value: unknown): value is PresentationDrawingsState {
  if (!isRecord(value)) return false;

  for (const key of Object.keys(value)) {
    const strokes = value[key];
    if (!Array.isArray(strokes)) return false;

    if (!strokes.every(isDrawStroke)) return false;
  }

  return true;
}

function isStatePatchLike(value: unknown): value is Partial<PresentationSharedState> {
  if (!isRecord(value)) return false;

  if ("page" in value && typeof value.page !== "number") return false;

  if ("clicks" in value && typeof value.clicks !== "number") return false;

  if ("clicksTotal" in value && typeof value.clicksTotal !== "number") return false;

  if ("timer" in value && typeof value.timer !== "number") return false;

  if ("drawingsRevision" in value && typeof value.drawingsRevision !== "number") return false;

  if ("drawings" in value && !isDrawingsState(value.drawings)) return false;

  if ("lastUpdate" in value && typeof value.lastUpdate !== "number") return false;

  if ("cursor" in value) {
    if (value.cursor === null) return true;

    if (!isRecord(value.cursor)) return false;

    if (typeof value.cursor.x !== "number" || typeof value.cursor.y !== "number") return false;
  }

  return true;
}

export function parsePresentationEnvelope(value: unknown): PresentationEnvelope | null {
  if (!isRecord(value)) return null;

  const version = value.version;
  const type = value.type;
  const sessionId = value.sessionId;
  const senderId = value.senderId;
  const seq = value.seq;
  const timestamp = value.timestamp;
  const payload = value.payload;

  if (
    version !== PRESENTATION_PROTOCOL_VERSION ||
    typeof type !== "string" ||
    typeof sessionId !== "string" ||
    typeof senderId !== "string" ||
    typeof seq !== "number" ||
    typeof timestamp !== "number" ||
    !isRecord(payload)
  ) {
    return null;
  }

  if (type === "session/join" || type === "session/leave" || type === "heartbeat") {
    const role = payload.role;
    if (role !== "presenter" && role !== "viewer") return null;

    return value as PresentationEnvelope;
  }

  if (type === "state/snapshot") {
    if (!isStatePatchLike(payload.state)) return null;

    const state = payload.state;
    if (
      typeof state.page !== "number" ||
      typeof state.clicks !== "number" ||
      typeof state.clicksTotal !== "number" ||
      typeof state.timer !== "number" ||
      !isDrawingsState(state.drawings) ||
      typeof state.drawingsRevision !== "number" ||
      typeof state.lastUpdate !== "number" ||
      !("cursor" in state)
    ) {
      return null;
    }

    return value as PresentationEnvelope;
  }

  if (type === "state/patch") {
    if (!isStatePatchLike(payload.state)) return null;

    return value as PresentationEnvelope;
  }

  return null;
}
