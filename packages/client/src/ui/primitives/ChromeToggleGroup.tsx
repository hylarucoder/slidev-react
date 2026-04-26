import type { ReactNode } from 'react'

function joinClassNames(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(' ')
}

export interface ChromeToggleGroupOption<T extends string | number> {
  value: T
  label: ReactNode
  disabled?: boolean
  title?: string
}

export interface ChromeToggleGroupProps<T extends string | number> {
  label?: string
  value: T
  options: ReadonlyArray<ChromeToggleGroupOption<T>>
  onChange: (value: T) => void
  size?: 'sm' | 'md'
  className?: string
  'aria-label'?: string
}

const sizeClassNames = {
  sm: 'h-7 text-[11px] px-2',
  md: 'h-9 text-xs px-2.5',
} as const

export function ChromeToggleGroup<T extends string | number>({
  label,
  value,
  options,
  onChange,
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: ChromeToggleGroupProps<T>) {
  const content = (
    <div
      role="group"
      aria-label={ariaLabel ?? label}
      className={joinClassNames(
        'inline-flex rounded-md border chrome-border chrome-surface p-[2px] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]',
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={String(option.value)}
            type="button"
            disabled={option.disabled}
            title={option.title}
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={joinClassNames(
              'inline-flex min-w-0 items-center justify-center rounded-[5px] px-2 font-medium transition',
              sizeClassNames[size],
              selected
                ? 'bg-emerald-50 text-emerald-700 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.28)]'
                : 'chrome-fg-muted chrome-fg-hover',
              option.disabled && 'cursor-not-allowed opacity-60',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )

  if (!label) return content

  return (
    <label className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] chrome-fg-subtle">
      {label}
      {content}
    </label>
  )
}
