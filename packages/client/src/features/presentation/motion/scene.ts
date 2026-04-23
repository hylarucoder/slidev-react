import type { Transition, Variants } from 'motion/react'

export type SceneVariantName =
  | 'fade'
  | 'fade-up'
  | 'scale-in'
  | 'slide-left'
  | 'slide-up'
  | 'zoom'
  | 'none'

export type SceneEaseName = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'circOut'

export interface SceneTiming {
  duration?: number
  delay?: number
  ease?: SceneEaseName
}

export const DEFAULT_REVEAL_VARIANT: SceneVariantName = 'fade-up'
export const DEFAULT_SLIDE_TRANSITION_VARIANT: Exclude<SceneVariantName, 'none' | 'fade-up' | 'scale-in'> | 'fade' =
  'fade'

const sceneVariantMap = {
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  },
  'fade-up': {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  'scale-in': {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96 },
  },
  'slide-left': {
    hidden: { opacity: 0, x: 48 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -32 },
  },
  'slide-up': {
    hidden: { opacity: 0, y: 42 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -24 },
  },
  zoom: {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.02 },
  },
  none: {
    hidden: {},
    visible: {},
    exit: {},
  },
} as const

export function resolveSceneVariantName(
  variant: SceneVariantName | undefined,
  legacyPreset: 'fade' | 'fade-up' | 'scale-in' | undefined,
  fallback: SceneVariantName,
) {
  return variant ?? legacyPreset ?? fallback
}

export function resolveSceneTransition({
  timing,
  defaultDuration,
  reducedMotion = false,
}: {
  timing?: SceneTiming
  defaultDuration: number
  reducedMotion?: boolean
}): Transition {
  if (reducedMotion) {
    return {
      duration: 0,
      delay: 0,
      ease: 'linear',
    }
  }

  return {
    duration: timing?.duration ?? defaultDuration,
    delay: timing?.delay ?? 0,
    ease: timing?.ease ?? 'easeOut',
  }
}

export function resolveRevealVariants({
  variant,
  reserveSpace,
  reducedMotion = false,
}: {
  variant: SceneVariantName
  reserveSpace: boolean
  reducedMotion?: boolean
}): Variants {
  if (reducedMotion || variant === 'none') {
    return {
      hidden: reserveSpace
        ? {
            opacity: 0,
            visibility: 'hidden',
            pointerEvents: 'none',
          }
        : {
            opacity: 1,
          },
      visible: {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        rotate: 0,
        visibility: 'visible',
        pointerEvents: 'auto',
      },
      exit: {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        rotate: 0,
      },
    }
  }

  const resolved = sceneVariantMap[variant]
  const hidden = reserveSpace
    ? {
        ...resolved.hidden,
        visibility: 'hidden',
        pointerEvents: 'none',
        transitionEnd: {
          visibility: 'hidden',
          pointerEvents: 'none',
        },
      }
    : resolved.hidden

  return {
    hidden,
    visible: {
      ...resolved.visible,
      visibility: 'visible',
      pointerEvents: 'auto',
    },
    exit: resolved.exit,
  }
}

export function resolveSlideTransitionVariants({
  variant,
  reducedMotion = false,
}: {
  variant: Exclude<SceneVariantName, 'none' | 'fade-up' | 'scale-in'> | 'fade'
  reducedMotion?: boolean
}): Variants {
  if (reducedMotion) {
    return {
      enter: { opacity: 1, x: 0, y: 0, scale: 1 },
      center: { opacity: 1, x: 0, y: 0, scale: 1 },
      exit: { opacity: 1, x: 0, y: 0, scale: 1 },
    }
  }

  const resolved = sceneVariantMap[variant]

  return {
    enter: resolved.hidden,
    center: resolved.visible,
    exit: resolved.exit,
  }
}
