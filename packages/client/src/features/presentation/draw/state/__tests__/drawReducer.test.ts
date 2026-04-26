import { describe, expect, it } from 'vite-plus/test'
import {
  drawReducer,
  strokeContainsPoint,
  type DrawStroke,
  type DrawStrokesBySlideId,
} from '../drawReducer'

function penStroke(id: string, points: Array<[number, number]>): DrawStroke {
  return {
    id,
    color: '#ef4444',
    width: 4,
    kind: 'pen',
    points: points.map(([x, y]) => ({ x, y })),
  }
}

const empty: DrawStrokesBySlideId = {}

describe('drawReducer', () => {
  it('startStroke appends the stroke onto the slide', () => {
    const stroke = penStroke('stroke-1', [[0, 0]])
    const next = drawReducer(empty, { type: 'startStroke', slideId: 'a', stroke })
    expect(next).toEqual({ a: [stroke] })
  })

  it('startStroke preserves earlier strokes on the same slide', () => {
    const first = penStroke('s1', [[0, 0]])
    const second = penStroke('s2', [[1, 1]])
    const base = drawReducer(empty, { type: 'startStroke', slideId: 'a', stroke: first })
    const next = drawReducer(base, { type: 'startStroke', slideId: 'a', stroke: second })
    expect(next.a).toHaveLength(2)
    expect(next.a[1]).toEqual(second)
  })

  it('appendPoint grows a pen stroke', () => {
    const base = drawReducer(empty, {
      type: 'startStroke',
      slideId: 'a',
      stroke: penStroke('s1', [[0, 0]]),
    })
    const next = drawReducer(base, {
      type: 'appendPoint',
      slideId: 'a',
      strokeId: 's1',
      point: { x: 5, y: 7 },
      toolKind: 'pen',
    })
    expect(next.a[0].points).toEqual([
      { x: 0, y: 0 },
      { x: 5, y: 7 },
    ])
  })

  it('appendPoint replaces the end point for shape strokes', () => {
    const shape: DrawStroke = {
      id: 's1',
      color: '#3b82f6',
      width: 3,
      kind: 'rectangle',
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ],
    }
    const base = drawReducer(empty, { type: 'startStroke', slideId: 'a', stroke: shape })
    const next = drawReducer(base, {
      type: 'appendPoint',
      slideId: 'a',
      strokeId: 's1',
      point: { x: 20, y: 30 },
      toolKind: 'rectangle',
    })
    expect(next.a[0].points).toEqual([
      { x: 0, y: 0 },
      { x: 20, y: 30 },
    ])
  })

  it('appendPoint is a no-op when stroke id is missing', () => {
    const base = drawReducer(empty, {
      type: 'startStroke',
      slideId: 'a',
      stroke: penStroke('s1', [[0, 0]]),
    })
    const next = drawReducer(base, {
      type: 'appendPoint',
      slideId: 'a',
      strokeId: 'unknown',
      point: { x: 5, y: 5 },
      toolKind: 'pen',
    })
    expect(next).toBe(base)
  })

  it('undo drops the last stroke for a slide', () => {
    const base = drawReducer(empty, {
      type: 'startStroke',
      slideId: 'a',
      stroke: penStroke('s1', [[0, 0]]),
    })
    const withTwo = drawReducer(base, {
      type: 'startStroke',
      slideId: 'a',
      stroke: penStroke('s2', [[1, 1]]),
    })
    const undone = drawReducer(withTwo, { type: 'undo', slideId: 'a' })
    expect(undone.a).toHaveLength(1)
    expect(undone.a[0].id).toBe('s1')
  })

  it('undo is a no-op on an empty slide', () => {
    const next = drawReducer(empty, { type: 'undo', slideId: 'a' })
    expect(next).toBe(empty)
  })

  it('clear empties the slide array', () => {
    const base = drawReducer(empty, {
      type: 'startStroke',
      slideId: 'a',
      stroke: penStroke('s1', [[0, 0]]),
    })
    const cleared = drawReducer(base, { type: 'clear', slideId: 'a' })
    expect(cleared.a).toEqual([])
  })

  it('clear is a no-op if slide has no strokes', () => {
    const next = drawReducer({ a: [] }, { type: 'clear', slideId: 'a' })
    expect(next).toEqual({ a: [] })
  })

  it('eraseAtPoint removes strokes whose points are within radius', () => {
    const near = penStroke('s1', [[0, 0]])
    const far = penStroke('s2', [[100, 100]])
    const base: DrawStrokesBySlideId = { a: [near, far] }
    const next = drawReducer(base, {
      type: 'eraseAtPoint',
      slideId: 'a',
      point: { x: 1, y: 1 },
      radius: 5,
    })
    expect(next.a).toHaveLength(1)
    expect(next.a[0].id).toBe('s2')
  })

  it('eraseAtPoint returns same state when nothing is hit', () => {
    const base: DrawStrokesBySlideId = { a: [penStroke('s1', [[0, 0]])] }
    const next = drawReducer(base, {
      type: 'eraseAtPoint',
      slideId: 'a',
      point: { x: 50, y: 50 },
      radius: 3,
    })
    expect(next).toBe(base)
  })

  it('replaceAll wholly replaces state', () => {
    const base = drawReducer(empty, {
      type: 'startStroke',
      slideId: 'a',
      stroke: penStroke('s1', [[0, 0]]),
    })
    const replacement: DrawStrokesBySlideId = { b: [penStroke('s9', [[9, 9]])] }
    const next = drawReducer(base, { type: 'replaceAll', strokesBySlideId: replacement })
    expect(next).toBe(replacement)
  })
})

describe('strokeContainsPoint', () => {
  it('detects pen strokes within radius', () => {
    const stroke = penStroke('s1', [[0, 0]])
    expect(strokeContainsPoint(stroke, { x: 2, y: 0 }, 3)).toBe(true)
    expect(strokeContainsPoint(stroke, { x: 10, y: 10 }, 3)).toBe(false)
  })

  it('detects circle strokes by center+edge geometry', () => {
    const circle: DrawStroke = {
      id: 'c',
      color: '#000',
      width: 2,
      kind: 'circle',
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ],
    }
    expect(strokeContainsPoint(circle, { x: 11, y: 0 }, 2)).toBe(true)
    expect(strokeContainsPoint(circle, { x: 20, y: 0 }, 2)).toBe(false)
  })

  it('detects rectangle strokes inside the padded bounding box', () => {
    const rect: DrawStroke = {
      id: 'r',
      color: '#000',
      width: 2,
      kind: 'rectangle',
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ],
    }
    expect(strokeContainsPoint(rect, { x: 5, y: 5 }, 2)).toBe(true)
    expect(strokeContainsPoint(rect, { x: 15, y: 15 }, 2)).toBe(false)
  })
})
