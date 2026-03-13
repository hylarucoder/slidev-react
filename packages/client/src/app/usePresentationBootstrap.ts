import type compiledSlides from "@generated/slides";
import { useCallback, useEffect, useMemo, useState } from "react";
import { resolvePresentationFileNameBase } from "../features/presentation/recordingFilename";
import {
  createPrintExportSession,
  resolvePresentationSession,
  updateSyncModeInUrl,
  type PresentationSession,
} from "../features/presentation/session";
import type { PresentationSyncMode } from "../features/presentation/types";
import {
  resolvePresentationExportMode,
  resolvePrintExportWithClicks,
} from "@slidev-react/core/presentation/export/urls";

export function usePresentationBootstrap({
  slidesDocument,
}: {
  slidesDocument: typeof compiledSlides;
}) {
  const exportMode = useMemo(
    () => resolvePresentationExportMode(window.location.search),
    [],
  );
  const exportWithClicks = useMemo(
    () => resolvePrintExportWithClicks(window.location.search),
    [],
  );
  const slidesHash = useMemo(() => slidesDocument.sourceHash, [slidesDocument.sourceHash]);
  const drawStorageKey = useMemo(() => `slide-react:draw:${slidesHash}`, [slidesHash]);
  const exportBaseName = useMemo(
    () =>
      resolvePresentationFileNameBase({
        exportFilename: slidesDocument.meta.exportFilename,
        slidesTitle: slidesDocument.meta.title,
      }),
    [slidesDocument.meta.exportFilename, slidesDocument.meta.title],
  );
  const sessionBase = useMemo<PresentationSession>(() => {
    if (exportMode === "print") return createPrintExportSession();

    return resolvePresentationSession(slidesHash);
  }, [exportMode, slidesHash]);
  const [syncMode, setSyncMode] = useState<PresentationSyncMode>(sessionBase.syncMode);
  const presentationSession = useMemo<PresentationSession>(
    () => ({
      ...sessionBase,
      syncMode,
    }),
    [sessionBase, syncMode],
  );

  useEffect(() => {
    setSyncMode(sessionBase.syncMode);
  }, [sessionBase.syncMode]);

  useEffect(() => {
    document.title =
      exportMode === "print"
        ? `${exportBaseName}.pdf`
        : (slidesDocument.meta.title ?? "Slide React MVP");
  }, [slidesDocument.meta.title, exportBaseName, exportMode]);

  useEffect(() => {
    const mode = exportMode === "print" ? "print" : "live";
    document.documentElement.dataset.presentationMode = mode;
    return () => {
      delete document.documentElement.dataset.presentationMode;
    };
  }, [exportMode]);

  const handleSyncModeChange = useCallback((mode: PresentationSyncMode) => {
    setSyncMode(mode);
    updateSyncModeInUrl(mode);
  }, []);

  return {
    exportMode,
    exportWithClicks,
    exportBaseName,
    drawStorageKey,
    presentationSession,
    handleSyncModeChange,
  };
}
