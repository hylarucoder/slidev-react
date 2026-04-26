import type { ReactNode } from 'react'
import { afterEach, expect, test, vi } from 'vitest'
import { page } from 'vite-plus/test/browser'
import { cleanup, render } from 'vitest-browser-react'
import { SlideErrorBoundary } from '../SlideErrorBoundary'

function BrokenSlide(): ReactNode {
  throw new Error('Broken slide runtime')
}

function HealthySlide({ label }: { label: string }) {
  return <div>{label}</div>
}

afterEach(async () => {
  await cleanup()
  vi.restoreAllMocks()
})

test('keeps a rendering failure inside the failing slide boundary', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})

  await render(
    <div>
      <SlideErrorBoundary resetKey='slide-broken' slideId='slide-broken' title='Broken Slide'>
        <BrokenSlide />
      </SlideErrorBoundary>
      <SlideErrorBoundary resetKey='slide-healthy' slideId='slide-healthy' title='Healthy Slide'>
        <HealthySlide label='Healthy slide content' />
      </SlideErrorBoundary>
    </div>,
  )

  await expect
    .element(page.getByText(/this problem is isolated to the current slide/i))
    .toBeInTheDocument()
  await expect.element(page.getByText('Broken slide runtime')).toBeInTheDocument()
  await expect.element(page.getByText('Healthy slide content')).toBeInTheDocument()
})

test('resets after the slide key changes', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})

  const result = await render(
    <SlideErrorBoundary resetKey='slide-broken' slideId='slide-broken' title='Broken Slide'>
      <BrokenSlide />
    </SlideErrorBoundary>,
  )

  await expect.element(page.getByText(/slide render error/i)).toBeInTheDocument()

  await result.rerender(
    <SlideErrorBoundary resetKey='slide-recovered' slideId='slide-recovered' title='Recovered Slide'>
      <HealthySlide label='Recovered slide content' />
    </SlideErrorBoundary>,
  )

  await expect.element(page.getByText('Recovered slide content')).toBeInTheDocument()
})
