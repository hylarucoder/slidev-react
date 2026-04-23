import { useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { Z_LAYERS } from '../tokens'
import { ChromeIconButton } from './ChromeIconButton'

export type OverlayShellVariant = 'centered' | 'fullscreen'

export interface OverlayShellProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  variant?: OverlayShellVariant
  children: ReactNode
  closeAriaLabel?: string
  contentClassName?: string
}

const variantContainer: Record<OverlayShellVariant, string> = {
  centered:
    'mx-auto flex h-full w-full items-center justify-center px-4 py-8',
  fullscreen: 'mx-auto flex h-full w-full max-w-[2200px] flex-col px-6 py-6',
}

const variantScrim: Record<OverlayShellVariant, string> = {
  centered: 'chrome-scrim-strong backdrop-blur-[2px]',
  fullscreen: 'chrome-scrim-soft backdrop-blur-md',
}

export function OverlayShell({
  open,
  onClose,
  title,
  description,
  variant = 'centered',
  children,
  closeAriaLabel = 'Close overlay',
  contentClassName,
}: OverlayShellProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const titleId = useId()
  const descriptionId = useId()

  useFocusTrap(containerRef, open, { onEscape: onClose })

  if (!open) return null

  return (
    <div
      className={`absolute inset-0 ${variantScrim[variant]}`}
      style={{ zIndex: Z_LAYERS.overlay }}
      role="presentation"
      onClick={variant === 'centered' ? onClose : undefined}
    >
      <div
        className={variantContainer[variant]}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          tabIndex={-1}
          className={
            variant === 'centered'
              ? `flex max-h-full w-full max-w-[520px] flex-col overflow-hidden rounded-[8px] border chrome-border chrome-surface-raised chrome-fg shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur-sm focus:outline-none ${contentClassName ?? ''}`
              : `flex h-full w-full flex-col chrome-fg focus:outline-none ${contentClassName ?? ''}`
          }
        >
          <header
            className={
              variant === 'centered'
                ? 'flex items-center justify-between border-b chrome-border px-4 py-2.5'
                : 'mb-5 flex items-center justify-between'
            }
          >
            <div>
              <h2
                id={titleId}
                className={
                  variant === 'centered'
                    ? 'text-sm font-semibold chrome-fg'
                    : 'text-lg font-semibold chrome-fg'
                }
              >
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-1 text-sm chrome-fg-muted">
                  {description}
                </p>
              )}
            </div>
            <ChromeIconButton
              onClick={onClose}
              aria-label={closeAriaLabel}
              title={closeAriaLabel}
            >
              <X size={variant === 'fullscreen' ? 18 : 14} />
            </ChromeIconButton>
          </header>
          <div
            className={
              variant === 'centered'
                ? 'min-h-0 overflow-auto px-4 py-3.5'
                : 'min-h-0 flex-1 overflow-auto pr-1'
            }
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
