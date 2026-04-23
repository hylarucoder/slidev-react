import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  buildShortcutHelpSections,
  createShortcutHelpTriggerState,
  isShortcutHelpOpenKey,
  registerShortcutHelpKeyDown,
  registerShortcutHelpKeyUp,
} from '../../../navigation/keyboardShortcuts'
import { isTypingElement } from '../../../session/browser'

export type PresenterOverlay =
  | 'quick-overview'
  | 'notes-overview'
  | 'timeline-preview'
  | 'shortcuts-help'
  | null

export function useOverlayController({
  canControl,
  canOpenOverview,
}: {
  canControl: boolean
  canOpenOverview: boolean
}) {
  const [activeOverlay, setActiveOverlay] = useState<PresenterOverlay>(null)
  const shortcutHelpTriggerRef = useRef(createShortcutHelpTriggerState())

  const toggleOverlay = useCallback((overlay: Exclude<PresenterOverlay, null>) => {
    setActiveOverlay((value) => (value === overlay ? null : overlay))
  }, [])

  const closeOverlay = useCallback(() => {
    setActiveOverlay(null)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingElement(event.target)) return

      if (!event.repeat) {
        shortcutHelpTriggerRef.current = registerShortcutHelpKeyDown(
          shortcutHelpTriggerRef.current,
          event.key,
        )
      }

      const key = event.key.toLowerCase()

      if (
        isShortcutHelpOpenKey({
          key: event.key,
          shiftKey: event.shiftKey,
          metaKey: event.metaKey,
          ctrlKey: event.ctrlKey,
          altKey: event.altKey,
        })
      ) {
        event.preventDefault()
        toggleOverlay('shortcuts-help')
        return
      }

      if (key === 'o') {
        if (!canOpenOverview) return
        event.preventDefault()
        toggleOverlay('quick-overview')
        return
      }

      if (key === 'n') {
        if (!canControl) return
        event.preventDefault()
        toggleOverlay('notes-overview')
        return
      }

      if (key === 'escape') closeOverlay()
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (isTypingElement(event.target)) return

      const result = registerShortcutHelpKeyUp(
        shortcutHelpTriggerRef.current,
        event.key,
        Date.now(),
      )
      shortcutHelpTriggerRef.current = result.nextState

      if (!result.shouldToggle) return
      toggleOverlay('shortcuts-help')
    }

    const onBlur = () => {
      shortcutHelpTriggerRef.current = createShortcutHelpTriggerState()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [canControl, canOpenOverview, closeOverlay, toggleOverlay])

  const shortcutHelpSections = useMemo(
    () =>
      buildShortcutHelpSections({
        canControl,
        canOpenOverview,
      }),
    [canControl, canOpenOverview],
  )

  return {
    activeOverlay,
    setActiveOverlay,
    toggleOverlay,
    closeOverlay,
    shortcutHelpSections,
    overviewOpen: activeOverlay === 'quick-overview',
    notesOverviewOpen: activeOverlay === 'notes-overview',
    shortcutsHelpOpen: activeOverlay === 'shortcuts-help',
    timelinePreviewOpen: activeOverlay === 'timeline-preview',
  }
}
