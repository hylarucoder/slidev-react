import { readFileSync } from "node:fs";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";
import { chromium, type Page } from "@playwright/test";

interface PackageJson {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

interface BrowserProbe {
  consoleErrors: string[];
  pageErrors: string[];
  requestFailures: string[];
}

function readJson<T>(filePath: string) {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function spawnCommand(
  cmd: string,
  args: string[],
  options: {
    cwd: string;
    env?: Record<string, string | undefined>;
    onStdout?: (output: string) => void;
    onStderr?: (output: string) => void;
  },
) {
  const child = spawn(cmd, args, {
    cwd: options.cwd,
    env: {
      ...process.env,
      ...options.env,
    },
    stdio: "pipe",
  });

  let stdout = "";
  let stderr = "";

  const completed = new Promise<{
    code: number | null;
    stdout: string;
    stderr: string;
  }>((resolve, reject) => {
    child.stdout.on("data", (chunk) => {
      const output = String(chunk);
      stdout += output;
      options.onStdout?.(output);
    });

    child.stderr.on("data", (chunk) => {
      const output = String(chunk);
      stderr += output;
      options.onStderr?.(output);
    });

    child.on("error", reject);
    child.on("close", (code) => {
      resolve({
        code,
        stdout,
        stderr,
      });
    });
  });

  return {
    child,
    completed,
  };
}

async function startPresentationRelay(options: {
  cwd: string;
  port: number;
}) {
  let relayOutput = "";
  const relayProcess = spawnCommand(
    "node",
    ["--import", "tsx", "./scripts/presentation-server.ts"],
    {
      cwd: options.cwd,
      env: {
        PRESENTATION_WS_HOST: "127.0.0.1",
        PRESENTATION_WS_PORT: String(options.port),
      },
      onStdout: (output) => {
        relayOutput += output;
      },
      onStderr: (output) => {
        relayOutput += output;
      },
    },
  );

  await waitForOutput(
    () => /\bpresentation relay listening\b/i.test(relayOutput),
    10_000,
  );

  return {
    relayProcess,
    relayOutput: () => relayOutput,
  };
}

function findFreePort() {
  return new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Failed to resolve a free port for the npm install smoke test."));
        return;
      }

      const { port } = address;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(port);
      });
    });
    server.on("error", reject);
  });
}

async function waitForOutput(check: () => boolean, timeoutMs: number) {
  const startedAt = Date.now();
  while (!check()) {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error("Timed out waiting for the npm-installed smoke server to boot.");
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

async function waitForCompletion<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  return await Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);
}

async function waitForPageReady(page: Page, url: string, expectedTitle: string, timeoutMs: number) {
  const startedAt = Date.now();

  while (true) {
    try {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 5_000,
      });

      if ((await page.title()) !== expectedTitle) {
        throw new Error(`Expected page title ${JSON.stringify(expectedTitle)}, got ${JSON.stringify(await page.title())}.`);
      }

      const html = await page.content();
      if (/Cannot GET \//i.test(html)) {
        throw new Error("Dev server responded with a fallback error page instead of the deck HTML.");
      }

      return;
    } catch (error) {
      if (Date.now() - startedAt > timeoutMs) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
}

async function waitForPresentationMount(page: Page, timeoutMs: number) {
  await page.waitForFunction(
    () => {
      const root = document.querySelector("#root");
      return !!root && root.childElementCount > 0;
    },
    {
      timeout: timeoutMs,
    },
  );
}

async function waitForAddonRender(page: Page, timeoutMs: number) {
  await page.waitForFunction(
    () => {
      const chartSvg = document.querySelector("#g2-smoke svg");
      const mermaidSvg = document.querySelector("#mermaid-smoke svg");
      return !!chartSvg && !!mermaidSvg;
    },
    {
      timeout: timeoutMs,
    },
  );
}

function createBrowserProbe(page: Page): BrowserProbe {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const requestFailures: string[] = [];

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (/Outdated Optimize Dep/i.test(text)) return;
    consoleErrors.push(`[console.error] ${text}`);
  });

  page.on("pageerror", (error) => {
    pageErrors.push(`[pageerror] ${error.message}`);
  });

  page.on("requestfailed", (request) => {
    const resourceType = request.resourceType();
    if (!["document", "script", "stylesheet", "fetch", "xhr"].includes(resourceType)) return;

    const failure = request.failure()?.errorText ?? "unknown request failure";
    if (resourceType === "script" && failure === "net::ERR_ABORTED") return;
    if (/Outdated Optimize Dep/i.test(failure)) return;
    requestFailures.push(`[requestfailed] ${resourceType} ${request.url()} -> ${failure}`);
  });

  return {
    consoleErrors,
    pageErrors,
    requestFailures,
  };
}

function assertNoKnownPackagingErrors(output: string) {
  const patterns = [
    /Unsupported URL Type "catalog:"/i,
    /Cannot find native binding/i,
    /Cannot find module 'vite-plus\/binding'/i,
    /ERR_MODULE_NOT_FOUND/i,
  ];

  for (const pattern of patterns) {
    if (pattern.test(output)) {
      throw new Error(`npm install smoke test saw a packaging failure:\n${output}`);
    }
  }
}

function formatBrowserFailures(options: {
  consoleErrors: string[];
  pageErrors: string[];
  requestFailures: string[];
}) {
  const lines: string[] = [];

  for (const entry of options.pageErrors) {
    lines.push(entry);
  }

  for (const entry of options.consoleErrors) {
    lines.push(entry);
  }

  const requestPreview = options.requestFailures.slice(0, 20);
  for (const entry of requestPreview) {
    lines.push(entry);
  }

  const remainingRequestFailures = options.requestFailures.length - requestPreview.length;
  if (remainingRequestFailures > 0) {
    lines.push(`[requestfailed] ... ${remainingRequestFailures} more aborted request(s)`);
  }

  return lines.map((entry, index) => `${index + 1}. ${entry}`).join("\n");
}

async function packPackage(packageDir: string, packDir: string) {
  const packProcess = spawnCommand("npm", ["pack", "--pack-destination", packDir], {
    cwd: packageDir,
  });
  const packResult = await packProcess.completed;

  if (packResult.code !== 0) {
    throw new Error(`Failed to pack ${packageDir}:\n${packResult.stderr || packResult.stdout}`);
  }

  const tarballName = packResult.stdout.trim().split(/\r?\n/).at(-1);
  if (!tarballName?.endsWith(".tgz")) {
    throw new Error(`Failed to parse tarball name for ${packageDir}:\n${packResult.stdout}`);
  }

  return path.join(packDir, tarballName);
}

async function assertDevServerInBrowser(options: {
  devUrl: string;
  expectedTitle: string;
  devProcess: ReturnType<typeof spawnCommand>;
  devOutput: () => string;
}) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const browserProbe = createBrowserProbe(page);
  let devExited = false;

  void options.devProcess.completed.then(() => {
    devExited = true;
  });

  try {
    await new Promise((resolve) => setTimeout(resolve, 1_500));
    await waitForPageReady(page, options.devUrl, options.expectedTitle, 30_000);
    await waitForPresentationMount(page, 10_000);
    await waitForAddonRender(page, 10_000);
    await page.waitForTimeout(1_500);

    if (
      browserProbe.consoleErrors.length > 0
      || browserProbe.pageErrors.length > 0
      || browserProbe.requestFailures.length > 0
    ) {
      throw new Error(
        `Dev server opened in Chromium, but browser errors were detected:\n${formatBrowserFailures({
          consoleErrors: browserProbe.consoleErrors,
          pageErrors: browserProbe.pageErrors,
          requestFailures: browserProbe.requestFailures,
        })}`,
      );
    }
  } finally {
    await page.close();
    await browser.close();
    if (!devExited) {
      options.devProcess.child.kill("SIGINT");
    }
  }

  const devResult = await waitForCompletion(
    options.devProcess.completed,
    10_000,
    `Timed out waiting for smoke dev server to shut down:\n${options.devOutput()}`,
  );
  assertNoKnownPackagingErrors(devResult.stdout + devResult.stderr);
}

async function runCreateAppSmoke(options: {
  appRoot: string;
  createAppTarball: string;
  coreTarball: string;
  clientTarball: string;
  nodeTarball: string;
  cliTarball: string;
  reactVersion: string;
  reactDomVersion: string;
  mdxReactVersion: string;
  relayPort: number;
}) {
  const createProcess = spawnCommand(
    "npm",
    [
      "exec",
      "--yes",
      `--package=${options.createAppTarball}`,
      "--",
      "create-slidev-react",
      options.appRoot,
      "--yes",
    ],
    {
      cwd: path.dirname(options.appRoot),
      env: {
        PRESENTATION_WS_PORT: String(options.relayPort),
      },
    },
  );
  const createResult = await createProcess.completed;

  if (createResult.code !== 0) {
    throw new Error(`create-slidev-react smoke failed:\n${createResult.stderr || createResult.stdout}`);
  }

  const generatedPackageJson = readJson<PackageJson>(path.join(options.appRoot, "package.json"));
  if (generatedPackageJson.name !== path.basename(options.appRoot)) {
    throw new Error("create-slidev-react generated package.json, but the package name does not match the target directory.");
  }
  if (generatedPackageJson.scripts?.dev !== "slidev-react dev slides.mdx") {
    throw new Error("create-slidev-react generated package.json, but the dev script does not match the starter contract.");
  }

  const generatedSlides = await readFile(path.join(options.appRoot, "slides.mdx"), "utf8");
  if (!generatedSlides.includes("addons:") || !generatedSlides.includes("g2") || !generatedSlides.includes("mermaid")) {
    throw new Error("create-slidev-react generated slides.mdx, but the default g2 + mermaid starter content is missing.");
  }

  const installProcess = spawnCommand(
    "npm",
    [
      "install",
      `react@${options.reactVersion}`,
      `react-dom@${options.reactDomVersion}`,
      `@mdx-js/react@${options.mdxReactVersion}`,
      options.coreTarball,
      options.clientTarball,
      options.nodeTarball,
      options.cliTarball,
    ],
    {
      cwd: options.appRoot,
      env: {
        PRESENTATION_WS_PORT: String(options.relayPort),
      },
    },
  );
  const installResult = await installProcess.completed;

  if (installResult.code !== 0) {
    throw new Error(`create-app npm install smoke failed:\n${installResult.stderr || installResult.stdout}`);
  }

  assertNoKnownPackagingErrors(createResult.stdout + createResult.stderr + installResult.stdout + installResult.stderr);

  const buildProcess = spawnCommand("npm", ["run", "build"], {
    cwd: options.appRoot,
    env: {
      PRESENTATION_WS_PORT: String(options.relayPort),
    },
  });
  const buildResult = await buildProcess.completed;

  if (buildResult.code !== 0) {
    throw new Error(`create-app build smoke failed:\n${buildResult.stderr || buildResult.stdout}`);
  }

  const builtHtml = await readFile(path.join(options.appRoot, "dist/index.html"), "utf8");
  if (!builtHtml.includes("My Slidev React Deck")) {
    throw new Error("create-app build produced output, but dist/index.html is missing the starter deck title.");
  }

  const port = await findFreePort();
  const devUrl = `http://localhost:${port}/`;
  let devOutput = "";
  const devProcess = spawnCommand("npm", ["run", "dev", "--", "--port", String(port)], {
    cwd: options.appRoot,
    env: {
      PRESENTATION_WS_PORT: String(options.relayPort),
    },
    onStdout: (output) => {
      devOutput += output;
    },
    onStderr: (output) => {
      devOutput += output;
    },
  });

  await waitForOutput(() => /Local:\s+http:\/\/localhost:/i.test(devOutput), 30_000);
  assertNoKnownPackagingErrors(devOutput);

  await assertDevServerInBrowser({
    devUrl,
    expectedTitle: "My Slidev React Deck",
    devProcess,
    devOutput: () => devOutput,
  });
}

async function main() {
  const repoRoot = path.resolve(import.meta.dirname, "..");
  const packDir = await mkdtemp(path.join(tmpdir(), "slidev-react-pack-"));
  const createAppRoot = path.join(await mkdtemp(path.join(tmpdir(), "slidev-react-create-app-")), "starter-deck");
  const relayPort = await findFreePort();
  const rootPackageJson = readJson<PackageJson>(path.join(repoRoot, "package.json"));
  const reactVersion = rootPackageJson.dependencies?.react;
  const reactDomVersion = rootPackageJson.dependencies?.["react-dom"];
  const mdxReactVersion = rootPackageJson.devDependencies?.["@mdx-js/react"];

  if (!reactVersion || !reactDomVersion || !mdxReactVersion) {
    throw new Error("Missing runtime peer versions needed for npm install smoke test.");
  }

  const [createAppTarball, coreTarball, clientTarball, nodeTarball, cliTarball] = await Promise.all([
    packPackage(path.join(repoRoot, "packages/create-app"), packDir),
    packPackage(path.join(repoRoot, "packages/core"), packDir),
    packPackage(path.join(repoRoot, "packages/client"), packDir),
    packPackage(path.join(repoRoot, "packages/node"), packDir),
    packPackage(path.join(repoRoot, "packages/cli"), packDir),
  ]);

  const relay = await startPresentationRelay({
    cwd: repoRoot,
    port: relayPort,
  });
  let relayShutdownError: Error | null = null;

  try {
    await runCreateAppSmoke({
      appRoot: createAppRoot,
      createAppTarball,
      coreTarball,
      clientTarball,
      nodeTarball,
      cliTarball,
      reactVersion,
      reactDomVersion,
      mdxReactVersion,
      relayPort,
    });
  } finally {
    relay.relayProcess.child.kill("SIGINT");
    const relayResult = await waitForCompletion(
      relay.relayProcess.completed,
      10_000,
      `Timed out waiting for the presentation relay smoke server to shut down:\n${relay.relayOutput()}`,
    );

    if (relayResult.code !== 0 && relayResult.code !== null) {
      relayShutdownError = new Error(`Presentation relay smoke server exited unexpectedly:\n${relayResult.stderr || relayResult.stdout}`);
    }
  }

  if (relayShutdownError) {
    throw relayShutdownError;
  }
}

await main();
