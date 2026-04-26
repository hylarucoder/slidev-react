import {
  resolveRevealVariants,
  resolveSceneTransition,
  type SceneTiming,
  type SceneVariantName,
} from '../motion/scene'

export const DEFAULT_REVEAL_DURATION = 0.22

export type RevealMotionState = {
  variants: ReturnType<typeof resolveRevealVariants>
  transition: ReturnType<typeof resolveSceneTransition>
  initial: 'hidden' | false
}

export function resolveRevealMotionState({
  variant,
  timing,
  reserveSpace,
  reducedMotion,
  ssr = false,
}: {
  variant: SceneVariantName
  timing?: SceneTiming
  reserveSpace: boolean
  reducedMotion: boolean
  ssr?: boolean
}): RevealMotionState {
  const skipInitial = ssr || reducedMotion || variant === 'none'

  return {
    variants: resolveRevealVariants({ variant, reserveSpace, reducedMotion }),
    transition: resolveSceneTransition({
      timing,
      defaultDuration: DEFAULT_REVEAL_DURATION,
      reducedMotion,
    }),
    initial: skipInitial ? false : 'hidden',
  }
}

export function resolveStepTimingForAnimation({
  disableAnimation,
  timing,
}: {
  disableAnimation: boolean
  timing?: SceneTiming
}): SceneTiming | undefined {
  if (!disableAnimation) return timing

  return {
    duration: 0,
    delay: 0,
    ease: 'linear',
  }
}
