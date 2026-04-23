import { useEffect, useRef } from 'react'
import type { DrawStrokesBySlideId } from './drawReducer'

export function useRemoteStrokes({
  remoteStrokes,
  onApply,
}: {
  remoteStrokes?: {
    revision: number
    strokesBySlideId: DrawStrokesBySlideId
  } | null
  onApply: (strokes: DrawStrokesBySlideId) => void
}) {
  const lastAppliedRevisionRef = useRef(0)

  useEffect(() => {
    if (!remoteStrokes) return
    if (remoteStrokes.revision <= lastAppliedRevisionRef.current) return

    lastAppliedRevisionRef.current = remoteStrokes.revision
    onApply(remoteStrokes.strokesBySlideId)
  }, [remoteStrokes, onApply])
}
