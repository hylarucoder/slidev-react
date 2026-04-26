import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react'
import { Z_LAYERS } from '../tokens/layers'

export type ChromeTooltipSide = 'top' | 'bottom' | 'left' | 'right'

export interface ChromeTooltipProps {
  label: ReactNode
  shortcut?: ReactNode
  side?: ChromeTooltipSide
  delay?: number
  children: ReactElement
}

const sidePositionClassName: Record<ChromeTooltipSide, string> = {
  top: 'bottom-full left-1/2 mb-1.5 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-1.5 -translate-x-1/2',
  left: 'right-full top-1/2 mr-1.5 -translate-y-1/2',
  right: 'left-full top-1/2 ml-1.5 -translate-y-1/2',
}

interface TriggerEventHandlers {
  onMouseEnter?: (event: MouseEvent<HTMLElement>) => void
  onMouseLeave?: (event: MouseEvent<HTMLElement>) => void
  onFocus?: (event: FocusEvent<HTMLElement>) => void
  onBlur?: (event: FocusEvent<HTMLElement>) => void
  'aria-describedby'?: string
}

export function ChromeTooltip({
  label,
  shortcut,
  side = 'top',
  delay = 150,
  children,
}: ChromeTooltipProps) {
  const [open, setOpen] = useState(false)
  const tooltipId = useId()
  const timeoutRef = useRef<number | null>(null)

  const clearTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const show = useCallback(() => {
    clearTimer()
    if (delay <= 0) {
      setOpen(true)
      return
    }
    timeoutRef.current = window.setTimeout(() => setOpen(true), delay)
  }, [clearTimer, delay])

  const hide = useCallback(() => {
    clearTimer()
    setOpen(false)
  }, [clearTimer])

  useEffect(() => () => clearTimer(), [clearTimer])

  if (!isValidElement(children) || label === undefined || label === null || label === '') {
    return children
  }

  const child = children as ReactElement<TriggerEventHandlers>
  const existingDescribedBy = child.props['aria-describedby']
  const mergedDescribedBy = open
    ? existingDescribedBy
      ? `${existingDescribedBy} ${tooltipId}`
      : tooltipId
    : existingDescribedBy

  const trigger = cloneElement(child, {
    'aria-describedby': mergedDescribedBy,
    onMouseEnter: (event: MouseEvent<HTMLElement>) => {
      child.props.onMouseEnter?.(event)
      show()
    },
    onMouseLeave: (event: MouseEvent<HTMLElement>) => {
      child.props.onMouseLeave?.(event)
      hide()
    },
    onFocus: (event: FocusEvent<HTMLElement>) => {
      child.props.onFocus?.(event)
      show()
    },
    onBlur: (event: FocusEvent<HTMLElement>) => {
      child.props.onBlur?.(event)
      hide()
    },
  })

  return (
    <span className="relative inline-flex">
      {trigger}
      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          className={`pointer-events-none absolute whitespace-nowrap rounded-md border chrome-border chrome-surface-raised chrome-fg px-2 py-1 text-xs shadow-sm ${sidePositionClassName[side]}`}
          style={{ zIndex: Z_LAYERS.toast }}
        >
          <span className="inline-flex items-center gap-1.5">
            <span>{label}</span>
            {shortcut !== undefined && shortcut !== null && shortcut !== '' && (
              <kbd className="rounded border chrome-border px-1 font-mono text-[10px] leading-4 chrome-fg-muted">
                {shortcut}
              </kbd>
            )}
          </span>
        </span>
      )}
    </span>
  )
}
