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

export type DrawStrokesBySlideId = Record<string, DrawStroke[]>

export type DrawAction =
  | {
      type: 'startStroke'
      slideId: string
      stroke: DrawStroke
    }
  | {
      type: 'appendPoint'
      slideId: string
      strokeId: string
      point: DrawPoint
      toolKind: DrawStroke['kind']
    }
  | {
      type: 'eraseAtPoint'
      slideId: string
      point: DrawPoint
      radius: number
    }
  | {
      type: 'undo'
      slideId: string
    }
  | {
      type: 'clear'
      slideId: string
    }
  | {
      type: 'replaceAll'
      strokesBySlideId: DrawStrokesBySlideId
    }

export const ERASER_STROKE_PREFIX = 'eraser-'
export const READONLY_STROKE_PREFIX = 'readonly-'

export function isEraserStrokeId(strokeId: string) {
  return strokeId.startsWith(ERASER_STROKE_PREFIX)
}

export function createStrokeId() {
  return `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function createEraserStrokeId() {
  return `${ERASER_STROKE_PREFIX}${Date.now()}`
}

export function strokeKindFromTool(tool: DrawTool): DrawStroke['kind'] {
  if (tool === 'circle') return 'circle'
  if (tool === 'rectangle') return 'rectangle'
  return 'pen'
}

export function initialDrawPoints(kind: DrawStroke['kind'], point: DrawPoint): DrawPoint[] {
  return kind === 'pen' ? [point] : [point, point]
}

export function strokeContainsPoint(stroke: DrawStroke, point: DrawPoint, radius: number) {
  const radiusSquare = radius * radius

  if (stroke.kind === 'circle') {
    const center = stroke.points[0]
    const edge = stroke.points[stroke.points.length - 1] ?? center
    const strokeRadius = Math.hypot(edge.x - center.x, edge.y - center.y)
    const distance = Math.hypot(point.x - center.x, point.y - center.y)
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
    if (dx * dx + dy * dy <= radiusSquare) return true
  }
  return false
}

export function drawReducer(
  state: DrawStrokesBySlideId,
  action: DrawAction,
): DrawStrokesBySlideId {
  switch (action.type) {
    case 'startStroke': {
      const existing = state[action.slideId]
      return {
        ...state,
        [action.slideId]: existing ? [...existing, action.stroke] : [action.stroke],
      }
    }

    case 'appendPoint': {
      const strokes = state[action.slideId]
      if (!strokes || strokes.length === 0) return state

      const index = strokes.findIndex((stroke) => stroke.id === action.strokeId)
      if (index < 0) return state

      const target = strokes[index]
      const kind = action.toolKind ?? target.kind ?? 'pen'
      const nextStroke: DrawStroke = {
        ...target,
        points: kind === 'pen' ? [...target.points, action.point] : [target.points[0], action.point],
      }
      const nextStrokes = [...strokes]
      nextStrokes[index] = nextStroke
      return { ...state, [action.slideId]: nextStrokes }
    }

    case 'eraseAtPoint': {
      const strokes = state[action.slideId]
      if (!strokes || strokes.length === 0) return state

      const kept = strokes.filter(
        (stroke) => !strokeContainsPoint(stroke, action.point, action.radius),
      )
      if (kept.length === strokes.length) return state
      return { ...state, [action.slideId]: kept }
    }

    case 'undo': {
      const strokes = state[action.slideId]
      if (!strokes || strokes.length === 0) return state
      return { ...state, [action.slideId]: strokes.slice(0, -1) }
    }

    case 'clear': {
      if (!state[action.slideId]?.length) return state
      return { ...state, [action.slideId]: [] }
    }

    case 'replaceAll':
      return action.strokesBySlideId
  }
}
