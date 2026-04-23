import { Circle, Eraser, PenLine, RectangleHorizontal, RotateCcw, Trash2 } from 'lucide-react'
import { ChromeIconButton } from '../../../ui/primitives/ChromeIconButton'
import { DRAW_COLORS, DRAW_WIDTHS } from '../../../ui/tokens'
import { useDraw } from '../draw/DrawProvider'

export function StatusBarDrawToolbar({ slideId }: { slideId: string }) {
  const draw = useDraw()
  const strokeCount = draw.strokesBySlideId[slideId]?.length ?? 0
  const hasStrokes = strokeCount > 0

  return (
    <>
      <ChromeIconButton
        onClick={draw.toggleEnabled}
        title="Toggle draw (D)"
        aria-label="Toggle draw mode"
        tone={draw.enabled ? 'active' : 'default'}
      >
        <PenLine size={16} />
      </ChromeIconButton>
      {draw.enabled && (
        <>
          <ChromeIconButton
            onClick={() => draw.setTool('pen')}
            title="Pen (P)"
            aria-label="Use pen tool"
            tone={draw.tool === 'pen' ? 'active' : 'default'}
          >
            <PenLine size={15} />
          </ChromeIconButton>
          <ChromeIconButton
            onClick={() => draw.setTool('circle')}
            title="Circle (B)"
            aria-label="Use circle tool"
            tone={draw.tool === 'circle' ? 'active' : 'default'}
          >
            <Circle size={15} />
          </ChromeIconButton>
          <ChromeIconButton
            onClick={() => draw.setTool('rectangle')}
            title="Rectangle (R)"
            aria-label="Use rectangle tool"
            tone={draw.tool === 'rectangle' ? 'active' : 'default'}
          >
            <RectangleHorizontal size={15} />
          </ChromeIconButton>
          <ChromeIconButton
            onClick={() => draw.setTool('eraser')}
            title="Eraser (E)"
            aria-label="Use eraser tool"
            tone={draw.tool === 'eraser' ? 'active' : 'default'}
          >
            <Eraser size={15} />
          </ChromeIconButton>
          <div className="mx-1 h-6 w-px chrome-divider" aria-hidden />
          {DRAW_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => {
                draw.setColor(color)
                draw.setTool('pen')
              }}
              title={`Set draw color ${color}`}
              aria-label={`Set draw color ${color}`}
              className={`inline-flex size-5 items-center justify-center rounded-full border shadow-sm transition ${draw.color === color ? 'ring-2 ring-emerald-300 chrome-border-strong' : 'opacity-90 hover:opacity-100 chrome-border'}`}
              style={{ backgroundColor: color }}
            />
          ))}
          <div className="mx-1 h-6 w-px chrome-divider" aria-hidden />
          {DRAW_WIDTHS.map((value) => (
            <ChromeIconButton
              key={value}
              onClick={() => {
                draw.setWidth(value)
                draw.setTool('pen')
              }}
              title={`Set brush size ${value}`}
              aria-label={`Set brush size ${value}`}
              tone={draw.width === value ? 'active' : 'default'}
            >
              <span
                className="rounded-full bg-current"
                style={{
                  width: `${Math.max(value + 2, 6)}px`,
                  height: `${Math.max(value + 2, 6)}px`,
                }}
              />
            </ChromeIconButton>
          ))}
          <div className="mx-1 h-6 w-px chrome-divider" aria-hidden />
          <ChromeIconButton
            onClick={() => draw.undo(slideId)}
            disabled={!hasStrokes}
            title="Undo last stroke (Cmd/Ctrl+Z)"
            aria-label="Undo last stroke"
          >
            <RotateCcw size={15} />
          </ChromeIconButton>
          <ChromeIconButton
            onClick={() => draw.clear(slideId)}
            disabled={!hasStrokes}
            title="Clear page strokes (C)"
            aria-label="Clear page strokes"
          >
            <Trash2 size={15} />
          </ChromeIconButton>
        </>
      )}
    </>
  )
}
