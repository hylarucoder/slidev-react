import { useState } from 'react'
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import type { CompiledSlide } from '../../model/types'
import { usePresenterFlowRuntime } from '../usePresenterFlowRuntime'

const slides: CompiledSlide[] = [
  { id: 'slide-a', component: () => null, meta: { clicks: 2 } },
  { id: 'slide-b', component: () => null, meta: { clicks: 0 } },
  { id: 'slide-c', component: () => null, meta: { clicks: 1 } },
]

function FlowHarness() {
  const [currentIndex, setIndex] = useState(0)
  const navigation = { currentIndex, total: slides.length, goTo: setIndex }
  const flow = usePresenterFlowRuntime({ slides, navigation })

  return (
    <div>
      <span data-testid="index">{currentIndex}</span>
      <span data-testid="clicks">{flow.currentClicks}</span>
      <span data-testid="clicks-total">{flow.currentClicksTotal}</span>
      <span data-testid="can-prev">{String(flow.canPrev)}</span>
      <span data-testid="can-next">{String(flow.canNext)}</span>
      <button type="button" data-testid="advance" onClick={flow.advanceReveal}>advance</button>
      <button type="button" data-testid="retreat" onClick={flow.retreatReveal}>retreat</button>
      <button type="button" data-testid="jump-last" onClick={() => flow.goToSlideAtStart(2)}>jump</button>
    </div>
  )
}

async function textOf(testId: string) {
  return document.querySelector(`[data-testid="${testId}"]`)?.textContent
}

test('advances through reveal cues within a slide before moving on', async () => {
  await render(<FlowHarness />)

  await expect.poll(() => textOf('index')).toBe('0')
  await expect.poll(() => textOf('clicks-total')).toBe('2')
  await expect.poll(() => textOf('can-prev')).toBe('false')
  await expect.poll(() => textOf('can-next')).toBe('true')

  document.querySelector<HTMLButtonElement>('[data-testid="advance"]')?.click()
  await expect.poll(() => textOf('clicks')).toBe('1')
  await expect.poll(() => textOf('index')).toBe('0')

  document.querySelector<HTMLButtonElement>('[data-testid="advance"]')?.click()
  await expect.poll(() => textOf('clicks')).toBe('2')

  document.querySelector<HTMLButtonElement>('[data-testid="advance"]')?.click()
  await expect.poll(() => textOf('index')).toBe('1')
  await expect.poll(() => textOf('clicks')).toBe('0')
})

test('retreats back into the previous slide at its last cue', async () => {
  await render(<FlowHarness />)

  document.querySelector<HTMLButtonElement>('[data-testid="jump-last"]')?.click()
  await expect.poll(() => textOf('index')).toBe('2')
  await expect.poll(() => textOf('clicks')).toBe('0')

  document.querySelector<HTMLButtonElement>('[data-testid="retreat"]')?.click()
  await expect.poll(() => textOf('index')).toBe('1')
})

test('goToSlideAtStart resets the cue index on the target slide', async () => {
  await render(<FlowHarness />)

  document.querySelector<HTMLButtonElement>('[data-testid="advance"]')?.click()
  await expect.poll(() => textOf('clicks')).toBe('1')
  document.querySelector<HTMLButtonElement>('[data-testid="advance"]')?.click()
  await expect.poll(() => textOf('clicks')).toBe('2')

  document.querySelector<HTMLButtonElement>('[data-testid="jump-last"]')?.click()
  await expect.poll(() => textOf('index')).toBe('2')
  await expect.poll(() => textOf('clicks')).toBe('0')
})
