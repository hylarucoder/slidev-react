import type { CSSProperties, ReactNode } from 'react'

type AnnotationMarkType = 'underline' | 'box' | 'circle' | 'highlight' | 'strike-through' | 'crossed-off' | 'bracket'
type BracketSide = 'left' | 'right' | 'top' | 'bottom'
type Padding = number | [number, number] | [number, number, number, number]

type AnnotationMarkProps = {
  children: ReactNode
  type?: AnnotationMarkType
  color?: string
  show?: boolean
  animate?: boolean
  animationDuration?: number
  strokeWidth?: number
  padding?: Padding
  iterations?: number
  multiline?: boolean
  rtl?: boolean
  brackets?: BracketSide | BracketSide[]
  className?: string
  style?: CSSProperties
}

const defaultColorByType: Record<AnnotationMarkType, string> = {
  underline: '#2563eb',
  box: '#2563eb',
  circle: '#2563eb',
  highlight: 'rgba(250, 204, 21, 0.78)',
  'strike-through': '#ef4444',
  'crossed-off': '#ef4444',
  bracket: '#2563eb',
}

const defaultPaddingByType: Record<
  AnnotationMarkType,
  [number, number, number, number]
> = {
  underline: [0, 2, 2, 2],
  box: [2, 5, 2, 5],
  circle: [3, 7, 3, 7],
  highlight: [1, 3, 1, 3],
  'strike-through': [0, 2, 0, 2],
  'crossed-off': [1, 3, 1, 3],
  bracket: [3, 7, 3, 7],
}

const defaultStrokeWidthByType: Record<AnnotationMarkType, number> = {
  underline: 2.4,
  box: 2.2,
  circle: 2.2,
  highlight: 0,
  'strike-through': 2.2,
  'crossed-off': 2.2,
  bracket: 2.2,
}

const toSides = (brackets: BracketSide | BracketSide[]) => {
  return Array.isArray(brackets) ? brackets : [brackets]
}

const normalizePadding = (
  padding: Padding | undefined,
  type: AnnotationMarkType,
) => {
  if (typeof padding === 'number') {
    return [padding, padding, padding, padding] as const
  }

  if (Array.isArray(padding)) {
    if (padding.length === 2) {
      return [padding[0], padding[1], padding[0], padding[1]] as const
    }

    if (padding.length === 4) {
      return padding as [number, number, number, number]
    }
  }

  return defaultPaddingByType[type]
}

export function AnnotationMark(props: AnnotationMarkProps) {
  const {
    children,
    type = 'highlight',
    color,
    show = true,
    strokeWidth,
    padding,
    brackets = 'right',
    className,
    style,
  } = props

  if (!show) {
    return <>{children}</>
  }

  const [padTop, padRight, padBottom, padLeft] = normalizePadding(padding, type)
  const sides = toSides(brackets)
  const mergedStyle = {
    ...style,
    '--mark-color': color ?? defaultColorByType[type],
    '--mark-stroke-width': `${strokeWidth ?? defaultStrokeWidthByType[type]}px`,
    '--mark-pad-top': `${padTop}px`,
    '--mark-pad-right': `${padRight}px`,
    '--mark-pad-bottom': `${padBottom}px`,
    '--mark-pad-left': `${padLeft}px`,
  } as CSSProperties

  return (
    <span
      className={className ? `slide-mark slide-mark--${type} ${className}` : `slide-mark slide-mark--${type}`}
      style={mergedStyle}
    >
      <span className="slide-mark-target">{children}</span>
      {type === 'bracket'
        ? sides.map((side) => <span key={side} aria-hidden className={`slide-mark-bracket slide-mark-bracket--${side}`} />)
        : <span aria-hidden className="slide-mark-overlay" />}
    </span>
  )
}
