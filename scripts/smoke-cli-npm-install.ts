import { readFileSync } from "node:fs";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";
import { chromium, type Page } from "@playwright/test";

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
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
    onStdout?: (output: string) => void;
    onStderr?: (output: string) => void;
  },
) {
  const child = spawn(cmd, args, {
    cwd: options.cwd,
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

async function writeSmokeSlides(appRoot: string, options: { title: string; intro: string }) {
  await writeFile(
    path.join(appRoot, "slides.mdx"),
    [
      "---",
      `title: ${options.title}`,
      "addons: [g2, mermaid]",
      "---",
      "",
      "# Hello",
      "",
      options.intro,
      "",
      '<div id="g2-smoke">',
      "",
      "<BarChart",
      '  width={480}',
      '  height={240}',
      "  data={[",
      '    { genre: "Sports", sold: 275 },',
      '    { genre: "Strategy", sold: 115 },',
      '    { genre: "Action", sold: 120 },',
      "  ]}",
      '  x="genre"',
      '  y="sold"',
      '  color="genre"',
      "/>",
      "",
      "</div>",
      "",
      '<div id="mermaid-smoke">',
      "",
      '<MermaidDiagram code={`graph TD\\nA[Deck] --> B[Mermaid]\\nA --> C[G2]`} />',
      "",
      "</div>",
      "",
    ].join("\n"),
    "utf8",
  );
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

async function runInstalledCliSmoke(options: {
  appRoot: string;
  coreTarball: string;
  clientTarball: string;
  nodeTarball: string;
  cliTarball: string;
  reactVersion: string;
  reactDomVersion: string;
  mdxReactVersion: string;
}) {
  await writeSmokeSlides(options.appRoot, {
    title: "npm Install Smoke",
    intro: "This deck boots from npm-installed tarballs.",
  });

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
    },
  );
  const installResult = await installProcess.completed;

  if (installResult.code !== 0) {
    throw new Error(`npm install smoke failed:\n${installResult.stderr || installResult.stdout}`);
  }

  assertNoKnownPackagingErrors(installResult.stdout + installResult.stderr);

  const cliFile = path.join(options.appRoot, "node_modules", "@slidev-react", "cli", "dist", "bin", "slidev-react.mjs");

  const helpProcess = spawnCommand("node", [cliFile, "--help"], {
    cwd: options.appRoot,
  });
  const helpResult = await helpProcess.completed;

  if (helpResult.code !== 0) {
    throw new Error(`npm-installed CLI help failed:\n${helpResult.stderr || helpResult.stdout}`);
  }

  assertNoKnownPackagingErrors(helpResult.stdout + helpResult.stderr);

  const buildProcess = spawnCommand("node", [cliFile, "build", "slides.mdx", "--outDir", "dist"], {
    cwd: options.appRoot,
  });
  const buildResult = await buildProcess.completed;

  if (buildResult.code !== 0) {
    throw new Error(`npm-installed CLI build failed:\n${buildResult.stderr || buildResult.stdout}`);
  }

  assertNoKnownPackagingErrors(buildResult.stdout + buildResult.stderr);

  const builtHtml = await readFile(path.join(options.appRoot, "dist/index.html"), "utf8");
  if (!builtHtml.includes("npm Install Smoke")) {
    throw new Error("npm-installed build produced output, but dist/index.html is missing the deck title.");
  }

  const port = await findFreePort();
  const devUrl = `http://localhost:${port}/`;
  let devOutput = "";
  const devProcess = spawnCommand("node", [cliFile, "dev", "slides.mdx", "--port", String(port)], {
    cwd: options.appRoot,
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
    expectedTitle: "npm Install Smoke",
    devProcess,
    devOutput: () => devOutput,
  });
}

async function runExecCliSmoke(options: {
  appRoot: string;
  coreTarball: string;
  clientTarball: string;
  nodeTarball: string;
  cliTarball: string;
}) {
  await writeSmokeSlides(options.appRoot, {
    title: "npm Exec Smoke",
    intro: "This deck boots from npm exec with only the CLI tarball.",
  });

  const helpProcess = spawnCommand(
    "npm",
    [
      "exec",
      "--yes",
      `--package=${options.coreTarball}`,
      `--package=${options.clientTarball}`,
      `--package=${options.nodeTarball}`,
      `--package=${options.cliTarball}`,
      "--",
      "slidev-react",
      "--help",
    ],
    {
      cwd: options.appRoot,
    },
  );
  const helpResult = await helpProcess.completed;

  if (helpResult.code !== 0) {
    throw new Error(`npm exec CLI help failed:\n${helpResult.stderr || helpResult.stdout}`);
  }

  assertNoKnownPackagingErrors(helpResult.stdout + helpResult.stderr);

  const buildProcess = spawnCommand(
    "npm",
    [
      "exec",
      "--yes",
      `--package=${options.coreTarball}`,
      `--package=${options.clientTarball}`,
      `--package=${options.nodeTarball}`,
      `--package=${options.cliTarball}`,
      "--",
      "slidev-react",
      "build",
      "slides.mdx",
      "--outDir",
      "dist",
    ],
    {
      cwd: options.appRoot,
    },
  );
  const buildResult = await buildProcess.completed;

  if (buildResult.code !== 0) {
    throw new Error(`npm exec CLI build failed:\n${buildResult.stderr || buildResult.stdout}`);
  }

  assertNoKnownPackagingErrors(buildResult.stdout + buildResult.stderr);

  const builtHtml = await readFile(path.join(options.appRoot, "dist/index.html"), "utf8");
  if (!builtHtml.includes("npm Exec Smoke")) {
    throw new Error("npm exec build produced output, but dist/index.html is missing the deck title.");
  }

  const port = await findFreePort();
  const devUrl = `http://localhost:${port}/`;
  let devOutput = "";
  const devProcess = spawnCommand(
    "npm",
    [
      "exec",
      "--yes",
      `--package=${options.coreTarball}`,
      `--package=${options.clientTarball}`,
      `--package=${options.nodeTarball}`,
      `--package=${options.cliTarball}`,
      "--",
      "slidev-react",
      "dev",
      "slides.mdx",
      "--port",
      String(port),
    ],
    {
      cwd: options.appRoot,
      onStdout: (output) => {
        devOutput += output;
      },
      onStderr: (output) => {
        devOutput += output;
      },
    },
  );

  await waitForOutput(() => /Local:\s+http:\/\/localhost:/i.test(devOutput), 30_000);
  assertNoKnownPackagingErrors(devOutput);

  await assertDevServerInBrowser({
    devUrl,
    expectedTitle: "npm Exec Smoke",
    devProcess,
    devOutput: () => devOutput,
  });
}

async function main() {
  const repoRoot = path.resolve(import.meta.dirname, "..");
  const packDir = await mkdtemp(path.join(tmpdir(), "slidev-react-pack-"));
  const npmInstallAppRoot = await mkdtemp(path.join(tmpdir(), "slidev-react-npm-install-"));
  const npmExecAppRoot = await mkdtemp(path.join(tmpdir(), "slidev-react-npm-exec-"));
  const rootPackageJson = readJson<PackageJson>(path.join(repoRoot, "package.json"));
  const reactVersion = rootPackageJson.dependencies?.react;
  const reactDomVersion = rootPackageJson.dependencies?.["react-dom"];
  const mdxReactVersion = rootPackageJson.devDependencies?.["@mdx-js/react"];

  if (!reactVersion || !reactDomVersion || !mdxReactVersion) {
    throw new Error("Missing runtime peer versions needed for npm install smoke test.");
  }

  const [coreTarball, clientTarball, nodeTarball, cliTarball] = await Promise.all([
    packPackage(path.join(repoRoot, "packages/core"), packDir),
    packPackage(path.join(repoRoot, "packages/client"), packDir),
    packPackage(path.join(repoRoot, "packages/node"), packDir),
    packPackage(path.join(repoRoot, "packages/cli"), packDir),
  ]);

  await runInstalledCliSmoke({
    appRoot: npmInstallAppRoot,
    coreTarball,
    clientTarball,
    nodeTarball,
    cliTarball,
    reactVersion,
    reactDomVersion,
    mdxReactVersion,
  });

  await runExecCliSmoke({
    appRoot: npmExecAppRoot,
    coreTarball,
    clientTarball,
    nodeTarball,
    cliTarball,
  });
}

await main();
