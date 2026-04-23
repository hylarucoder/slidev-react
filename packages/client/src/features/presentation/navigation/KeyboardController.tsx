import { useEffect } from "react";
import { useReveal } from "../reveal/RevealContext";
import { resolveNavigationShortcutAction } from "./keyboardShortcuts";
import { useSlidesNavigation } from "./useSlidesNavigation";
import { isTypingElement } from "../session/browser";

export function KeyboardController({
  enabled = true,
  overlayOpen = false,
  onAdvance,
  onRetreat,
  onFirst,
  onLast,
}: {
  enabled?: boolean;
  overlayOpen?: boolean;
  onAdvance?: () => void;
  onRetreat?: () => void;
  onFirst?: () => void;
  onLast?: () => void;
}) {
  const navigation = useSlidesNavigation();
  const reveal = useReveal();

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingElement(event.target)) return;

      if (overlayOpen) return;

      const action = resolveNavigationShortcutAction({
        key: event.key,
        shiftKey: event.shiftKey,
      });
      if (!action) return;

      event.preventDefault();

      if (action === "advance") {
        if (onAdvance) onAdvance();
        else if (reveal) reveal.advance();
        else navigation.next();
        return;
      }

      if (action === "retreat") {
        if (onRetreat) onRetreat();
        else if (reveal) reveal.retreat();
        else navigation.prev();
        return;
      }

      if (action === "first") {
        if (onFirst) onFirst();
        else navigation.first();
        return;
      }

      if (action === "last") {
        event.preventDefault();
        if (onLast) onLast();
        else navigation.last();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, navigation, onAdvance, onFirst, onLast, onRetreat, overlayOpen, reveal]);

  return null;
}
