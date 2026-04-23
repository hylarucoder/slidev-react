import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";
import {
  createSlideSnapshotFileName,
  resolveExportSlidesBaseName,
} from "@slidev-react/core/presentation/export/fileNames";
import {
  clampSlideSelection,
  createRangesFromSlides,
  createSlideSelectionLabel,
  expandSlideSelection,
  type SlideRange,
  toPdfPageRanges,
} from "@slidev-react/core/presentation/export/selection";

export interface ExportSlidesArtifactsResult {
  createdFiles: string[];
  selectedSlides: number[];
  variantLabel: string;
}

interface ExportSnapshotInfo {
  page: number;
  slideNumber: number;
  title: string;
  step: string;
}

interface ExportViewport {
  width: number;
  height: number;
}

export interface ExportBrowserOptions {
  printUrl: string;
  format: "all" | "pdf" | "png";
  outputDir: string;
  withClicks: boolean;
  slideSelection: SlideRange[] | null;
}

async function readExportViewport(page: Page): Promise<ExportViewport> {
  return page.locator('[data-export-view="print"]').evaluate((node) => ({
    width: Number.parseInt(node.getAttribute("data-export-viewport-width") ?? "1920", 10),
    height: Number.parseInt(node.getAttribute("data-export-viewport-height") ?? "1080", 10),
  }));
}

async function readSnapshotInfos(page: Page): Promise<ExportSnapshotInfo[]> {
  return page.locator('[data-export-snapshot="slide"]').evaluateAll((nodes) =>
    nodes.map((node, index) => ({
      page: index + 1,
      slideNumber: Number.parseInt(node.getAttribute("data-export-slide") ?? "0", 10),
      title: node.getAttribute("data-export-slide-title") ?? "",
      step: node.getAttribute("data-export-step") ?? "all",
    })),
  );
}

function resolveSnapshotSelection(
  snapshotInfos: ExportSnapshotInfo[],
  slideSelection: SlideRange[] | null,
  withClicks: boolean,
) {
  const totalSlides = new Set(snapshotInfos.map((info) => info.slideNumber)).size;
  const selectedRanges = clampSlideSelection(slideSelection, totalSlides);
  const selectedSlides = expandSlideSelection(selectedRanges);
  if (selectedSlides.length === 0) {
    throw new Error(`No slides matched --slides for a slides file with ${totalSlides} slides.`);
  }

  const selectedSlideSet = new Set(selectedSlides);
  const selectedSnapshots = snapshotInfos.filter((info) => selectedSlideSet.has(info.slideNumber));
  if (selectedSnapshots.length === 0) {
    throw new Error("No export snapshots matched the requested slides.");
  }

  const selectionLabel =
    selectedRanges.length === 1 &&
    selectedRanges[0].start === 1 &&
    selectedRanges[0].end === totalSlides
      ? null
      : createSlideSelectionLabel(selectedRanges);
  const variantLabel = [selectionLabel, withClicks ? "with-clicks" : null]
    .filter(Boolean)
    .join("-");

  return {
    selectedSlides,
    selectedSnapshots,
    variantLabel,
  };
}

async function exportPdfArtifacts(
  page: Page,
  exportViewport: ExportViewport,
  slidesBaseName: string,
  slidesOutputDir: string,
  variantLabel: string,
  selectedSnapshots: ExportSnapshotInfo[],
) {
  const pdfPath = path.join(
    slidesOutputDir,
    variantLabel ? `${slidesBaseName}-${variantLabel}.pdf` : `${slidesBaseName}.pdf`,
  );
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: pdfPath,
    landscape: exportViewport.width > exportViewport.height,
    printBackground: true,
    preferCSSPageSize: true,
    pageRanges: toPdfPageRanges(createRangesFromSlides(selectedSnapshots.map((info) => info.page))),
  });
  await page.emulateMedia({ media: "screen" });

  return pdfPath;
}

async function applyPngExportStyles(page: Page, exportViewport: ExportViewport) {
  await page.addStyleTag({
    content: `
      .print-slides-view main {
        max-width: none !important;
      }
      .print-slide-shell {
        width: ${exportViewport.width}px !important;
        margin-left: auto !important;
        margin-right: auto !important;
      }
      .print-slide-frame {
        padding: 0 !important;
        border: none !important;
        background: transparent !important;
        box-shadow: none !important;
      }
      .print-slide-frame [data-export-surface="slide"] {
        width: ${exportViewport.width}px !important;
        height: ${exportViewport.height}px !important;
        max-width: none !important;
        min-height: ${exportViewport.height}px !important;
        aspect-ratio: auto !important;
        box-shadow: none !important;
      }
    `,
  });
}

async function exportPngArtifacts(
  page: Page,
  exportViewport: ExportViewport,
  pngOutputDir: string,
  withClicks: boolean,
  selectedSnapshots: ExportSnapshotInfo[],
) {
  await mkdir(pngOutputDir, { recursive: true });
  await applyPngExportStyles(page, exportViewport);

  const createdFiles: string[] = [];

  for (const snapshot of selectedSnapshots) {
    const shell = page
      .locator(
        `[data-export-snapshot="slide"][data-export-slide="${snapshot.slideNumber}"][data-export-step="${snapshot.step}"]`,
      )
      .first();
    const fileName = createSlideSnapshotFileName({
      index: snapshot.slideNumber,
      title: snapshot.title,
      clickStep: withClicks && snapshot.step !== "all" ? Number.parseInt(snapshot.step, 10) : null,
    });
    const targetPath = path.join(pngOutputDir, fileName);

    await shell.locator('[data-export-surface="slide"]').screenshot({
      path: targetPath,
    });

    createdFiles.push(targetPath);
  }

  return createdFiles;
}

export async function exportSlidesInBrowser(
  options: ExportBrowserOptions,
): Promise<ExportSlidesArtifactsResult> {
  const browser = await chromium.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage({
      viewport: { width: 2400, height: 1600 },
      deviceScaleFactor: 1,
    });

    await page.goto(options.printUrl, {
      waitUntil: "networkidle",
    });
    await page.waitForSelector('[data-export-view="print"]');
    await page.waitForFunction(
      () => Array.from(document.querySelectorAll('[data-export-slide-ready="false"]')).length === 0,
    );

    const exportViewport = await readExportViewport(page);
    const slidesBaseName = resolveExportSlidesBaseName(await page.title());
    const snapshotInfos = await readSnapshotInfos(page);
    const { selectedSlides, selectedSnapshots, variantLabel } = resolveSnapshotSelection(
      snapshotInfos,
      options.slideSelection,
      options.withClicks,
    );
    const slidesOutputDir = path.resolve(options.outputDir, slidesBaseName);
    const pngOutputDir = variantLabel
      ? path.join(slidesOutputDir, "png", variantLabel)
      : path.join(slidesOutputDir, "png");
    await mkdir(slidesOutputDir, { recursive: true });

    const createdFiles: string[] = [];

    if (options.format === "all" || options.format === "pdf") {
      createdFiles.push(
        await exportPdfArtifacts(
          page,
          exportViewport,
          slidesBaseName,
          slidesOutputDir,
          variantLabel,
          selectedSnapshots,
        ),
      );
    }

    if (options.format === "all" || options.format === "png") {
      createdFiles.push(
        ...(await exportPngArtifacts(
          page,
          exportViewport,
          pngOutputDir,
          options.withClicks,
          selectedSnapshots,
        )),
      );
    }

    return {
      createdFiles,
      selectedSlides,
      variantLabel,
    };
  } finally {
    await browser.close();
  }
}
