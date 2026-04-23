import { describe, expect, it } from 'vite-plus/test'
import { resolveRevealMotionState, resolveStepTimingForAnimation } from '../revealMotion'

describe('resolveRevealMotionState', () => {
  it('skips the initial state under reduced motion', () => {
    const state = resolveRevealMotionState({
      variant: 'fade',
      reserveSpace: false,
      reducedMotion: true,
    })
    expect(state.initial).toBe(false)
  })

  it('skips the initial state when variant is "none"', () => {
    const state = resolveRevealMotionState({
      variant: 'none',
      reserveSpace: false,
      reducedMotion: false,
    })
    expect(state.initial).toBe(false)
  })

  it('defaults to hidden initial when animation is allowed', () => {
    const state = resolveRevealMotionState({
      variant: 'fade',
      reserveSpace: false,
      reducedMotion: false,
    })
    expect(state.initial).toBe('hidden')
  })

  it('forwards timing into the transition resolution', () => {
    const state = resolveRevealMotionState({
      variant: 'fade',
      timing: { duration: 0.4, delay: 0.1, ease: 'linear' },
      reserveSpace: false,
      reducedMotion: false,
    })
    expect(state.transition.duration).toBe(0.4)
    expect(state.transition.delay).toBe(0.1)
  })
})

describe('resolveStepTimingForAnimation', () => {
  it('returns the original timing when animation is not disabled', () => {
    const timing = { duration: 0.3, delay: 0.1, ease: 'linear' as const }
    expect(resolveStepTimingForAnimation({ disableAnimation: false, timing })).toBe(timing)
  })

  it('returns zero-duration timing when animation is disabled', () => {
    const flat = resolveStepTimingForAnimation({ disableAnimation: true, timing: undefined })
    expect(flat).toEqual({ duration: 0, delay: 0, ease: 'linear' })
  })
})
