import type { PresentationRole, PresentationSyncMode } from './types'
import {
  buildRolePathFromPathname,
  buildStandalonePathFromPathname,
  parsePresentationPath,
  parseStandalonePath,
} from './path'

export interface PresentationSession {
  enabled: boolean
  role: PresentationRole
  syncMode: PresentationSyncMode
  sessionId: string | null
  senderId: string
  wsUrl: string | null
  presenterUrl: string | null
  viewerUrl: string | null
}

function parseRoleFromPath(pathname: string): 'presenter' | null {
  const parsed = parsePresentationPath(pathname)
  if (!parsed)
    return null

  return parsed.role === 'presenter' ? 'presenter' : null
}

function parseSlideNumberFromPath(pathname: string): number | null {
  const liveSlide = parsePresentationPath(pathname)?.slideNumber
  if (typeof liveSlide === 'number')
    return liveSlide

  return parseStandalonePath(pathname)?.slideNumber ?? null
}

function parseSlideNumberFromHash(hash: string): number | null {
  const match = hash.match(/^#\/(\d+)$/)
  if (!match)
    return null

  const number = Number.parseInt(match[1], 10)
  if (Number.isNaN(number) || number < 1)
    return null

  return number
}

function defaultSyncModeForRole(role: PresentationRole): PresentationSyncMode {
  switch (role) {
    case 'presenter':
      return 'send'
    case 'viewer':
      return 'receive'
    default:
      return 'off'
  }
}

function createSenderId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    return crypto.randomUUID()

  return `sender-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function createDefaultSessionId(seed: string) {
  const prefix = seed.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 12) || 'deck'
  return `${prefix}-default`
}

function parseWsUrl(value: string | null): string | null {
  if (!value)
    return null

  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'ws:' && parsed.protocol !== 'wss:')
      return null

    return parsed.toString()
  }
  catch {
    return null
  }
}

function createDefaultWsUrl(): string | null {
  if (typeof window === 'undefined')
    return null

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return parseWsUrl(`${protocol}//${window.location.hostname}:4860/ws`)
}

function buildUrl(
  role: 'presenter' | 'viewer',
  slideNumber: number,
) {
  if (typeof window === 'undefined')
    return null

  const pathname = role === 'presenter'
    ? buildRolePathFromPathname(window.location.pathname, role, slideNumber)
    : buildStandalonePathFromPathname(window.location.pathname, slideNumber)
  return `${window.location.origin}${pathname}`
}

export function updateSyncModeInUrl(mode: PresentationSyncMode) {
  void mode
}

export function buildPresentationEntryUrl(
  role: 'presenter',
  deckKey: string,
) {
  if (typeof window === 'undefined')
    return null

  void deckKey

  const currentSlideNumber = parseSlideNumberFromPath(window.location.pathname)
    ?? parseSlideNumberFromHash(window.location.hash)
    ?? 1

  return buildUrl(role, currentSlideNumber)
}

export function resolvePresentationSession(deckKey: string): PresentationSession {
  const senderId = createSenderId()

  if (typeof window === 'undefined') {
    return {
      enabled: false,
      role: 'standalone',
      syncMode: 'off',
      sessionId: null,
      senderId,
      wsUrl: null,
      presenterUrl: null,
      viewerUrl: null,
    }
  }

  const roleFromPath = parseRoleFromPath(window.location.pathname)
  const standalonePath = parseStandalonePath(window.location.pathname)
  const liveEnabled = roleFromPath !== null || standalonePath !== null

  if (!liveEnabled) {
    return {
      enabled: false,
      role: 'standalone',
      syncMode: 'off',
      sessionId: null,
      senderId,
      wsUrl: null,
      presenterUrl: null,
      viewerUrl: null,
    }
  }

  const initialRole: PresentationRole = roleFromPath ?? 'viewer'
  const parsedWsUrl = createDefaultWsUrl()
  const sessionId = createDefaultSessionId(deckKey)
  const syncMode = defaultSyncModeForRole(initialRole)
  const currentSlideNumber = parseSlideNumberFromPath(window.location.pathname)
    ?? parseSlideNumberFromHash(window.location.hash)
    ?? 1

  const normalizedPath = initialRole === 'presenter'
    ? buildRolePathFromPathname(window.location.pathname, initialRole, currentSlideNumber)
    : buildStandalonePathFromPathname(window.location.pathname, currentSlideNumber)
  const shouldNormalizeUrl = window.location.pathname !== normalizedPath
    || !!window.location.search
    || !!window.location.hash

  if (shouldNormalizeUrl) {
    window.history.replaceState(
      null,
      '',
      normalizedPath,
    )
  }

  return {
    enabled: true,
    role: initialRole,
    syncMode,
    sessionId,
    senderId,
    wsUrl: parsedWsUrl,
    presenterUrl: buildUrl('presenter', currentSlideNumber),
    viewerUrl: buildUrl('viewer', currentSlideNumber),
  }
}
