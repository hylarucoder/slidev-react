import { useEffect } from "react";
import { useReveal } from "../reveal/RevealContext";
import { useDeckNavigation } from "./useDeckNavigation";

function isTypingElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function KeyboardController({
  enabled = true,
  onAdvance,
  onRetreat,
  onFirst,
  onLast,
}: {
  enabled?: boolean;
  onAdvance?: () => void;
  onRetreat?: () => void;
  onFirst?: () => void;
  onLast?: () => void;
}) {
  const navigation = useDeckNavigation();
  const reveal = useReveal();

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingElement(event.target)) return;

      if (typeof document !== "undefined" && document.body.dataset.presenterOverlay === "open")
        return;

      if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
        event.preventDefault();
        if (onAdvance) onAdvance();
        else if (reveal) reveal.advance();
        else navigation.next();
        return;
      }

      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        if (onRetreat) onRetreat();
        else if (reveal) reveal.retreat();
        else navigation.prev();
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        if (onFirst) onFirst();
        else navigation.first();
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        if (onLast) onLast();
        else navigation.last();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, navigation, onAdvance, onFirst, onLast, onRetreat, reveal]);

  return null;
}
