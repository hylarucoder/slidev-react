#!/usr/bin/env node

import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Command, CommanderError } from "@commander-js/extra-typings";
import { normalizeArgv } from "./normalizeArgv.ts";

interface CommandResult {
  code: number;
  signal: NodeJS.Signals | null;
}

type CommandRunner = (argv: string[]) => Promise<void>;

const ROOT_HELP_TEXT = `
Run \`slidev-react <command> --help\` for command-specific options.
When no command is given, \`dev\` is assumed — a bare \`slidev-react\` or
\`slidev-react slides.mdx\` is equivalent to \`slidev-react dev [slides.mdx]\`.

Examples:
  slidev-react                                         # dev on ./slides.mdx
  slidev-react slides-ar-3-4.mdx --host 0.0.0.0        # dev with a file
  slidev-react dev slides-ar-3-4.mdx --port 5174
  slidev-react build slides-ar-3-4.mdx
  slidev-react export slides-ar-3-4.mdx --format png --slides 3-7
  slidev-react lint slides-ar-3-4.mdx --strict
`;

const DEV_HELP_TEXT = `
Supported options:
  --file <path>, --host <host>, --port <port>, --open, --open=false
  --strictPort, --strictPort=false, --base <path>, --mode <mode>
  --no-scaffold  (do not auto-generate slides.mdx when missing)

Examples:
  slidev-react dev
  slidev-react dev slides-ar-3-4.mdx --host 0.0.0.0 --port 5174
  slidev-react dev --file slides-ar-3-4.mdx --open
`;

const BUILD_HELP_TEXT = `
Supported options:
  --file <path>, --outDir <dir>, --base <path>, --mode <mode>
  --emptyOutDir, --emptyOutDir=false, --minify, --minify=false
  --minify=esbuild|terser, --sourcemap, --sourcemap=false
  --sourcemap=inline|hidden

Examples:
  slidev-react build
  slidev-react build slides-ar-3-4.mdx --outDir dist/slides
  slidev-react build --file slides-ar-3-4.mdx --sourcemap
`;

const EXPORT_HELP_TEXT = `
Supported options:
  --file <path>, --format pdf|png|all, --output <dir>
  --host <host>, --port <port>, --base-url <url>
  --slides <range>, --with-clicks

Examples:
  slidev-react export slides-ar-3-4.mdx --format png
  slidev-react export --file slides-ar-3-4.mdx --slides 3-7
  slidev-react export --base-url http://127.0.0.1:4173 --format pdf
`;

const LINT_HELP_TEXT = `
Supported options:
  --file <path>, --strict

Examples:
  slidev-react lint
  slidev-react lint slides-ar-3-4.mdx
  slidev-react lint --file slides-ar-3-4.mdx --strict
`;

function fail(message: string): never {
  console.error(`[slidev-react] ${message}`);
  process.exit(1);
}

function exitWithCommandResult(result: CommandResult) {
  if (result.signal) {
    process.kill(process.pid, result.signal);
    return;
  }

  process.exit(result.code);
}

async function loadNodeCommands() {
  const localNodeEntry = new URL("../../node/src/index.ts", import.meta.url);
  if (existsSync(fileURLToPath(localNodeEntry))) {
    return await import(localNodeEntry.href);
  }

  return await import("@slidev-react/node");
}

async function runWithViteArgs(
  argv: string[],
  runner: (options: { appRoot: string; viteArgs: string[] }) => Promise<CommandResult>,
) {
  const result = await runner({
    appRoot: process.cwd(),
    viteArgs: argv,
  });

  exitWithCommandResult(result);
}

async function runWithCliArgs(
  argv: string[],
  runner: (options: { appRoot: string; cliArgs: string[] }) => Promise<CommandResult>,
) {
  const result = await runner({
    appRoot: process.cwd(),
    cliArgs: argv,
  });

  exitWithCommandResult(result);
}

function createPassThroughCommand(
  program: Command,
  name: string,
  description: string,
  runner: CommandRunner,
  helpText: string,
) {
  program
    .command(name)
    .description(description)
    .argument("[file]")
    .allowUnknownOption(true)
    .allowExcessArguments(true)
    .addHelpText("after", helpText)
    .action(async (_file, _options, command) => {
      await runner(command.args);
    });
}

const program = new Command()
  .name("slidev-react")
  .description("Run, build, and export MDX slide decks.")
  .usage("[command|file] [options...]")
  .showHelpAfterError()
  .showSuggestionAfterError()
  .addHelpText("after", ROOT_HELP_TEXT)
  .exitOverride();

createPassThroughCommand(
  program,
  "dev",
  "Start the dev server for your slides",
  async (argv) => {
    const { runSlidesDev } = await loadNodeCommands();
    await runWithViteArgs(argv, runSlidesDev);
  },
  DEV_HELP_TEXT,
);

createPassThroughCommand(
  program,
  "build",
  "Build slides for production",
  async (argv) => {
    const { runSlidesBuild } = await loadNodeCommands();
    await runWithViteArgs(argv, runSlidesBuild);
  },
  BUILD_HELP_TEXT,
);

createPassThroughCommand(
  program,
  "export",
  "Export PDF / PNG artifacts through Playwright",
  async (argv) => {
    const { runSlidesExport } = await loadNodeCommands();
    await runWithCliArgs(argv, runSlidesExport);
  },
  EXPORT_HELP_TEXT,
);

createPassThroughCommand(
  program,
  "lint",
  "Lint slides for authoring warnings",
  async (argv) => {
    const { runSlidesLint } = await loadNodeCommands();
    await runWithCliArgs(argv, runSlidesLint);
  },
  LINT_HELP_TEXT,
);

try {
  const normalized = normalizeArgv(process.argv.slice(2));
  await program.parseAsync(normalized, { from: "user" });
} catch (error) {
  if (error instanceof CommanderError) {
    if (error.code === "commander.helpDisplayed") {
      process.exit(0);
    }

    process.exit(error.exitCode);
  }

  fail(error instanceof Error ? error.message : String(error));
}
