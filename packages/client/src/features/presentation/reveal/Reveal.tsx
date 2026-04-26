import {
  Children,
  isValidElement,
  type ComponentType,
  type ElementType,
  type ReactElement,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { normalizeStep } from '@slidev-react/core/presentation/flow/step'
import { useRevealStep } from './useRevealStep'
import {
  DEFAULT_REVEAL_VARIANT,
  resolveSceneVariantName,
  type SceneTiming,
  type SceneVariantName,
} from '../motion/scene'
import { resolveRevealMotionState, resolveStepTimingForAnimation } from './revealMotion'

export type RevealPreset = 'fade' | 'fade-up' | 'scale-in'
export type RevealVariant = SceneVariantName
export type RevealTiming = SceneTiming

const motionComponentCache = new Map<ElementType, ComponentType<Record<string, unknown>>>()

function joinClassNames(...names: Array<string | undefined>) {
  return names.filter(Boolean).join(' ')
}

function resolveMotionComponent(type: ElementType) {
  const cached = motionComponentCache.get(type)
  if (cached) return cached

  const MotionComponent = (
    motion as unknown as {
      create: (target: ElementType) => ComponentType<Record<string, unknown>>
    }
  ).create(type)

  motionComponentCache.set(type, MotionComponent)
  return MotionComponent
}

function StepBody({
  children,
  isVisible,
  reserveSpace,
  asChild,
  variant,
  timing,
  layout = false,
  className,
}: {
  children: ReactNode
  isVisible: boolean
  reserveSpace: boolean
  asChild: boolean
  variant: RevealVariant
  timing?: RevealTiming
  layout?: boolean
  className?: string
}) {
  const prefersReducedMotion = useReducedMotion()
  const reducedMotion = Boolean(prefersReducedMotion)
  const motionState = resolveRevealMotionState({
    variant,
    timing,
    reserveSpace,
    reducedMotion,
    ssr: typeof window === 'undefined',
  })

  if (asChild && Children.count(children) === 1 && isValidElement(children)) {
    const child = children as ReactElement<Record<string, unknown>>
    const MotionComponent = resolveMotionComponent(child.type as ElementType)
    const childProps = child.props
    const childClassName =
      typeof childProps.className === 'string' ? childProps.className : undefined

    return (
      <MotionComponent
        {...childProps}
        initial={motionState.initial}
        animate={isVisible ? 'visible' : 'hidden'}
        exit="exit"
        variants={motionState.variants}
        transition={motionState.transition}
        layout={layout}
        aria-hidden={!isVisible}
        className={joinClassNames(childClassName, className)}
        data-reveal-state={isVisible ? 'visible' : 'hidden'}
        data-reveal-variant={variant}
      />
    )
  }

  return (
    <motion.div
      initial={motionState.initial}
      animate={isVisible ? 'visible' : 'hidden'}
      exit="exit"
      variants={motionState.variants}
      transition={motionState.transition}
      layout={layout}
      aria-hidden={!isVisible}
      className={className}
      data-reveal-state={isVisible ? 'visible' : 'hidden'}
      data-reveal-variant={variant}
    >
      {children}
    </motion.div>
  )
}

export function Step({
  step,
  preset,
  variant,
  timing,
  layout = false,
  asChild = false,
  reserveSpace = false,
  children,
}: {
  step: number
  preset?: RevealPreset
  variant?: RevealVariant
  timing?: RevealTiming
  layout?: boolean
  asChild?: boolean
  reserveSpace?: boolean
  children: ReactNode
}) {
  const { reveal, isVisible } = useRevealStep(step)

  if (!reveal) return <>{children}</>

  const resolvedVariant = resolveSceneVariantName(variant, preset, DEFAULT_REVEAL_VARIANT)
  const disableAnimation = reveal.disableAnimation ?? false
  const resolvedTiming = resolveStepTimingForAnimation({ disableAnimation, timing })

  if (!isVisible && !reserveSpace) {
    return (
      <AnimatePresence initial={false}>
        {null}
      </AnimatePresence>
    )
  }

  if (!reserveSpace) {
    return (
      <AnimatePresence initial={false} mode="popLayout">
        {isVisible ? (
          <StepBody
            key={step}
            isVisible
            reserveSpace={false}
            asChild={asChild}
            variant={resolvedVariant}
            timing={resolvedTiming}
            layout={layout}
          >
            {children}
          </StepBody>
        ) : null}
      </AnimatePresence>
    )
  }

  return (
    <StepBody
      isVisible={isVisible}
      reserveSpace
      asChild={asChild}
      variant={resolvedVariant}
      timing={resolvedTiming}
      layout={layout}
      className={joinClassNames('slide-reveal-reserve', !isVisible ? 'pointer-events-none' : undefined)}
    >
      {children}
    </StepBody>
  )
}

export function Steps({
  start = 1,
  increment = 1,
  preset,
  variant,
  timing,
  layout = false,
  stagger = 0,
  reserveSpace = false,
  children,
}: {
  start?: number
  increment?: number
  preset?: RevealPreset
  variant?: RevealVariant
  timing?: RevealTiming
  layout?: boolean
  stagger?: number
  reserveSpace?: boolean
  children: ReactNode
}) {
  let index = 0

  return (
    <>
      {Children.map(children, (child) => {
        if (child === null || child === undefined || typeof child === 'boolean') return child

        const step = normalizeStep(start + index * increment) ?? 1
        const stepTiming = {
          ...timing,
          delay: (timing?.delay ?? 0) + index * stagger,
        }
        index += 1

        if (isValidElement(child)) {
          return (
            <Step
              key={child.key ?? step}
              step={step}
              preset={preset}
              variant={variant}
              timing={stepTiming}
              layout={layout}
              reserveSpace={reserveSpace}
              asChild
            >
              {child}
            </Step>
          )
        }

        return (
          <Step
            key={step}
            step={step}
            preset={preset}
            variant={variant}
            timing={stepTiming}
            layout={layout}
            reserveSpace={reserveSpace}
          >
            {child}
          </Step>
        )
      })}
    </>
  )
}
