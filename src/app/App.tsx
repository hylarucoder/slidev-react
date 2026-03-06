import { MDXProvider } from "@mdx-js/react";
import compiledDeck from "@generated/deck";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DeckProvider } from "./providers/DeckProvider";
import { PresenterShell } from "../features/presenter/PresenterShell";
import {
  resolvePresentationSession,
  type PresentationSession,
  updateSyncModeInUrl,
} from "../features/presentation/session";
import type { PresentationSyncMode } from "../features/presentation/types";
import { mdxComponents } from "../ui/mdx";

export default function App() {
  const deck = compiledDeck;
  const deckHash = useMemo(() => deck.sourceHash, [deck.sourceHash]);
  const drawStorageKey = useMemo(() => `slide-react:draw:${deckHash}`, [deckHash]);
  const sessionBase = useMemo(() => resolvePresentationSession(deckHash), [deckHash]);
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
    document.title = deck.meta.title ?? "Slide React MVP";
  }, [deck]);

  const handleSyncModeChange = useCallback((mode: PresentationSyncMode) => {
    setSyncMode(mode);
    updateSyncModeInUrl(mode);
  }, []);

  return (
    <MDXProvider components={mdxComponents}>
      <DeckProvider total={deck.slides.length}>
        <PresenterShell
          slides={deck.slides}
          deckLayout={deck.meta.layout}
          deckSessionSeed={deckHash}
          drawStorageKey={drawStorageKey}
          session={presentationSession}
          onSyncModeChange={handleSyncModeChange}
        />
      </DeckProvider>
    </MDXProvider>
  );
}
