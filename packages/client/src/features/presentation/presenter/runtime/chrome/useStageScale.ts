import { useCallback, useEffect, useState } from 'react'
import {
  parsePersistedPresenterStageScale,
  PRESENTER_STAGE_SCALE_STORAGE_KEY,
} from '../../model/persistence'

function readInitial(): number {
  try {
    return (
      parsePersistedPresenterStageScale(
        window.localStorage.getItem(PRESENTER_STAGE_SCALE_STORAGE_KEY),
      ) ?? 1
    )
  } catch {
    return 1
  }
}

export function useStageScale() {
  const [stageScale, setStageScale] = useState(readInitial)

  useEffect(() => {
    try {
      window.localStorage.setItem(PRESENTER_STAGE_SCALE_STORAGE_KEY, String(stageScale))
    } catch {
      // Ignore storage write failures.
    }
  }, [stageScale])

  const handleStageScaleChange = useCallback((value: number) => {
    setStageScale(parsePersistedPresenterStageScale(String(value)) ?? 1)
  }, [])

  return { stageScale, handleStageScaleChange }
}
