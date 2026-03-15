import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";

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
        reject(new Error("Failed to resolve a free port for the runtime smoke test."));
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
      throw new Error("Timed out waiting for the dev smoke server to boot.");
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

function assertNoDependencyResolutionErrors(output: string) {
  if (/Failed to resolve dependency:/i.test(output)) {
    throw new Error(`Runtime smoke test saw a dependency resolution failure:\n${output}`);
  }
}

async function main() {
  const appRoot = await mkdtemp(path.join(tmpdir(), "slidev-react-self-contained-"));
  const slidesSourceFile = path.join(appRoot, "slides.mdx");
  const repoRoot = path.resolve(import.meta.dirname, "..");
  const cliFile = path.join(repoRoot, "packages/cli/dist/bin/slidev-react.mjs");

  await writeFile(
    slidesSourceFile,
    [
      "---",
      "title: Self Contained Smoke",
      "addons:",
      "  - insight",
      "---",
      "",
      "# Hello",
      "",
      "<Insight title=\"Smoke\">runtime ok</Insight>",
      "",
    ].join("\n"),
    "utf8",
  );

  const buildProcess = spawnCommand("node", [cliFile, "build", "slides.mdx", "--outDir", "dist"], {
    cwd: appRoot,
  });
  const buildResult = await buildProcess.completed;

  if (buildResult.code !== 0) {
    throw new Error(`Build smoke failed:\n${buildResult.stderr || buildResult.stdout}`);
  }

  assertNoDependencyResolutionErrors(buildResult.stdout + buildResult.stderr);

  const builtHtml = await readFile(path.join(appRoot, "dist/index.html"), "utf8");
  if (!builtHtml.includes("Self Contained Smoke")) {
    throw new Error("Build smoke produced output, but index.html does not contain the deck title.");
  }

  const port = await findFreePort();
  let devOutput = "";

  const devProcess = spawnCommand("node", [cliFile, "dev", "slides.mdx", "--port", String(port)], {
    cwd: appRoot,
    onStdout: (output) => {
      devOutput += output;
    },
    onStderr: (output) => {
      devOutput += output;
    },
  });

  await waitForOutput(() => /Local:\s+http:\/\/localhost:/i.test(devOutput), 30_000);
  assertNoDependencyResolutionErrors(devOutput);
  devProcess.child.kill("SIGINT");
  const devResult = await devProcess.completed;
  assertNoDependencyResolutionErrors(devResult.stdout + devResult.stderr);
}

await main();
