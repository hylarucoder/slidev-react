import { useCallback, useEffect, useState } from "react";

function isFullscreenSupported() {
  return (
    typeof document !== "undefined" &&
    typeof document.documentElement.requestFullscreen === "function"
  );
}

export function useFullscreen() {
  const [active, setActive] = useState(
    () => typeof document !== "undefined" && document.fullscreenElement !== null,
  );

  useEffect(() => {
    if (typeof document === "undefined") return;

    const onFullscreenChange = () => {
      setActive(document.fullscreenElement !== null);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  const enter = useCallback(async () => {
    if (!isFullscreenSupported()) return;
    await document.documentElement.requestFullscreen();
  }, []);

  const exit = useCallback(async () => {
    if (typeof document === "undefined" || !document.fullscreenElement) return;
    await document.exitFullscreen();
  }, []);

  const toggle = useCallback(async () => {
    if (typeof document === "undefined") return;

    if (document.fullscreenElement) {
      await exit();
      return;
    }

    await enter();
  }, [enter, exit]);

  return {
    supported: isFullscreenSupported(),
    active,
    enter,
    exit,
    toggle,
  };
}
