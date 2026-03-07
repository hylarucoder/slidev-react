import { spawn, type ChildProcess } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "@playwright/test";
import {
  createSlideSnapshotFileName,
  resolveExportDeckBaseName,
} from "../src/features/presentation/exportArtifacts";
import {
  clampSlideSelection,
  createRangesFromSlides,
  createSlideSelectionLabel,
  expandSlideSelection,
  parseSlideSelection,
  toPdfPageRanges,
} from "../src/features/presentation/exportSelection";
import { buildPrintExportUrl } from "../src/features/presentation/printExport";

type ExportFormat = "all" | "pdf" | "png";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 4173;
const DEFAULT_OUTPUT_DIR = "output/export";
const DEV_SERVER_TIMEOUT_MS = 120_000;

function parseArgs(argv: string[]) {
  const values = new Map<string, string>();

  for (let index = 0; index < argv.length; index += 1) {
    const entry = argv[index];
    if (!entry.startsWith("--")) continue;

    const [rawKey, inlineValue] = entry.slice(2).split("=", 2);
    const nextValue =
      inlineValue ?? (argv[index + 1] && !argv[index + 1].startsWith("--") ? argv[++index] : "");
    values.set(rawKey, nextValue);
  }

  const formatValue = values.get("format") ?? "all";
  const format: ExportFormat =
    formatValue === "pdf" || formatValue === "png" || formatValue === "all" ? formatValue : "all";

  const portValue = Number.parseInt(values.get("port") ?? "", 10);
  const port = Number.isFinite(portValue) && portValue > 0 ? portValue : DEFAULT_PORT;
  const host = values.get("host") || DEFAULT_HOST;
  const baseUrl = values.get("base-url") || `http://${host}:${port}`;
  const withClicks = values.has("with-clicks") && values.get("with-clicks") !== "false";

  return {
    format,
    host,
    port,
    baseUrl,
    withClicks,
    outputDir: values.get("output") || DEFAULT_OUTPUT_DIR,
    slideSelection: parseSlideSelection(values.get("slides")),
  };
}

async function isServerReachable(baseUrl: string) {
  try {
    const response = await fetch(baseUrl, {
      signal: AbortSignal.timeout(2_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer(baseUrl: string, timeoutMs: number) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await isServerReachable(baseUrl)) return;

    await delay(500);
  }

  throw new Error(`Timed out waiting for ${baseUrl}`);
}

function startDevServer({ host, port }: { host: string; port: number }) {
  const child = spawn("bun", ["run", "dev", "--host", host, "--port", String(port)], {
    cwd: process.cwd(),
    stdio: "pipe",
  });

  child.stdout?.on("data", (chunk) => {
    process.stdout.write(`[export:dev] ${chunk}`);
  });
  child.stderr?.on("data", (chunk) => {
    process.stderr.write(`[export:dev] ${chunk}`);
  });

  return child;
}

async function stopChildProcess(child: ChildProcess | null) {
  if (!child || child.exitCode !== null) return;

  child.kill("SIGTERM");

  await Promise.race([
    new Promise<void>((resolve) => {
      child.once("exit", () => resolve());
    }),
    delay(5_000).then(() => {
      if (child.exitCode === null) child.kill("SIGKILL");
    }),
  ]);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const printUrl = buildPrintExportUrl(options.baseUrl, {
    withClicks: options.withClicks,
  });
  const shouldReuseExistingServer = await isServerReachable(options.baseUrl);
  const devServer = shouldReuseExistingServer
    ? null
    : startDevServer({
        host: options.host,
        port: options.port,
      });

  if (devServer) await waitForServer(options.baseUrl, DEV_SERVER_TIMEOUT_MS);

  try {
    const browser = await chromium.launch({
      headless: true,
    });

    try {
      const page = await browser.newPage({
        viewport: { width: 2400, height: 1600 },
        deviceScaleFactor: 1,
      });

      await page.goto(printUrl, {
        waitUntil: "networkidle",
      });
      await page.waitForSelector('[data-export-view="print"]');
      await page.waitForFunction(
        () =>
          Array.from(document.querySelectorAll('[data-export-slide-ready="false"]')).length === 0,
      );

      const deckBaseName = resolveExportDeckBaseName(await page.title());
      const snapshotInfos = await page
        .locator('[data-export-snapshot="slide"]')
        .evaluateAll((nodes) =>
          nodes.map((node, index) => ({
            page: index + 1,
            slideNumber: Number.parseInt(node.getAttribute("data-export-slide") ?? "0", 10),
            title: node.getAttribute("data-export-slide-title") ?? "",
            click: node.getAttribute("data-export-click") ?? "all",
          })),
        );
      const totalSlides = new Set(snapshotInfos.map((info) => info.slideNumber)).size;
      const selectedRanges = clampSlideSelection(options.slideSelection, totalSlides);
      const selectedSlides = expandSlideSelection(selectedRanges);
      if (selectedSlides.length === 0) {
        throw new Error(`No slides matched --slides for a deck with ${totalSlides} slides.`);
      }

      const selectedSlideSet = new Set(selectedSlides);
      const selectedSnapshots = snapshotInfos.filter((info) =>
        selectedSlideSet.has(info.slideNumber),
      );
      if (selectedSnapshots.length === 0) {
        throw new Error("No export snapshots matched the requested slides.");
      }

      const selectionLabel =
        selectedRanges.length === 1 &&
        selectedRanges[0].start === 1 &&
        selectedRanges[0].end === totalSlides
          ? null
          : createSlideSelectionLabel(selectedRanges);
      const variantLabel = [selectionLabel, options.withClicks ? "with-clicks" : null]
        .filter(Boolean)
        .join("-");
      const deckOutputDir = path.resolve(options.outputDir, deckBaseName);
      const pngOutputDir = variantLabel
        ? path.join(deckOutputDir, "png", variantLabel)
        : path.join(deckOutputDir, "png");
      await mkdir(deckOutputDir, { recursive: true });

      const createdFiles: string[] = [];

      if (options.format === "all" || options.format === "pdf") {
        const pdfPath = path.join(
          deckOutputDir,
          variantLabel ? `${deckBaseName}-${variantLabel}.pdf` : `${deckBaseName}.pdf`,
        );
        await page.emulateMedia({ media: "print" });
        await page.pdf({
          path: pdfPath,
          landscape: true,
          printBackground: true,
          preferCSSPageSize: true,
          pageRanges: toPdfPageRanges(
            createRangesFromSlides(selectedSnapshots.map((info) => info.page)),
          ),
        });
        await page.emulateMedia({ media: "screen" });
        createdFiles.push(pdfPath);
      }

      if (options.format === "all" || options.format === "png") {
        await mkdir(pngOutputDir, { recursive: true });
        await page.addStyleTag({
          content: `
            .print-deck-view main {
              max-width: none !important;
            }
            .print-slide-shell {
              width: 1920px !important;
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
              width: 1920px !important;
              height: 1080px !important;
              max-width: none !important;
              min-height: 1080px !important;
              aspect-ratio: auto !important;
              box-shadow: none !important;
            }
          `,
        });

        for (const snapshot of selectedSnapshots) {
          const shell = page
            .locator(
              `[data-export-snapshot="slide"][data-export-slide="${snapshot.slideNumber}"][data-export-click="${snapshot.click}"]`,
            )
            .first();
          const fileName = createSlideSnapshotFileName({
            index: snapshot.slideNumber,
            title: snapshot.title,
            clickStep:
              options.withClicks && snapshot.click !== "all"
                ? Number.parseInt(snapshot.click, 10)
                : null,
          });
          const targetPath = path.join(pngOutputDir, fileName);

          await shell.locator('[data-export-surface="slide"]').screenshot({
            path: targetPath,
          });

          createdFiles.push(targetPath);
        }
      }

      console.log("[slide-react] export complete");
      console.log(
        `  slides: ${selectedSlides.join(", ")}${variantLabel ? ` (${variantLabel})` : ""}`,
      );
      for (const file of createdFiles) {
        console.log(`  - ${file}`);
      }
    } finally {
      await browser.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/Executable doesn't exist|browserType\.launch/i.test(message)) {
      throw new Error(
        `${message}\nRun \`bun run test:e2e:install\` first so Playwright can install Chromium.`,
      );
    }

    throw error;
  } finally {
    await stopChildProcess(devServer);
  }
}

await main();
