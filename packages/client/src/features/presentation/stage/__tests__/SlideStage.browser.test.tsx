import { DEFAULT_SLIDES_VIEWPORT } from '@slidev-react/core/slides/viewport'
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { AddonProvider } from '../../../../addons/AddonProvider'
import { DrawProvider } from '../../draw/DrawProvider'
import { ThemeProvider } from '../../../../theme/ThemeProvider'
import { SlideStage } from '../SlideStage'

function SlideOne() {
  return <div>Slide One</div>
}

function SlideTwo() {
  return <div>Slide Two</div>
}

test('switches slide content and transition presets through the motion stage driver', async () => {
  const result = await render(
    <ThemeProvider slidesViewport={DEFAULT_SLIDES_VIEWPORT}>
      <AddonProvider>
        <DrawProvider currentSlideId="slide-one" storageKey="slide-stage-browser-test">
          <SlideStage
            Slide={SlideOne}
            slideId="slide-one"
            meta={{ title: 'Slide One', transition: 'slide-left' }}
            slidesConfig={{
              slidesViewport: DEFAULT_SLIDES_VIEWPORT,
              slidesTransition: 'fade',
            }}
          />
        </DrawProvider>
      </AddonProvider>
    </ThemeProvider>,
  )

  await expect.poll(() => document.querySelector('[data-slide-transition]')?.textContent ?? '').toContain(
    'Slide One',
  )
  await expect
    .poll(() => document.querySelector('[data-slide-transition]')?.getAttribute('data-slide-transition'))
    .toBe('slide-left')

  await result.rerender(
    <ThemeProvider slidesViewport={DEFAULT_SLIDES_VIEWPORT}>
      <AddonProvider>
        <DrawProvider currentSlideId="slide-two" storageKey="slide-stage-browser-test">
          <SlideStage
            Slide={SlideTwo}
            slideId="slide-two"
            meta={{ title: 'Slide Two', transition: 'zoom' }}
            slidesConfig={{
              slidesViewport: DEFAULT_SLIDES_VIEWPORT,
              slidesTransition: 'fade',
            }}
          />
        </DrawProvider>
      </AddonProvider>
    </ThemeProvider>,
  )

  await expect.poll(() => document.body.textContent).toContain('Slide Two')
  await expect
    .poll(() => document.querySelector('[data-slide-transition]')?.getAttribute('data-slide-transition'))
    .toBe('zoom')
})
