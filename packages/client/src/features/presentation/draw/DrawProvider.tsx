import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react'
import {
  createEraserStrokeId,
  createStrokeId,
  drawReducer,
  initialDrawPoints,
  strokeKindFromTool,
  type DrawPoint,
  type DrawStroke,
  type DrawStrokesBySlideId,
  type DrawTool,
} from './state/drawReducer'
import { useDrawPersistence } from './state/useDrawPersistence'
import { useRemoteStrokes } from './state/useRemoteStrokes'

export type { DrawPoint, DrawStroke, DrawTool } from './state/drawReducer'

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
  strokesBySlideId: DrawStrokesBySlideId
  replaceAllStrokes: (next: DrawStrokesBySlideId) => void
  startStroke: (slideId: string, point: DrawPoint) => string
  appendStrokePoint: (slideId: string, strokeId: string, point: DrawPoint) => void
  eraseAtPoint: (slideId: string, point: DrawPoint) => void
  undo: (slideId: string) => void
  clear: (slideId: string) => void
}

const DrawContext = createContext<DrawContextValue | null>(null)

function eraseRadiusFor(width: number) {
  return Math.max(width * 2.2, 8)
}

export function DrawProvider({
  storageKey,
  readOnly = false,
  remoteStrokes,
  onStrokesChange,
  children,
}: {
  storageKey: string
  readOnly?: boolean
  remoteStrokes?: {
    revision: number
    strokesBySlideId: DrawStrokesBySlideId
  } | null
  onStrokesChange?: (strokesBySlideId: DrawStrokesBySlideId) => void
  children: ReactNode
}) {
  const [enabled, setEnabled] = useState(false)
  const [tool, setTool] = useState<DrawTool>('pen')
  const [color, setColor] = useState('#ef4444')
  const [width, setWidth] = useState(4)
  const [strokesBySlideId, dispatch] = useReducer(drawReducer, {})

  useEffect(() => {
    if (readOnly) setEnabled(false)
  }, [readOnly])

  const handleReplaceAll = useCallback((next: DrawStrokesBySlideId) => {
    dispatch({ type: 'replaceAll', strokesBySlideId: next })
  }, [])

  useDrawPersistence({
    storageKey,
    strokesBySlideId,
    onLoad: handleReplaceAll,
  })

  useRemoteStrokes({
    remoteStrokes,
    onApply: handleReplaceAll,
  })

  useEffect(() => {
    onStrokesChange?.(strokesBySlideId)
  }, [onStrokesChange, strokesBySlideId])

  const eraseAtPoint = useCallback(
    (slideId: string, point: DrawPoint) => {
      if (readOnly) return
      dispatch({
        type: 'eraseAtPoint',
        slideId,
        point,
        radius: eraseRadiusFor(width),
      })
    },
    [readOnly, width],
  )

  const startStroke = useCallback(
    (slideId: string, point: DrawPoint) => {
      if (readOnly) return `readonly-${Date.now()}`

      if (tool === 'eraser') {
        eraseAtPoint(slideId, point)
        return createEraserStrokeId()
      }

      const kind = strokeKindFromTool(tool)
      const stroke: DrawStroke = {
        id: createStrokeId(),
        color,
        width,
        kind,
        points: initialDrawPoints(kind, point),
      }

      dispatch({ type: 'startStroke', slideId, stroke })
      return stroke.id
    },
    [color, eraseAtPoint, readOnly, tool, width],
  )

  const appendStrokePoint = useCallback(
    (slideId: string, strokeId: string, point: DrawPoint) => {
      if (readOnly) return

      if (strokeId.startsWith('eraser-')) {
        eraseAtPoint(slideId, point)
        return
      }

      dispatch({
        type: 'appendPoint',
        slideId,
        strokeId,
        point,
        toolKind: strokeKindFromTool(tool),
      })
    },
    [eraseAtPoint, readOnly, tool],
  )

  const undo = useCallback(
    (slideId: string) => {
      if (readOnly) return
      dispatch({ type: 'undo', slideId })
    },
    [readOnly],
  )

  const clear = useCallback(
    (slideId: string) => {
      if (readOnly) return
      dispatch({ type: 'clear', slideId })
    },
    [readOnly],
  )

  const value = useMemo<DrawContextValue>(
    () => ({
      enabled,
      setEnabled: (nextEnabled) => {
        if (readOnly) return
        setEnabled(nextEnabled)
      },
      toggleEnabled: () => {
        if (readOnly) return
        setEnabled((v) => !v)
      },
      tool,
      setTool: (nextTool) => {
        if (readOnly) return
        setTool(nextTool)
      },
      color,
      setColor: (nextColor) => {
        if (readOnly) return
        setColor(nextColor)
      },
      width,
      setWidth: (nextWidth) => {
        if (readOnly) return
        setWidth(nextWidth)
      },
      strokesBySlideId,
      replaceAllStrokes: handleReplaceAll,
      startStroke,
      appendStrokePoint,
      eraseAtPoint,
      undo,
      clear,
    }),
    [
      appendStrokePoint,
      clear,
      color,
      enabled,
      eraseAtPoint,
      handleReplaceAll,
      readOnly,
      startStroke,
      strokesBySlideId,
      tool,
      undo,
      width,
    ],
  )

  return <DrawContext.Provider value={value}>{children}</DrawContext.Provider>
}

export function useDraw() {
  const context = useContext(DrawContext)
  if (!context) throw new Error('useDraw must be used inside DrawProvider')

  return context
}
