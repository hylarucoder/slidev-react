import type { PresentationRole, PresentationSyncMode } from "./types";
import { buildRolePathFromPathname, buildStandalonePathFromPathname } from "./path";
import { resolveSessionLocationState } from "./location";

export interface PresentationSession {
  enabled: boolean;
  role: PresentationRole;
  syncMode: PresentationSyncMode;
  sessionId: string | null;
  senderId: string;
  wsUrl: string | null;
  presenterUrl: string | null;
  viewerUrl: string | null;
}

function defaultSyncModeForRole(role: PresentationRole): PresentationSyncMode {
  switch (role) {
    case "presenter":
      return "send";
    case "viewer":
      return "receive";
    default:
      return "off";
  }
}

function createSenderId() {
  return crypto.randomUUID();
}

function createDefaultSessionId(seed: string) {
  const prefix =
    seed
      .replace(/[^a-z0-9]/gi, "")
      .toLowerCase()
      .slice(0, 12) || "slides";
  return `${prefix}-default`;
}

function parseWsUrl(value: string | null): string | null {
  if (!value) return null;

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") return null;

    return parsed.toString();
  } catch {
    return null;
  }
}

function createDefaultWsUrl(): string | null {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return parseWsUrl(`${protocol}//${window.location.hostname}:4860/ws`);
}

function buildUrl(role: "presenter" | "viewer", slideNumber: number) {
  const pathname =
    role === "presenter"
      ? buildRolePathFromPathname(window.location.pathname, role, slideNumber)
      : buildStandalonePathFromPathname(window.location.pathname, slideNumber);
  return `${window.location.origin}${pathname}`;
}

export function updateSyncModeInUrl(mode: PresentationSyncMode) {
  void mode;
}

export function createDisabledPresentationSession(senderId: string): PresentationSession {
  return {
    enabled: false,
    role: "standalone",
    syncMode: "off",
    sessionId: null,
    senderId,
    wsUrl: null,
    presenterUrl: null,
    viewerUrl: null,
  };
}

export function createPrintExportSession(): PresentationSession {
  return createDisabledPresentationSession("print-export");
}

export function buildPresentationEntryUrl(role: "presenter", deckKey: string) {
  void deckKey;

  const currentSlideNumber = resolveSessionLocationState(window.location.pathname).currentSlideNumber;
  return buildUrl(role, currentSlideNumber);
}

export function resolvePresentationSession(deckKey: string): PresentationSession {
  const senderId = createSenderId();
  const locationState = resolveSessionLocationState(window.location.pathname);
  if (!locationState.enabled) return createDisabledPresentationSession(senderId);

  const initialRole: PresentationRole = locationState.role;
  const parsedWsUrl = createDefaultWsUrl();
  const sessionId = createDefaultSessionId(deckKey);
  const syncMode = defaultSyncModeForRole(initialRole);
  const currentSlideNumber = locationState.currentSlideNumber;
  const normalizedPath = locationState.normalizedPath;
  const shouldNormalizeUrl =
    (!!normalizedPath && window.location.pathname !== normalizedPath) ||
    !!window.location.search ||
    !!window.location.hash;

  if (shouldNormalizeUrl && normalizedPath) {
    window.history.replaceState(null, "", normalizedPath);
  }

  return {
    enabled: true,
    role: initialRole,
    syncMode,
    sessionId,
    senderId,
    wsUrl: parsedWsUrl,
    presenterUrl: buildUrl("presenter", currentSlideNumber),
    viewerUrl: buildUrl("viewer", currentSlideNumber),
  };
}
