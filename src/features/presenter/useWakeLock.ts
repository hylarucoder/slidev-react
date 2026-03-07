import { useCallback, useEffect, useRef, useState } from "react";

interface WakeLockSentinelLike extends EventTarget {
  released: boolean;
  release: () => Promise<void>;
}

interface WakeLockManagerLike {
  request: (type: "screen") => Promise<WakeLockSentinelLike>;
}

declare global {
  interface Navigator {
    wakeLock?: WakeLockManagerLike;
  }
}

function isWakeLockSupported() {
  return typeof navigator !== "undefined" && typeof navigator.wakeLock?.request === "function";
}

export function useWakeLock() {
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);
  const [requested, setRequested] = useState(false);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const release = useCallback(async () => {
    setRequested(false);
    setError(null);

    const sentinel = sentinelRef.current;
    sentinelRef.current = null;

    if (!sentinel) {
      setActive(false);
      return;
    }

    try {
      await sentinel.release();
    } catch (releaseError) {
      setError(releaseError instanceof Error ? releaseError.message : String(releaseError));
    } finally {
      setActive(false);
    }
  }, []);

  const request = useCallback(async () => {
    setRequested(true);
    setError(null);

    if (!isWakeLockSupported()) {
      setActive(false);
      setError("Wake lock is not supported in this browser.");
      return;
    }

    try {
      const sentinel = await navigator.wakeLock!.request("screen");
      sentinelRef.current = sentinel;
      setActive(!sentinel.released);

      sentinel.addEventListener(
        "release",
        () => {
          setActive(false);
          sentinelRef.current = null;
        },
        { once: true },
      );
    } catch (requestError) {
      setActive(false);
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    }
  }, []);

  const toggle = useCallback(async () => {
    if (requested || active) {
      await release();
      return;
    }

    await request();
  }, [active, release, request, requested]);

  useEffect(() => {
    if (!requested || typeof document === "undefined") return;

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      if (!requested || sentinelRef.current) return;
      void request();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [request, requested]);

  useEffect(() => {
    return () => {
      const sentinel = sentinelRef.current;
      sentinelRef.current = null;
      if (sentinel) void sentinel.release();
    };
  }, []);

  return {
    supported: isWakeLockSupported(),
    requested,
    active,
    error,
    request,
    release,
    toggle,
  };
}
