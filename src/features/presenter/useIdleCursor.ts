import { useEffect, useState } from "react";

export function useIdleCursor({ enabled, idleMs = 2500 }: { enabled: boolean; idleMs?: number }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      setHidden(false);
      return;
    }

    let idleTimer = window.setTimeout(() => {
      setHidden(true);
    }, idleMs);

    const markActive = () => {
      setHidden(false);
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        setHidden(true);
      }, idleMs);
    };

    window.addEventListener("pointermove", markActive, { passive: true });
    window.addEventListener("pointerdown", markActive, { passive: true });
    window.addEventListener("keydown", markActive);

    return () => {
      window.clearTimeout(idleTimer);
      window.removeEventListener("pointermove", markActive);
      window.removeEventListener("pointerdown", markActive);
      window.removeEventListener("keydown", markActive);
    };
  }, [enabled, idleMs]);

  return hidden;
}
