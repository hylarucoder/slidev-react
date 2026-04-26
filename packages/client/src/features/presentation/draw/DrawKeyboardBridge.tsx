import { useEffect } from 'react'
import { isTypingElement } from '../session/browser'
import { resolveDrawShortcutAction } from '../navigation/keyboardShortcuts'
import { useDraw } from './DrawProvider'

export function DrawKeyboardBridge({
  currentSlideId,
  readOnly,
  overlayOpen,
}: {
  currentSlideId: string
  readOnly: boolean
  overlayOpen: boolean
}) {
  const draw = useDraw()

  useEffect(() => {
    if (readOnly) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingElement(event.target)) return
      if (overlayOpen) return

      const action = resolveDrawShortcutAction({
        key: event.key,
        metaKey: event.metaKey,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        drawEnabled: draw.enabled,
      })

      if (!action) return

      event.preventDefault()

      switch (action) {
        case 'toggle':
          draw.toggleEnabled()
          return
        case 'exit':
          draw.setEnabled(false)
          return
        case 'tool-pen':
          draw.setTool('pen')
          draw.setEnabled(true)
          return
        case 'tool-eraser':
          draw.setTool('eraser')
          draw.setEnabled(true)
          return
        case 'tool-circle':
          draw.setTool('circle')
          draw.setEnabled(true)
          return
        case 'tool-rectangle':
          draw.setTool('rectangle')
          draw.setEnabled(true)
          return
        case 'undo':
          draw.undo(currentSlideId)
          return
        case 'clear':
          draw.clear(currentSlideId)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    currentSlideId,
    draw,
    draw.enabled,
    overlayOpen,
    readOnly,
  ])

  return null
}
