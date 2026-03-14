import { spawn } from "node:child_process";
import path from "node:path";
import { createRequire } from "node:module";
import { describe, expect, it } from "vite-plus/test";

const require = createRequire(import.meta.url);
const tsxImport = require.resolve("tsx");
const cliFile = path.resolve(process.cwd(), "packages/cli/bin/slidev-react.ts");

function runCli(args: string[]): Promise<{
  code: number | null;
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolve, reject) => {
    const child = spawn("node", ["--import", tsxImport, cliFile, ...args], {
      cwd: process.cwd(),
      stdio: "pipe",
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
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
}

describe("slidev-react CLI", () => {
  it("prints help to stdout", async () => {
    const result = await runCli(["--help"]);

    expect(result.code).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Usage: slidev-react <command> [file] [options...]");
    expect(result.stdout).toContain("Commands:");
    expect(result.stdout).toContain("dev [file]");
    expect(result.stdout).toContain("export [file]");
    expect(result.stdout).toContain("Supported dev options:");
    expect(result.stdout).toContain("Examples:");
  });

  it("prints an unknown command error once and exits with failure", async () => {
    const result = await runCli(["nope"]);

    expect(result.code).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("error: unknown command 'nope'");
    expect(result.stderr).not.toContain("[slidev-react]");
  });
});
