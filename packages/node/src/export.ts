import { setTimeout as delay } from "node:timers/promises";
import { buildPrintExportUrl } from "@slidev-react/core/presentation/export/urls";
import { parseExportArgs } from "./cli/exportArgs.ts";
import { createSuccessResult, type CommandResult, type SlidesCommandOptions } from "./context.ts";
import { startSlidesDevServer, stopSlidesDevServer } from "./dev.ts";
import type { ExportSlidesArtifactsResult } from "./exportBrowser.ts";

const DEV_SERVER_TIMEOUT_MS = 120_000;

export interface ExportSlidesOptions extends SlidesCommandOptions {
  cliArgs?: string[];
}

async function isServerReachable(baseUrl: string) {
  try {
    const response = await fetch(baseUrl, {
      // The dev server's SPA fallback only answers navigation requests, so it 404s
      // on Node's default `Accept: */*`. Probe the way a browser would, or the
      // readiness check never passes and every export times out.
      headers: { Accept: "text/html" },
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

export async function exportSlidesArtifacts(
  options: ExportSlidesOptions = {},
): Promise<ExportSlidesArtifactsResult> {
  const parsedArgs = parseExportArgs(options.cliArgs ?? []);
  const exportOptions = {
    ...parsedArgs,
    slidesFile: options.slidesFile ?? parsedArgs.slidesFile,
  };
  const printUrl = buildPrintExportUrl(exportOptions.baseUrl, {
    withClicks: exportOptions.withClicks,
  });
  const shouldReuseExistingServer = await isServerReachable(exportOptions.baseUrl);
  const devServer = shouldReuseExistingServer
    ? null
    : await startSlidesDevServer({
        appRoot: options.appRoot,
        slidesFile: exportOptions.slidesFile,
        printUrls: false,
        viteArgs: ["--host", exportOptions.host, "--port", String(exportOptions.port)],
      });

  if (devServer) {
    await waitForServer(exportOptions.baseUrl, DEV_SERVER_TIMEOUT_MS);
  }

  try {
    const { exportSlidesInBrowser } = await import("./exportBrowser.ts");
    return await exportSlidesInBrowser({
      printUrl,
      format: exportOptions.format,
      outputDir: exportOptions.outputDir,
      withClicks: exportOptions.withClicks,
      slideSelection: exportOptions.slideSelection,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/Executable doesn't exist|browserType\.launch/i.test(message)) {
      throw new Error(
        `${message}\nInstall Playwright Chromium first, for example with \`npx playwright install chromium\`.`,
      );
    }

    throw error;
  } finally {
    if (devServer) {
      await stopSlidesDevServer(devServer);
    }
  }
}

export async function runSlidesExport(options: ExportSlidesOptions = {}): Promise<CommandResult> {
  const result = await exportSlidesArtifacts(options);
  console.log("[slidev-react] export complete");
  console.log(
    `  slides: ${result.selectedSlides.join(", ")}${result.variantLabel ? ` (${result.variantLabel})` : ""}`,
  );
  for (const file of result.createdFiles) {
    console.log(`  - ${file}`);
  }

  return createSuccessResult();
}
