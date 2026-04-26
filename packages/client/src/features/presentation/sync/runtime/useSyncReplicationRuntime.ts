import { useCallback, useEffect, useState } from 'react'
import type { PresentationSession } from '../../session'
import type { PresentationSharedState } from '../../types'
import {
  canAuthorState,
  canSend,
  isCursorEqual,
} from '../model/replication'
import type { PresentationSyncRuntimeRefs } from '../types'

const CURSOR_PATCH_INTERVAL_MS = 80

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export interface SyncReplicationRuntime {
  lastSyncedAt: number | null
  applyIncomingState: (options: {
    patchState: Partial<PresentationSharedState>
    timestamp: number
  }) => void
}

export function useSyncReplicationRuntime({
  session,
  refs,
  localState,
}: {
  session: PresentationSession
  refs: PresentationSyncRuntimeRefs
  localState: PresentationSharedState
}): SyncReplicationRuntime {
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null)

  const clearPendingCursorFlush = useCallback(() => {
    if (refs.cursorFlushTimerRef.current === null) return

    window.clearTimeout(refs.cursorFlushTimerRef.current)
    refs.cursorFlushTimerRef.current = null
  }, [refs.cursorFlushTimerRef])

  const applyIncomingState = useCallback(
    ({
      patchState,
      timestamp,
    }: {
      patchState: Partial<PresentationSharedState>
      timestamp: number
    }) => {
      const updateAt = patchState.lastUpdate ?? timestamp
      if (updateAt <= refs.lastRemoteUpdateRef.current) return

      refs.lastRemoteUpdateRef.current = updateAt
      setLastSyncedAt(updateAt)

      let remotePage = refs.remotePageRef.current
      if (typeof patchState.page === 'number') {
        const maxIndex = Math.max(refs.totalRef.current - 1, 0)
        const nextIndex = clamp(Math.round(patchState.page), 0, maxIndex)
        remotePage = nextIndex
        refs.remotePageRef.current = nextIndex

        if (
          refs.followRemotePageRef.current &&
          nextIndex !== refs.currentIndexRef.current
        ) {
          refs.goToRef.current(nextIndex)
        }
      }

      refs.onRemoteStateRef.current(patchState, remotePage)
    },
    [
      refs.currentIndexRef,
      refs.followRemotePageRef,
      refs.goToRef,
      refs.lastRemoteUpdateRef,
      refs.onRemoteStateRef,
      refs.remotePageRef,
      refs.totalRef,
    ],
  )

  useEffect(() => {
    refs.lastSentStateRef.current = null
    refs.pendingCursorRef.current = null
    refs.lastRemoteUpdateRef.current = 0
    refs.remotePageRef.current = refs.currentIndexRef.current
    setLastSyncedAt(null)
    clearPendingCursorFlush()
  }, [
    clearPendingCursorFlush,
    refs.currentIndexRef,
    refs.lastRemoteUpdateRef,
    refs.lastSentStateRef,
    refs.pendingCursorRef,
    refs.remotePageRef,
    session.enabled,
    session.role,
    session.sessionId,
    session.syncMode,
  ])

  useEffect(() => {
    if (!session.enabled || !session.sessionId) return
    if (!canSend(session.syncMode) || !canAuthorState(session.role)) return

    const sendEnvelope = refs.sendEnvelopeRef.current
    if (!sendEnvelope) return

    const previous = refs.lastSentStateRef.current
    const current = refs.localStateRef.current

    if (!previous) {
      refs.sendSnapshotRef.current?.()
      refs.lastSentStateRef.current = current
      return
    }

    const hasPageChange = previous.page !== current.page
    const hasStepChange = previous.step !== current.step
    const hasStepTotalChange = previous.stepTotal !== current.stepTotal
    const hasTimerChange = previous.timer !== current.timer
    const hasDrawingsChange =
      previous.drawingsRevision !== current.drawingsRevision
    const hasCursorChange = !isCursorEqual(previous.cursor, current.cursor)

    if (
      !hasPageChange &&
      !hasStepChange &&
      !hasStepTotalChange &&
      !hasTimerChange &&
      !hasDrawingsChange &&
      !hasCursorChange
    ) {
      return
    }

    if (
      hasPageChange ||
      hasStepChange ||
      hasStepTotalChange ||
      hasTimerChange ||
      hasDrawingsChange
    ) {
      sendEnvelope({
        type: 'state/patch',
        payload: {
          state: {
            ...(hasPageChange ? { page: current.page } : {}),
            ...(hasStepChange ? { step: current.step } : {}),
            ...(hasStepTotalChange ? { stepTotal: current.stepTotal } : {}),
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
      })
    }

    if (hasCursorChange) {
      refs.pendingCursorRef.current = current.cursor
      if (refs.cursorFlushTimerRef.current === null) {
        refs.cursorFlushTimerRef.current = window.setTimeout(() => {
          refs.cursorFlushTimerRef.current = null

          const activeSendEnvelope = refs.sendEnvelopeRef.current
          if (!activeSendEnvelope) return

          activeSendEnvelope({
            type: 'state/patch',
            payload: {
              state: {
                cursor: refs.pendingCursorRef.current,
                lastUpdate: Date.now(),
              },
            },
          })
        }, CURSOR_PATCH_INTERVAL_MS)
      }
    }

    refs.lastSentStateRef.current = current
  }, [
    refs.cursorFlushTimerRef,
    refs.lastSentStateRef,
    refs.localStateRef,
    refs.pendingCursorRef,
    refs.sendEnvelopeRef,
    refs.sendSnapshotRef,
    localState,
    session.enabled,
    session.role,
    session.sessionId,
    session.syncMode,
  ])

  useEffect(() => clearPendingCursorFlush, [clearPendingCursorFlush])

  return {
    lastSyncedAt,
    applyIncomingState,
  }
}
