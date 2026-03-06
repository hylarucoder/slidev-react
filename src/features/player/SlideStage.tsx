import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { SlideComponent, SlideMeta } from '../../deck/model/slide'
import { DrawOverlay } from '../draw/DrawOverlay'
import { useDraw } from '../draw/DrawProvider'
import type { PresentationCursorState } from '../presentation/types'
import { resolveLayout } from '../../theme/layouts/resolveLayout'

const SLIDE_WIDTH = 1920
const SLIDE_HEIGHT = 1080

function joinClassNames(...names: Array<string | undefined>): string {
  return names.filter(Boolean).join(' ')
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function shouldIgnoreStageAdvance(target: EventTarget | null) {
  if (!(target instanceof HTMLElement))
    return false

  return !!target.closest('a, button, input, textarea, select, [contenteditable="true"]')
}

function useSlideScale() {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const element = viewportRef.current
    if (!element || typeof ResizeObserver === 'undefined')
      return

    const updateScale = () => {
      const { width, height } = element.getBoundingClientRect()
      if (!width || !height)
        return

      const nextScale = Math.min(width / SLIDE_WIDTH, height / SLIDE_HEIGHT)
      const scaledWidth = SLIDE_WIDTH * nextScale
      const scaledHeight = SLIDE_HEIGHT * nextScale

      setScale(nextScale)
      setOffset({
        x: (width - scaledWidth) / 2,
        y: (height - scaledHeight) / 2,
      })
    }

    updateScale()

    const observer = new ResizeObserver(updateScale)
    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [])

  return { viewportRef, scale, offset }
}

function toSlidePoint(
  event: ReactPointerEvent<HTMLElement>,
  offset: { x: number, y: number },
  scale: number,
): PresentationCursorState {
  const rect = event.currentTarget.getBoundingClientRect()
  return {
    x: clamp((event.clientX - rect.left - offset.x) / scale, 0, SLIDE_WIDTH),
    y: clamp((event.clientY - rect.top - offset.y) / scale, 0, SLIDE_HEIGHT),
  }
}

function toViewportPoint(
  point: PresentationCursorState,
  offset: { x: number, y: number },
  scale: number,
) {
  return {
    x: offset.x + (point.x * scale),
    y: offset.y + (point.y * scale),
  }
}

export function SlideStage({
  Slide,
  slideId,
  meta,
  deckLayout,
  remoteCursor,
  onCursorChange,
  onStageAdvance,
}: {
  Slide: SlideComponent
  slideId: string
  meta: SlideMeta
  deckLayout?: SlideMeta['layout']
  remoteCursor?: PresentationCursorState | null
  onCursorChange?: (cursor: PresentationCursorState | null) => void
  onStageAdvance?: () => void
}) {
  const Layout = resolveLayout(meta.layout ?? deckLayout)
  const draw = useDraw()
  const { viewportRef, scale, offset } = useSlideScale()
  const className = joinClassNames(
    'slide-prose relative box-border size-full bg-white px-18 py-14 shadow-[0_20px_60px_rgba(21,42,82,0.12)]',
    meta.class,
  )
  const stageStyle = useMemo(() => ({
    width: `${SLIDE_WIDTH}px`,
    height: `${SLIDE_HEIGHT}px`,
    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
    transformOrigin: 'top left',
  }), [offset.x, offset.y, scale])
  const remoteCursorPosition = useMemo(() => {
    if (!remoteCursor)
      return null

    return toViewportPoint(remoteCursor, offset, scale)
  }, [offset, remoteCursor, scale])

  return (
    <main
      ref={viewportRef}
      className="relative size-full min-h-0 min-w-0 overflow-hidden p-0"
      onPointerMove={(event) => {
        if (!onCursorChange)
          return

        onCursorChange(toSlidePoint(event, offset, scale))
      }}
      onPointerLeave={() => {
        onCursorChange?.(null)
      }}
      onClick={(event) => {
        if (!onStageAdvance || draw.enabled)
          return

        if (shouldIgnoreStageAdvance(event.target))
          return

        onStageAdvance()
      }}
    >
      <article className={className} style={stageStyle}>
        <Layout>
          <Slide />
        </Layout>
        <DrawOverlay slideId={slideId} scale={scale} />
      </article>
      {remoteCursorPosition && (
        <span
          aria-hidden
          className="pointer-events-none absolute z-30 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-rose-500 bg-rose-300/40 shadow-[0_0_0_3px_rgba(244,63,94,0.15)]"
          style={{
            left: `${remoteCursorPosition.x}px`,
            top: `${remoteCursorPosition.y}px`,
          }}
        />
      )}
    </main>
  )
}
