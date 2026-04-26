import { useEffect } from 'react'
import { createPersistedDrawState, parsePersistedDrawState } from '../persistence'
import type { DrawStrokesBySlideId } from './drawReducer'

export function useDrawPersistence({
  storageKey,
  strokesBySlideId,
  onLoad,
}: {
  storageKey: string
  strokesBySlideId: DrawStrokesBySlideId
  onLoad: (strokes: DrawStrokesBySlideId) => void
}) {
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) {
        onLoad({})
        return
      }
      const parsed = parsePersistedDrawState(raw)
      onLoad(parsed ? parsed.strokesBySlideId : {})
    } catch {
      onLoad({})
    }
    // We only want to load once per storageKey change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  useEffect(() => {
    const payload = createPersistedDrawState(strokesBySlideId)
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(payload))
    } catch {
      // Ignore storage write errors (private mode, quota, etc.)
    }
  }, [storageKey, strokesBySlideId])
}
