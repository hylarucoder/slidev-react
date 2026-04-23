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
    expect(result.stdout).toContain("Usage: slidev-react [command|file] [options...]");
    expect(result.stdout).toContain("Commands:");
    expect(result.stdout).toContain("dev [file]");
    expect(result.stdout).toContain("export [file]");
    expect(result.stdout).toContain(
      "Run `slidev-react <command> --help` for command-specific options.",
    );
    expect(result.stdout).toContain("When no command is given, `dev` is assumed");
    expect(result.stdout).toContain("Examples:");
  });

  it("prints command-specific help for export", async () => {
    const result = await runCli(["export", "--help"]);

    expect(result.code).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Usage: slidev-react export [options] [file]");
    expect(result.stdout).toContain("Supported options:");
    expect(result.stdout).toContain("--format pdf|png|all");
    expect(result.stdout).toContain("--slides <range>");
  });

  it("rejects extra positional args for lint", async () => {
    const result = await runCli(["lint", "slides-a.mdx", "slides-b.mdx"]);

    expect(result.code).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain('[slidev-react] Unknown lint argument "slides-b.mdx".');
  });
});
