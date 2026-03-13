import { MDXProvider } from "@mdx-js/react";
import compiledSlides from "@generated/slides";
import { useMemo } from "react";
import { SlidesNavigationProvider } from "./providers/SlidesNavigationProvider";
import { AddonProvider, useSlideAddons } from "../addons/AddonProvider";
import { PrintSlidesView } from "../features/presentation/PrintSlidesView";
import { PresenterShell } from "../features/presentation/presenter/PresenterShell";
import { buildSlidesUrl } from "@slidev-react/core/presentation/export/urls";
import { type PresentationSession } from "../features/presentation/session";
import type { PresentationSyncMode } from "../features/presentation/types";
import { ThemeProvider, useSlideTheme } from "../theme/ThemeProvider";
import type { ThemeMDXComponents } from "../theme/types";
import { usePresentationBootstrap } from "./usePresentationBootstrap";

function ThemeBoundApp({
  exportMode,
  exportWithClicks,
  exportBaseName,
  slidesDocument,
  drawStorageKey,
  presentationSession,
  handleSyncModeChange,
}: {
  exportMode: "print" | null;
  exportWithClicks: boolean;
  exportBaseName: string;
  slidesDocument: typeof compiledSlides;
  drawStorageKey: string;
  presentationSession: PresentationSession;
  handleSyncModeChange: (mode: PresentationSyncMode) => void;
}) {
  const theme = useSlideTheme();
  const addons = useSlideAddons();
  const mdxComponents = useMemo<ThemeMDXComponents>(
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
      <PrintSlidesView
        slides={slidesDocument.slides}
        slidesTitle={slidesDocument.meta.title}
        slidesViewport={slidesDocument.meta.viewport}
        slidesLayout={slidesDocument.meta.layout}
        slidesBackground={slidesDocument.meta.background}
        exportBaseName={exportBaseName}
        withClicks={exportWithClicks}
        onBack={() => {
          window.location.assign(buildSlidesUrl(window.location.href));
        }}
      />
    ) : (
      <SlidesNavigationProvider total={slidesDocument.slides.length}>
        <PresenterShell
          slides={slidesDocument.slides}
          slidesTitle={slidesDocument.meta.title}
          slidesViewport={slidesDocument.meta.viewport}
          slidesLayout={slidesDocument.meta.layout}
          slidesBackground={slidesDocument.meta.background}
          slidesTransition={slidesDocument.meta.transition}
          slidesExportFilename={slidesDocument.meta.exportFilename}
          slidesSessionSeed={slidesDocument.sourceHash}
          drawStorageKey={drawStorageKey}
          session={presentationSession}
          onSyncModeChange={handleSyncModeChange}
        />
      </SlidesNavigationProvider>
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
  const slidesDocument = compiledSlides;
  const {
    exportMode,
    exportWithClicks,
    exportBaseName,
    drawStorageKey,
    presentationSession,
    handleSyncModeChange,
  } = usePresentationBootstrap({
    slidesDocument,
  });

  return (
    <ThemeProvider
      slidesViewport={slidesDocument.meta.viewport}
    >
      <AddonProvider addonIds={slidesDocument.meta.addons}>
        <ThemeBoundApp
          exportMode={exportMode}
          exportWithClicks={exportWithClicks}
          exportBaseName={exportBaseName}
          slidesDocument={slidesDocument}
          drawStorageKey={drawStorageKey}
          presentationSession={presentationSession}
          handleSyncModeChange={handleSyncModeChange}
        />
      </AddonProvider>
    </ThemeProvider>
  );
}
