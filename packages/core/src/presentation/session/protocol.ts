import { z } from "zod";

export const PRESENTATION_PROTOCOL_VERSION = 2 as const;

export type PresentationRole = "standalone" | "presenter" | "viewer";
export type SyncedPresentationRole = Exclude<PresentationRole, "standalone">;
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
  step: number;
  stepTotal: number;
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
    role: SyncedPresentationRole;
  };
}

export interface PresentationLeaveEnvelope extends PresentationEnvelopeBase {
  type: "session/leave";
  payload: {
    role: SyncedPresentationRole;
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
    role: SyncedPresentationRole;
  };
}

export type PresentationEnvelope =
  | PresentationJoinEnvelope
  | PresentationLeaveEnvelope
  | PresentationSnapshotEnvelope
  | PresentationPatchEnvelope
  | PresentationHeartbeatEnvelope;

const presentationCursorStateSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const presentationDrawPointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const presentationDrawStrokeSchema = z.object({
  id: z.string(),
  color: z.string(),
  width: z.number(),
  kind: z.enum(["pen", "circle", "rectangle"]).optional(),
  points: z.array(presentationDrawPointSchema),
});

const presentationDrawingsStateSchema = z.record(z.string(), z.array(presentationDrawStrokeSchema));

const presentationSharedStateSchema = z.object({
  page: z.number(),
  step: z.number(),
  stepTotal: z.number(),
  timer: z.number(),
  cursor: presentationCursorStateSchema.nullable(),
  drawings: presentationDrawingsStateSchema,
  drawingsRevision: z.number(),
  lastUpdate: z.number(),
});

const presentationSharedStatePatchSchema = presentationSharedStateSchema.partial();

const syncedPresentationRoleSchema = z.enum(["presenter", "viewer"]);

const presentationEnvelopeBaseSchema = z.object({
  version: z.literal(PRESENTATION_PROTOCOL_VERSION),
  sessionId: z.string(),
  senderId: z.string(),
  seq: z.number(),
  timestamp: z.number(),
});

const sessionJoinEnvelopeSchema = presentationEnvelopeBaseSchema.extend({
  type: z.literal("session/join"),
  payload: z.object({
    role: syncedPresentationRoleSchema,
  }),
});

const sessionLeaveEnvelopeSchema = presentationEnvelopeBaseSchema.extend({
  type: z.literal("session/leave"),
  payload: z.object({
    role: syncedPresentationRoleSchema,
  }),
});

const heartbeatEnvelopeSchema = presentationEnvelopeBaseSchema.extend({
  type: z.literal("heartbeat"),
  payload: z.object({
    role: syncedPresentationRoleSchema,
  }),
});

const snapshotEnvelopeSchema = presentationEnvelopeBaseSchema.extend({
  type: z.literal("state/snapshot"),
  payload: z.object({
    state: presentationSharedStateSchema,
  }),
});

const patchEnvelopeSchema = presentationEnvelopeBaseSchema.extend({
  type: z.literal("state/patch"),
  payload: z.object({
    state: presentationSharedStatePatchSchema,
  }),
});

const presentationEnvelopeSchema = z.discriminatedUnion("type", [
  sessionJoinEnvelopeSchema,
  sessionLeaveEnvelopeSchema,
  heartbeatEnvelopeSchema,
  snapshotEnvelopeSchema,
  patchEnvelopeSchema,
]);

export function parsePresentationDrawingsState(value: unknown): PresentationDrawingsState | null {
  const result = presentationDrawingsStateSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function parsePresentationEnvelope(value: unknown): PresentationEnvelope | null {
  const result = presentationEnvelopeSchema.safeParse(value);
  return result.success ? result.data : null;
}
