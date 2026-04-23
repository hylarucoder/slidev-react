export const MOTION_DURATION = {
  fast: 120,
  base: 180,
  slow: 240,
} as const

export type MotionDurationKey = keyof typeof MOTION_DURATION

export const MOTION_EASING = {
  out: 'cubic-bezier(0.16, 1, 0.3, 1)',
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
} as const

export type MotionEasingKey = keyof typeof MOTION_EASING

export function motionStyle(duration: MotionDurationKey, easing: MotionEasingKey = 'out') {
  return {
    transitionDuration: `${MOTION_DURATION[duration]}ms`,
    transitionTimingFunction: MOTION_EASING[easing],
  }
}
