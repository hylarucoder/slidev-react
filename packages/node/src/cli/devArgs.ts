import { parseBooleanFlag, parsePositiveIntegerOption } from "../context.ts";
import { readOptionValue } from "./readOptionValue.ts";

export interface DevCliArgs {
  slidesFile?: string;
  host?: string;
  port?: number;
  open?: boolean;
  strictPort?: boolean;
  base?: string;
  mode?: string;
  noScaffold?: boolean;
}

export function parseDevArgs(argv: string[]): DevCliArgs {
  let slidesFile;
  let host;
  let port;
  let open;
  let strictPort;
  let base;
  let mode;
  let noScaffold;

  for (let index = 0; index < argv.length; index += 1) {
    const entry = argv[index];
    if (!entry.startsWith("--")) {
      if (!slidesFile) {
        slidesFile = entry;
        continue;
      }

      throw new Error(`Unknown dev argument "${entry}".`);
    }

    if (entry === "--open") {
      open = true;
      continue;
    }

    if (entry === "--strictPort") {
      strictPort = true;
      continue;
    }

    if (entry === "--file" || entry.startsWith("--file=")) {
      const result = readOptionValue(argv, index, "--file");
      slidesFile = result.value;
      index = result.nextIndex;
      continue;
    }

    if (entry === "--host" || entry.startsWith("--host=")) {
      const result = readOptionValue(argv, index, "--host");
      host = result.value;
      index = result.nextIndex;
      continue;
    }

    if (entry === "--port" || entry.startsWith("--port=")) {
      const result = readOptionValue(argv, index, "--port");
      port = parsePositiveIntegerOption("--port", result.value);
      index = result.nextIndex;
      continue;
    }

    if (entry === "--base" || entry.startsWith("--base=")) {
      const result = readOptionValue(argv, index, "--base");
      base = result.value;
      index = result.nextIndex;
      continue;
    }

    if (entry === "--mode" || entry.startsWith("--mode=")) {
      const result = readOptionValue(argv, index, "--mode");
      mode = result.value;
      index = result.nextIndex;
      continue;
    }

    if (entry === "--open=false" || entry === "--open=true") {
      open = parseBooleanFlag(entry.slice("--open=".length));
      continue;
    }

    if (entry === "--strictPort=false" || entry === "--strictPort=true") {
      strictPort = parseBooleanFlag(entry.slice("--strictPort=".length));
      continue;
    }

    if (entry === "--no-scaffold") {
      noScaffold = true;
      continue;
    }

    if (entry === "--no-scaffold=false" || entry === "--no-scaffold=true") {
      noScaffold = parseBooleanFlag(entry.slice("--no-scaffold=".length));
      continue;
    }

    throw new Error(`Unknown dev option "${entry}".`);
  }

  return {
    slidesFile,
    host,
    port,
    open,
    strictPort,
    base,
    mode,
    noScaffold,
  };
}
