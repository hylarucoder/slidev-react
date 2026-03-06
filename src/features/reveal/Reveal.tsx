import {
  Children,
  cloneElement,
  isValidElement,
  useLayoutEffect,
  type ReactNode,
  type CSSProperties,
  type ReactElement,
} from 'react'
import { useReveal } from './RevealContext'

export type RevealPreset = 'fade' | 'fade-up' | 'scale-in'

function joinClassNames(...names: Array<string | undefined>) {
  return names.filter(Boolean).join(' ')
}

function normalizeStep(step: number) {
  if (!Number.isFinite(step))
    return 1

  return Math.max(1, Math.floor(step))
}

function toRevealClassName(preset: RevealPreset) {
  return `slide-reveal slide-reveal--${preset}`
}

function cloneWithRevealClass(
  child: ReactElement<Record<string, unknown>>,
  className: string,
  hidden?: boolean,
) {
  const childClassName = typeof child.props.className === "string"
    ? child.props.className
    : undefined
  const childStyle = child.props.style as CSSProperties | undefined

  return cloneElement(child, {
    'aria-hidden': hidden,
    className: joinClassNames(childClassName, className),
    style: childStyle,
  })
}

export function Reveal({
  step,
  preset = "fade-up",
  asChild = false,
  reserveSpace = false,
  children,
}: {
  step: number
  preset?: RevealPreset
  asChild?: boolean
  reserveSpace?: boolean
  children: ReactNode
}) {
  const reveal = useReveal()
  const normalizedStep = normalizeStep(step)
  const registerStep = reveal?.registerStep
  const slideId = reveal?.slideId

  useLayoutEffect(() => {
    if (!registerStep)
      return

    return registerStep(normalizedStep)
  }, [normalizedStep, registerStep, slideId])

  if (!reveal)
    return <>{children}</>

  const isVisible = reveal.clicks >= normalizedStep
  const className = isVisible
    ? toRevealClassName(preset)
    : 'slide-reveal slide-reveal--reserve'

  if (!isVisible && !reserveSpace)
    return null

  if (asChild && Children.count(children) === 1 && isValidElement(children)) {
    return cloneWithRevealClass(
      children as ReactElement<Record<string, unknown>>,
      className,
      !isVisible,
    )
  }

  return (
    <div aria-hidden={!isVisible} className={className}>
      {children}
    </div>
  )
}

export function RevealGroup({
  start = 1,
  increment = 1,
  preset = "fade-up",
  reserveSpace = false,
  children,
}: {
  start?: number
  increment?: number
  preset?: RevealPreset
  reserveSpace?: boolean
  children: ReactNode
}) {
  let index = 0

  return (
    <>
      {Children.map(children, (child) => {
        if (child === null || child === undefined || typeof child === "boolean")
          return child

        const step = normalizeStep(start + (index * increment))
        index += 1

        if (isValidElement(child)) {
          return (
            <Reveal
              key={child.key ?? step}
              step={step}
              preset={preset}
              reserveSpace={reserveSpace}
              asChild
            >
              {child}
            </Reveal>
          )
        }

        return (
          <Reveal
            key={step}
            step={step}
            preset={preset}
            reserveSpace={reserveSpace}
          >
            {child}
          </Reveal>
        )
      })}
    </>
  )
}
