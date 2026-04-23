import { describe, expect, it } from 'vite-plus/test'
import {
  DEFAULT_REVEAL_VARIANT,
  resolveRevealVariants,
  resolveSceneTransition,
  resolveSceneVariantName,
} from '../scene'

describe('presentation motion scene helpers', () => {
  it('prefers variant over legacy preset and falls back to the default reveal variant', () => {
    expect(resolveSceneVariantName('slide-up', 'fade', DEFAULT_REVEAL_VARIANT)).toBe('slide-up')
    expect(resolveSceneVariantName(undefined, 'scale-in', DEFAULT_REVEAL_VARIANT)).toBe('scale-in')
    expect(resolveSceneVariantName(undefined, undefined, DEFAULT_REVEAL_VARIANT)).toBe('fade-up')
  })

  it('normalizes reduced-motion transitions to an immediate linear transition', () => {
    expect(
      resolveSceneTransition({
        defaultDuration: 0.36,
        timing: {
          duration: 0.48,
          delay: 0.2,
          ease: 'circOut',
        },
        reducedMotion: true,
      }),
    ).toEqual({
      duration: 0,
      delay: 0,
      ease: 'linear',
    })
  })

  it('keeps reserve-space reveal nodes hidden but mounted', () => {
    const variants = resolveRevealVariants({
      variant: 'fade-up',
      reserveSpace: true,
    })

    expect(variants.hidden).toMatchObject({
      opacity: 0,
      y: 20,
    })
    expect(variants.visible).toMatchObject({
      opacity: 1,
      y: 0,
      visibility: 'visible',
    })
  })
})
