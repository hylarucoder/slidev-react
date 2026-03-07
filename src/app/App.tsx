import { MDXProvider } from "@mdx-js/react";
import compiledDeck from "@generated/deck";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DeckProvider } from "./providers/DeckProvider";
import { AddonProvider, useSlideAddons } from "../addons/AddonProvider";
import { PrintDeckView } from "../features/presentation/PrintDeckView";
import { PresenterShell } from "../features/presenter/PresenterShell";
import {
  buildDeckUrl,
  resolvePresentationExportMode,
  resolvePrintExportWithClicks,
} from "../features/presentation/printExport";
import { resolvePresentationFileNameBase } from "../features/presentation/recordingFilename";
import {
  resolvePresentationSession,
  type PresentationSession,
  updateSyncModeInUrl,
} from "../features/presentation/session";
import type { PresentationSyncMode } from "../features/presentation/types";
import { ThemeProvider, useSlideTheme } from "../theme/ThemeProvider";

function ThemeBoundApp({
  exportMode,
  exportWithClicks,
  exportBaseName,
  deck,
  drawStorageKey,
  presentationSession,
  handleSyncModeChange,
}: {
  exportMode: "print" | null;
  exportWithClicks: boolean;
  exportBaseName: string;
  deck: typeof compiledDeck;
  drawStorageKey: string;
  presentationSession: PresentationSession;
  handleSyncModeChange: (mode: PresentationSyncMode) => void;
}) {
  const theme = useSlideTheme();
  const addons = useSlideAddons();
  const mdxComponents = useMemo(
    () => ({
      ...theme.mdxComponents,
      ...addons.mdxComponents,
    }),
    [addons.mdxComponents, theme.mdxComponents],
  );
  const runtimeProviders = useMemo(
    () =>
      [theme.provider, ...addons.providers].filter(
        (provider): provider is NonNullable<typeof provider> => Boolean(provider),
      ),
    [addons.providers, theme.provider],
  );

  const content =
    exportMode === "print" ? (
      <PrintDeckView
        slides={deck.slides}
        deckTitle={deck.meta.title}
        deckLayout={deck.meta.layout}
        deckBackground={deck.meta.background}
        exportBaseName={exportBaseName}
        withClicks={exportWithClicks}
        onBack={() => {
          window.location.assign(buildDeckUrl(window.location.href));
        }}
      />
    ) : (
      <DeckProvider total={deck.slides.length}>
        <PresenterShell
          slides={deck.slides}
          deckTitle={deck.meta.title}
          deckLayout={deck.meta.layout}
          deckBackground={deck.meta.background}
          deckTransition={deck.meta.transition}
          deckExportFilename={deck.meta.exportFilename}
          deckSessionSeed={deck.sourceHash}
          drawStorageKey={drawStorageKey}
          session={presentationSession}
          onSyncModeChange={handleSyncModeChange}
        />
      </DeckProvider>
    );

  return (
    <MDXProvider components={mdxComponents}>
      {runtimeProviders.reduceRight(
        (children, Provider) => (
          <Provider>{children}</Provider>
        ),
        content,
      )}
    </MDXProvider>
  );
}

export default function App() {
  const deck = compiledDeck;
  const exportMode = useMemo(
    () =>
      typeof window === "undefined" ? null : resolvePresentationExportMode(window.location.search),
    [],
  );
  const exportWithClicks = useMemo(
    () =>
      typeof window === "undefined" ? false : resolvePrintExportWithClicks(window.location.search),
    [],
  );
  const deckHash = useMemo(() => deck.sourceHash, [deck.sourceHash]);
  const drawStorageKey = useMemo(() => `slide-react:draw:${deckHash}`, [deckHash]);
  const exportBaseName = useMemo(
    () =>
      resolvePresentationFileNameBase({
        exportFilename: deck.meta.exportFilename,
        deckTitle: deck.meta.title,
      }),
    [deck.meta.exportFilename, deck.meta.title],
  );
  const sessionBase = useMemo<PresentationSession>(() => {
    if (exportMode === "print") {
      return {
        enabled: false,
        role: "standalone",
        syncMode: "off",
        sessionId: null,
        senderId: "print-export",
        wsUrl: null,
        presenterUrl: null,
        viewerUrl: null,
      };
    }

    return resolvePresentationSession(deckHash);
  }, [deckHash, exportMode]);
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
      exportMode === "print" ? `${exportBaseName}.pdf` : (deck.meta.title ?? "Slide React MVP");
  }, [deck.meta.title, exportBaseName, exportMode]);

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

  return (
    <ThemeProvider themeId={deck.meta.theme}>
      <AddonProvider addonIds={deck.meta.addons}>
        <ThemeBoundApp
          exportMode={exportMode}
          exportWithClicks={exportWithClicks}
          exportBaseName={exportBaseName}
          deck={deck}
          drawStorageKey={drawStorageKey}
          presentationSession={presentationSession}
          handleSyncModeChange={handleSyncModeChange}
        />
      </AddonProvider>
    </ThemeProvider>
  );
}
