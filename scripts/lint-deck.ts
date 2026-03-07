import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseDeck } from "../src/deck/parsing/parseDeck";
import { validateDeckAuthoring } from "../src/deck/validation/validateDeckAuthoring";

function parseArgs(argv: string[]) {
  let deckFile = "slides.mdx";
  let strict = false;

  for (let index = 0; index < argv.length; index += 1) {
    const entry = argv[index];
    if (entry === "--strict") {
      strict = true;
      continue;
    }

    if (entry === "--file" && argv[index + 1]) {
      deckFile = argv[index + 1];
      index += 1;
      continue;
    }

    if (!entry.startsWith("--")) {
      deckFile = entry;
    }
  }

  return {
    deckFile,
    strict,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const deckSourceFile = path.resolve(options.deckFile);
  const source = await readFile(deckSourceFile, "utf8");
  const deck = parseDeck(source);
  const warnings = await validateDeckAuthoring({
    appRoot: process.cwd(),
    deck,
  });

  if (warnings.length === 0) {
    console.log(
      `Deck lint passed: no authoring warnings for ${path.relative(process.cwd(), deckSourceFile)}`,
    );
    return;
  }

  console.warn(`Deck lint found ${warnings.length} warning${warnings.length === 1 ? "" : "s"}:`);
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }

  if (options.strict) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Deck lint failed: ${message}`);
  process.exitCode = 1;
});
