import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DEMO_SLIDES_MDX } from "../../templates/demoSlidesSource.ts";

export interface PreflightSlidesSourceOptions {
  slidesSourceFile: string;
  explicit: boolean;
  allowScaffold: boolean;
  appRoot: string;
  logger?: (message: string) => void;
}

export interface PreflightSlidesSourceResult {
  scaffolded: boolean;
}

export function preflightSlidesSource(
  options: PreflightSlidesSourceOptions,
): PreflightSlidesSourceResult {
  const { slidesSourceFile, explicit, allowScaffold, appRoot } = options;

  if (existsSync(slidesSourceFile)) {
    return { scaffolded: false };
  }

  const displayPath = path.relative(appRoot, slidesSourceFile) || slidesSourceFile;

  if (explicit) {
    throw new Error(
      `Slides file not found: ${displayPath}. ` +
        `Create the file or drop the positional argument to scaffold a demo deck.`,
    );
  }

  if (!allowScaffold) {
    throw new Error(
      `Slides file not found: ${displayPath}. ` +
        `Remove --no-scaffold to let the CLI generate a starter deck, or create the file manually.`,
    );
  }

  writeFileSync(slidesSourceFile, DEMO_SLIDES_MDX, "utf8");

  const log = options.logger ?? ((message: string) => console.log(message));
  log(
    `[slidev-react] Generated starter deck at ${displayPath}. Edit this file to build your slides.`,
  );

  return { scaffolded: true };
}
