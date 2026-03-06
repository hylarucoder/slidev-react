import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

export interface DrawPoint {
  x: number
  y: number
}

export interface DrawStroke {
  id: string
  color: string
  width: number
  kind?: 'pen' | 'circle' | 'rectangle'
  points: DrawPoint[]
}

export type DrawTool = 'pen' | 'circle' | 'rectangle' | 'eraser'

interface DrawContextValue {
  enabled: boolean
  setEnabled: (value: boolean) => void
  toggleEnabled: () => void
  tool: DrawTool
  setTool: (tool: DrawTool) => void
  color: string
  setColor: (color: string) => void
  width: number
  setWidth: (width: number) => void
  strokesBySlideId: Record<string, DrawStroke[]>
  replaceAllStrokes: (next: Record<string, DrawStroke[]>) => void
  startStroke: (slideId: string, point: DrawPoint) => string
  appendStrokePoint: (slideId: string, strokeId: string, point: DrawPoint) => void
  eraseAtPoint: (slideId: string, point: DrawPoint) => void
  undo: (slideId: string) => void
  clear: (slideId: string) => void
}

const DrawContext = createContext<DrawContextValue | null>(null)
const STORAGE_VERSION = 1

interface PersistedDrawState {
  version: number
  strokesBySlideId: Record<string, DrawStroke[]>
}

function isTypingElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement))
    return false

  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

function strokeContainsPoint(stroke: DrawStroke, point: DrawPoint, radius: number, radiusSquare: number) {
  if (stroke.kind === 'circle') {
    const center = stroke.points[0]
    const edge = stroke.points[stroke.points.length - 1] ?? center
    const dxEdge = edge.x - center.x
    const dyEdge = edge.y - center.y
    const strokeRadius = Math.hypot(dxEdge, dyEdge)
    const dxPoint = point.x - center.x
    const dyPoint = point.y - center.y
    const distance = Math.hypot(dxPoint, dyPoint)

    return distance <= strokeRadius + radius
  }

  if (stroke.kind === 'rectangle') {
    const start = stroke.points[0]
    const end = stroke.points[stroke.points.length - 1] ?? start
    const minX = Math.min(start.x, end.x) - radius
    const maxX = Math.max(start.x, end.x) + radius
    const minY = Math.min(start.y, end.y) - radius
    const maxY = Math.max(start.y, end.y) + radius

    return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY
  }

  for (const drawPoint of stroke.points) {
    const dx = drawPoint.x - point.x
    const dy = drawPoint.y - point.y
    if ((dx * dx) + (dy * dy) <= radiusSquare)
      return true
  }

  return false
}

export function DrawProvider({
  currentSlideId,
  storageKey,
  readOnly = false,
  remoteStrokes,
  onStrokesChange,
  children,
}: {
  currentSlideId: string
  storageKey: string
  readOnly?: boolean
  remoteStrokes?: {
    revision: number
    strokesBySlideId: Record<string, DrawStroke[]>
  } | null
  onStrokesChange?: (strokesBySlideId: Record<string, DrawStroke[]>) => void
  children: ReactNode
}) {
  const [enabled, setEnabled] = useState(false)
  const [tool, setTool] = useState<DrawTool>('pen')
  const [color, setColor] = useState('#ef4444')
  const [width, setWidth] = useState(4)
  const [strokesBySlideId, setStrokesBySlideId] = useState<Record<string, DrawStroke[]>>({})
  const lastAppliedRemoteRevisionRef = useRef(0)

  const eraseAtPoint = (slideId: string, point: DrawPoint) => {
    if (readOnly)
      return

    const radius = Math.max(width * 2.2, 8)
    const radiusSquare = radius * radius

    setStrokesBySlideId((prev) => {
      const strokes = prev[slideId]
      if (!strokes || strokes.length === 0)
        return prev

      const next = strokes.filter((stroke) => {
        return !strokeContainsPoint(stroke, point, radius, radiusSquare)
      })

      if (next.length === strokes.length)
        return prev

      return {
        ...prev,
        [slideId]: next,
      }
    })
  }

  const startStroke = (slideId: string, point: DrawPoint) => {
    if (readOnly)
      return `readonly-${Date.now()}`

    if (tool === 'eraser') {
      eraseAtPoint(slideId, point)
      return `eraser-${Date.now()}`
    }

    const id = `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const kind: DrawStroke['kind'] = tool === 'circle'
      ? 'circle'
      : tool === 'rectangle'
        ? 'rectangle'
        : 'pen'

    const stroke: DrawStroke = {
      id,
      color,
      width,
      kind,
      points: kind === 'pen' ? [point] : [point, point],
    }

    setStrokesBySlideId((prev) => {
      const next = prev[slideId] ? [...prev[slideId], stroke] : [stroke]
      return {
        ...prev,
        [slideId]: next,
      }
    })

    return id
  }

  const appendStrokePoint = (slideId: string, strokeId: string, point: DrawPoint) => {
    if (readOnly)
      return

    if (strokeId.startsWith('eraser-')) {
      eraseAtPoint(slideId, point)
      return
    }

    setStrokesBySlideId((prev) => {
      const strokes = prev[slideId]
      if (!strokes || strokes.length === 0)
        return prev

      const index = strokes.findIndex(stroke => stroke.id === strokeId)
      if (index < 0)
        return prev

      const target = strokes[index]
      const kind = target.kind ?? 'pen'
      const nextStroke: DrawStroke = {
        ...target,
        points: kind === 'pen'
          ? [...target.points, point]
          : [target.points[0], point],
      }
      const next = [...strokes]
      next[index] = nextStroke

      return {
        ...prev,
        [slideId]: next,
      }
    })
  }

  const undo = (slideId: string) => {
    if (readOnly)
      return

    setStrokesBySlideId((prev) => {
      const strokes = prev[slideId]
      if (!strokes || strokes.length === 0)
        return prev

      return {
        ...prev,
        [slideId]: strokes.slice(0, -1),
      }
    })
  }

  const clear = (slideId: string) => {
    if (readOnly)
      return

    setStrokesBySlideId((prev) => {
      if (!prev[slideId]?.length)
        return prev

      return {
        ...prev,
        [slideId]: [],
      }
    })
  }

  useEffect(() => {
    if (!readOnly)
      return

    setEnabled(false)
  }, [readOnly])

  useEffect(() => {
    if (!remoteStrokes)
      return

    if (remoteStrokes.revision <= lastAppliedRemoteRevisionRef.current)
      return

    lastAppliedRemoteRevisionRef.current = remoteStrokes.revision
    setStrokesBySlideId(remoteStrokes.strokesBySlideId)
  }, [remoteStrokes])

  useEffect(() => {
    if (readOnly)
      return

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingElement(event.target))
        return

      const key = event.key.toLowerCase()
      const hasModifier = event.metaKey || event.ctrlKey || event.altKey

      if (key === 'd' && !hasModifier) {
        event.preventDefault()
        setEnabled(value => !value)
        return
      }

      if (key === 'escape' && enabled && !hasModifier) {
        event.preventDefault()
        setEnabled(false)
        return
      }

      if (key === 'e' && !hasModifier) {
        event.preventDefault()
        setTool('eraser')
        setEnabled(true)
        return
      }

      if (key === 'p' && !hasModifier) {
        event.preventDefault()
        setTool('pen')
        setEnabled(true)
        return
      }

      if (key === 'r' && !hasModifier) {
        event.preventDefault()
        setTool('rectangle')
        setEnabled(true)
        return
      }

      if (key === 'b' && !hasModifier) {
        event.preventDefault()
        setTool('circle')
        setEnabled(true)
        return
      }

      if ((event.metaKey || event.ctrlKey) && key === 'z') {
        event.preventDefault()
        undo(currentSlideId)
        return
      }

      if (enabled && key === 'c' && !hasModifier) {
        event.preventDefault()
        clear(currentSlideId)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [currentSlideId, enabled, readOnly])

  useEffect(() => {
    if (typeof window === 'undefined')
      return

    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) {
        setStrokesBySlideId({})
        return
      }

      const parsed = JSON.parse(raw) as PersistedDrawState
      if (parsed?.version !== STORAGE_VERSION || typeof parsed.strokesBySlideId !== 'object') {
        setStrokesBySlideId({})
        return
      }

      setStrokesBySlideId(parsed.strokesBySlideId ?? {})
    }
    catch {
      setStrokesBySlideId({})
    }
  }, [storageKey])

  useEffect(() => {
    if (typeof window === 'undefined')
      return

    const payload: PersistedDrawState = {
      version: STORAGE_VERSION,
      strokesBySlideId,
    }

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(payload))
    }
    catch {
      // Ignore storage write errors (private mode, quota, etc.)
    }
  }, [storageKey, strokesBySlideId])

  useEffect(() => {
    onStrokesChange?.(strokesBySlideId)
  }, [onStrokesChange, strokesBySlideId])

  const value = useMemo<DrawContextValue>(() => ({
    enabled,
    setEnabled: (nextEnabled) => {
      if (readOnly)
        return

      setEnabled(nextEnabled)
    },
    toggleEnabled: () => {
      if (readOnly)
        return

      setEnabled((enabledState) => !enabledState)
    },
    tool,
    setTool: (nextTool) => {
      if (readOnly)
        return

      setTool(nextTool)
    },
    color,
    setColor: (nextColor) => {
      if (readOnly)
        return

      setColor(nextColor)
    },
    width,
    setWidth: (nextWidth) => {
      if (readOnly)
        return

      setWidth(nextWidth)
    },
    strokesBySlideId,
    replaceAllStrokes: (next) => {
      setStrokesBySlideId(next)
    },
    startStroke,
    appendStrokePoint,
    eraseAtPoint,
    undo,
    clear,
  }), [color, enabled, readOnly, strokesBySlideId, tool, width])

  return <DrawContext.Provider value={value}>{children}</DrawContext.Provider>
}

export function useDraw() {
  const context = useContext(DrawContext)
  if (!context)
    throw new Error('useDraw must be used inside DrawProvider')

  return context
}
