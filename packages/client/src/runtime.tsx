import { createElement } from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'katex/dist/katex.min.css'
import 'shiki-magic-move/dist/style.css'
import App from './app/App'

export function mountSlidesApp(rootElement: HTMLElement | null) {
  if (!rootElement) {
    throw new Error('Slide root element "#root" was not found.')
  }

  createRoot(rootElement).render(
    createElement(StrictMode, null, createElement(App)),
  )
}
