import { useEffect, useMemo, useRef, useState } from "react";

const ELAPSED_UPDATE_INTERVAL_MS = 250;

function chooseMimeType(): string | null {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function")
    return null;

  const preferred = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];

  for (const mimeType of preferred) {
    if (MediaRecorder.isTypeSupported(mimeType)) return mimeType;
  }

  return null;
}

function downloadBlob(blob: Blob) {
  const stamp = new Date().toISOString().replaceAll(":", "-").replace(/\..+$/, "");
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `slide-react-recording-${stamp}.webm`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function usePresentationRecorder({ enabled }: { enabled: boolean }) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const elapsedTimerRef = useRef<number | null>(null);

  const supported = useMemo(() => {
    if (typeof navigator === "undefined") return false;

    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getDisplayMedia !== "function")
      return false;

    return typeof MediaRecorder !== "undefined";
  }, []);

  const stopStreamTracks = () => {
    const stream = streamRef.current;
    if (!stream) return;

    for (const track of stream.getTracks()) track.stop();

    streamRef.current = null;
  };

  const clearElapsedTimer = () => {
    if (elapsedTimerRef.current === null) return;

    window.clearInterval(elapsedTimerRef.current);
    elapsedTimerRef.current = null;
  };

  const stop = async () => {
    const recorder = recorderRef.current;
    if (!recorder) return;

    if (recorder.state === "inactive") {
      stopStreamTracks();
      setIsRecording(false);
      clearElapsedTimer();
      return;
    }

    await new Promise<void>((resolve) => {
      recorder.addEventListener("stop", () => resolve(), { once: true });
      recorder.stop();
    });
  };

  const start = async () => {
    if (!enabled || !supported || isRecording) return;

    const mimeType = chooseMimeType();
    if (!mimeType) {
      setError("Your browser does not support a compatible recording format.");
      return;
    }

    try {
      setError(null);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      });

      recorder.addEventListener("stop", () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        stopStreamTracks();
        recorderRef.current = null;
        setIsRecording(false);
        clearElapsedTimer();

        if (blob.size > 0) downloadBlob(blob);
      });

      const [videoTrack] = stream.getVideoTracks();
      if (videoTrack) {
        videoTrack.addEventListener(
          "ended",
          () => {
            void stop();
          },
          { once: true },
        );
      }

      recorder.start(1000);
      startedAtRef.current = Date.now();
      setElapsedMs(0);
      setIsRecording(true);
      clearElapsedTimer();
      elapsedTimerRef.current = window.setInterval(() => {
        setElapsedMs(Date.now() - startedAtRef.current);
      }, ELAPSED_UPDATE_INTERVAL_MS);
    } catch (startError) {
      stopStreamTracks();
      recorderRef.current = null;
      setIsRecording(false);
      clearElapsedTimer();
      setError(startError instanceof Error ? startError.message : String(startError));
    }
  };

  useEffect(() => {
    if (enabled) return;

    if (isRecording) void stop();
    else setError(null);
  }, [enabled, isRecording]);

  useEffect(() => {
    return () => {
      clearElapsedTimer();
      stopStreamTracks();
    };
  }, []);

  return {
    supported,
    isRecording,
    elapsedMs,
    error,
    start,
    stop,
  };
}
