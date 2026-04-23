import { useMemo, useRef } from 'react'
import type { PresentationSharedState } from '../../types'
import { resolvePresentationSyncStatus } from '../model/status'
import type {
  PresentationSyncRuntimeRefs,
  PresentationSyncSendEnvelope,
  UsePresentationSyncOptions,
  UsePresentationSyncResult,
} from '../types'
import { useSyncPresenceRuntime } from './useSyncPresenceRuntime'
import { useSyncReplicationRuntime } from './useSyncReplicationRuntime'
import { useSyncTransportRuntime } from './useSyncTransportRuntime'

export function usePresentationSyncRuntime({
  session,
  currentIndex,
  total,
  goTo,
  followRemotePage,
  localState,
  onRemoteState,
}: UsePresentationSyncOptions): UsePresentationSyncResult {
  const refs: PresentationSyncRuntimeRefs = {
    seqRef: useRef(0),
    currentIndexRef: useRef(currentIndex),
    goToRef: useRef(goTo),
    totalRef: useRef(total),
    followRemotePageRef: useRef(followRemotePage),
    localStateRef: useRef(localState),
    onRemoteStateRef: useRef(onRemoteState),
    lastRemoteUpdateRef: useRef(0),
    remotePageRef: useRef(currentIndex),
    sendEnvelopeRef: useRef<PresentationSyncSendEnvelope | null>(null),
    sendSnapshotRef: useRef<(() => void) | null>(null),
    lastSentStateRef: useRef<PresentationSharedState | null>(null),
    pendingCursorRef: useRef<PresentationSharedState['cursor'] | null>(null),
    cursorFlushTimerRef: useRef<number | null>(null),
  }

  refs.currentIndexRef.current = currentIndex
  refs.goToRef.current = goTo
  refs.totalRef.current = total
  refs.followRemotePageRef.current = followRemotePage
  refs.localStateRef.current = localState
  refs.onRemoteStateRef.current = onRemoteState

  const presence = useSyncPresenceRuntime({ session })
  const replication = useSyncReplicationRuntime({ session, refs, localState })
  const transport = useSyncTransportRuntime({
    session,
    refs,
    markPeerActivity: presence.markPeerActivity,
    removePeerActivity: presence.removePeerActivity,
    sweepPresence: presence.sweepPresence,
    resetPresence: presence.resetPresence,
    applyIncomingState: replication.applyIncomingState,
  })

  const status = useMemo(
    () =>
      resolvePresentationSyncStatus({
        sessionEnabled: session.enabled,
        syncMode: session.syncMode,
        sessionWsUrl: session.wsUrl,
        transportState: transport.wsState,
        broadcastConnected: transport.broadcastConnected,
      }),
    [
      session.enabled,
      session.syncMode,
      session.wsUrl,
      transport.broadcastConnected,
      transport.wsState,
    ],
  )

  return {
    status,
    broadcastConnected: transport.broadcastConnected,
    wsConnected: transport.wsState === 'connected',
    lastSyncedAt: replication.lastSyncedAt,
    peerCount: presence.peerCount,
    remoteActive: presence.remoteActive,
  }
}
