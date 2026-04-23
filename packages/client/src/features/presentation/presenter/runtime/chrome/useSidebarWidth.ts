import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  parsePersistedPresenterSidebarWidth,
  PRESENTER_SIDEBAR_WIDTH_STORAGE_KEY,
} from '../../model/persistence'

const SIDEBAR_MIN = 280
const SIDEBAR_MAX = 620
const STAGE_MIN = 720
const DIVIDER_WIDTH = 10
const DESKTOP_BREAKPOINT = 1024
const DEFAULT_SIDEBAR_RATIO = 5 / 12

function clamp(value: number, containerWidth: number) {
  const maxWidth = Math.min(
    SIDEBAR_MAX,
    Math.max(SIDEBAR_MIN, containerWidth - STAGE_MIN - DIVIDER_WIDTH),
  )
  return Math.min(Math.max(Math.round(value), SIDEBAR_MIN), maxWidth)
}

function readInitial(): number {
  try {
    const parsed = parsePersistedPresenterSidebarWidth(
      window.localStorage.getItem(PRESENTER_SIDEBAR_WIDTH_STORAGE_KEY),
    )
    if (parsed !== null) return clamp(parsed, window.innerWidth)
  } catch {
    // Ignore storage read failures.
  }
  return clamp(window.innerWidth * DEFAULT_SIDEBAR_RATIO, window.innerWidth)
}

export function useSidebarWidth() {
  const [sidebarWidth, setSidebarWidth] = useState(readInitial)
  const [isWideLayout, setIsWideLayout] = useState(
    () => window.innerWidth >= DESKTOP_BREAKPOINT,
  )
  const [isResizing, setIsResizing] = useState(false)
  const presenterLayoutRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    try {
      window.localStorage.setItem(PRESENTER_SIDEBAR_WIDTH_STORAGE_KEY, String(sidebarWidth))
    } catch {
      // Ignore storage write failures.
    }
  }, [sidebarWidth])

  useEffect(() => {
    const update = () => {
      setIsWideLayout(window.innerWidth >= DESKTOP_BREAKPOINT)
      const containerWidth =
        presenterLayoutRef.current?.getBoundingClientRect().width ?? window.innerWidth
      setSidebarWidth((current) => clamp(current, containerWidth))
    }

    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const setFromPointer = useCallback((clientX: number) => {
    const bounds = presenterLayoutRef.current?.getBoundingClientRect()
    if (!bounds) return

    const nextWidth = clamp(bounds.right - clientX, bounds.width)
    setSidebarWidth((current) => (current === nextWidth ? current : nextWidth))
  }, [])

  useEffect(() => {
    if (!isResizing) return

    const onPointerMove = (event: PointerEvent) => setFromPointer(event.clientX)
    const onPointerUp = () => setIsResizing(false)

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, setFromPointer])

  const handleResizeStart = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return
      event.preventDefault()
      setFromPointer(event.clientX)
      setIsResizing(true)
    },
    [setFromPointer],
  )

  const handleResizeKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (!isWideLayout) return

      let delta = 0
      if (event.key === 'ArrowLeft') delta = 16
      if (event.key === 'ArrowRight') delta = -16
      if (event.key === 'Home') delta = SIDEBAR_MIN - sidebarWidth
      if (event.key === 'End') delta = SIDEBAR_MAX - sidebarWidth
      if (!delta) return

      event.preventDefault()
      const containerWidth =
        presenterLayoutRef.current?.getBoundingClientRect().width ?? window.innerWidth
      setSidebarWidth((current) => clamp(current + delta, containerWidth))
    },
    [isWideLayout, sidebarWidth],
  )

  const presenterLayoutStyle = useMemo(
    () =>
      isWideLayout
        ? {
            gridTemplateColumns: `minmax(0, 1fr) ${DIVIDER_WIDTH}px ${sidebarWidth}px`,
          }
        : undefined,
    [isWideLayout, sidebarWidth],
  )

  return {
    presenterLayoutRef,
    presenterLayoutStyle,
    isWideLayout,
    isResizing,
    sidebarWidth,
    handleResizeStart,
    handleResizeKeyDown,
  }
}
