import { useCallback, useEffect, useState } from 'react'
import {
  parsePersistedPresenterCursorMode,
  PRESENTER_CURSOR_MODE_STORAGE_KEY,
} from '../../model/persistence'
import { useIdleCursor } from '../../platform/useIdleCursor'

export type PresenterCursorMode = 'always' | 'idle-hide'

function readInitial(): PresenterCursorMode {
  try {
    return (
      parsePersistedPresenterCursorMode(
        window.localStorage.getItem(PRESENTER_CURSOR_MODE_STORAGE_KEY),
      ) ?? 'always'
    )
  } catch {
    return 'always'
  }
}

export function useCursorMode({
  enabled,
}: {
  enabled: boolean
}) {
  const [cursorMode, setCursorMode] = useState<PresenterCursorMode>(readInitial)

  useEffect(() => {
    try {
      window.localStorage.setItem(PRESENTER_CURSOR_MODE_STORAGE_KEY, cursorMode)
    } catch {
      // Ignore storage write failures.
    }
  }, [cursorMode])

  const handleCursorModeChange = useCallback((value: PresenterCursorMode) => {
    setCursorMode(parsePersistedPresenterCursorMode(value) ?? 'always')
  }, [])

  const hideCursor = useIdleCursor({ enabled: enabled && cursorMode === 'idle-hide' })

  return { cursorMode, handleCursorModeChange, hideCursor }
}
