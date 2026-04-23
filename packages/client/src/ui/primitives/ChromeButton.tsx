import type { ButtonHTMLAttributes, ReactNode } from 'react'

function joinClassNames(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(' ')
}

const toneClassNames = {
  default:
    'border-slate-200/80 bg-white/88 text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60',
  active: 'border-emerald-200/80 bg-emerald-50 text-emerald-700',
  danger:
    'border-rose-300/80 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60',
  violet:
    'border-violet-300/80 bg-violet-50 text-violet-700 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60',
  success:
    'border-emerald-300/80 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60',
  info: 'border-green-300/80 bg-green-50 text-green-700 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60',
} as const

const sizeClassNames = {
  sm: 'h-7 gap-1 px-2.5 text-[11px]',
  md: 'h-9 gap-1.5 px-3 text-xs',
} as const

export interface ChromeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  leading?: ReactNode
  trailing?: ReactNode
  tone?: keyof typeof toneClassNames
  size?: keyof typeof sizeClassNames
  children: ReactNode
}

export function ChromeButton({
  children,
  className,
  tone = 'default',
  size = 'md',
  leading,
  trailing,
  ...props
}: ChromeButtonProps) {
  return (
    <button
      {...props}
      type={props.type ?? 'button'}
      className={joinClassNames(
        'inline-flex shrink-0 items-center justify-center rounded-md border font-medium transition',
        toneClassNames[tone],
        sizeClassNames[size],
        className,
      )}
    >
      {leading}
      {children}
      {trailing}
    </button>
  )
}
