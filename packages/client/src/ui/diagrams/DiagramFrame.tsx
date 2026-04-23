import type { CSSProperties, ReactNode } from 'react'

export interface DiagramFrameProps {
  state?: 'ready' | 'loading' | 'error'
  errorMessage?: string
  onRetry?: () => void
  /**
   * Optional rendering hint (e.g. used by Mermaid to embed SVG directly).
   * When omitted, children are rendered inside a neutral surface.
   */
  children?: ReactNode
  className?: string
  style?: CSSProperties
  /**
   * Additional slot rendered on top of the surface (e.g. a zoom button).
   */
  topRight?: ReactNode
}

export function DiagramFrame({
  state = 'ready',
  errorMessage,
  onRetry,
  children,
  className,
  style,
  topRight,
}: DiagramFrameProps) {
  return (
    <div
      className={`slide-diagram-frame relative overflow-hidden rounded-[6px] border border-slate-200/80 bg-white/88 ${className ?? ''}`}
      style={style}
      data-state={state}
    >
      {state === 'loading' && (
        <div
          className="slide-diagram-frame__loading absolute inset-0 grid place-items-center text-xs text-slate-500"
          aria-live="polite"
        >
          <span className="inline-flex items-center gap-2">
            <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
            Rendering…
          </span>
        </div>
      )}

      {state === 'error' && (
        <div
          className="slide-diagram-frame__error absolute inset-0 grid place-items-center p-4 text-sm text-rose-700"
          role="alert"
        >
          <div className="max-w-sm text-center">
            <p className="font-medium">Diagram failed to render</p>
            {errorMessage && (
              <p className="mt-2 whitespace-pre-wrap break-words text-[12px] leading-5 text-rose-600">
                {errorMessage}
              </p>
            )}
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 inline-flex items-center justify-center rounded-md border border-rose-300 bg-white px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {topRight && (
        <div className="pointer-events-auto absolute right-2 top-2 z-10">{topRight}</div>
      )}

      <div
        className={`slide-diagram-frame__body size-full ${state === 'ready' ? '' : 'opacity-40 transition-opacity'}`}
      >
        {children}
      </div>
    </div>
  )
}
