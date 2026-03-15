import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import { parse as parseYaml } from "yaml";

const VIRTUAL_ENTRY_ID = "virtual:slidev-react/entry";
const RESOLVED_VIRTUAL_ENTRY = "\0" + VIRTUAL_ENTRY_ID;

function extractTitleFromSlidesFile(slidesSourceFile: string): string {
  try {
    const source = readFileSync(slidesSourceFile, "utf8");
    const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) return "Slidev React";

    const data = parseYaml(match[1]);
    return typeof data?.title === "string" ? data.title : "Slidev React";
  } catch {
    return "Slidev React";
  }
}

function generateIndexHtml(options: { title: string }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=JetBrains+Mono:wght@400;600&display=swap"
    />
    <title>${options.title}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/${VIRTUAL_ENTRY_ID}"></script>
  </body>
</html>`;
}

function prepareBuildIndexHtml(options: {
  appRoot: string;
  title: string;
}) {
  const filePath = path.join(options.appRoot, "index.html");
  const backupDir = path.join(options.appRoot, ".slidev-react");
  const backupFilePath = path.join(backupDir, "index.original.html");
  const legacyBuildIndexPath = path.join(backupDir, "index.html");
  const generatedHtml = generateIndexHtml({ title: options.title });
  const existingHtml = existsSync(filePath) ? readFileSync(filePath, "utf8") : null;
  const hasRestorableOriginal = existingHtml !== null && existingHtml !== generatedHtml;

  if (hasRestorableOriginal) {
    mkdirSync(backupDir, { recursive: true });
    copyFileSync(filePath, backupFilePath);
  }

  writeFileSync(filePath, generatedHtml, "utf8");

  return {
    filePath,
    cleanup() {
      if (hasRestorableOriginal && existsSync(backupFilePath)) {
        copyFileSync(backupFilePath, filePath);
        rmSync(backupFilePath, { force: true });
      } else {
        rmSync(filePath, { force: true });
      }

      rmSync(legacyBuildIndexPath, { force: true });
    },
  };
}

function generateEntryModule(options: {
  clientEntryPath: string;
  clientStylePath: string;
}) {
  const { clientEntryPath, clientStylePath } = options;

  return `import { mountSlidesApp } from "${clientEntryPath}"
import "${clientStylePath}"

mountSlidesApp(document.getElementById("root"))
`;
}

/**
 * Pure virtual entry — no physical files needed.
 *
 * Sets `appType: "custom"` to disable Vite's built-in HTML handling
 * (which would 404 without a physical index.html). Then provides its own
 * SPA-aware middleware as a post-hook — static files and HMR are served
 * by Vite's other middleware, and any remaining navigation request falls
 * through to our virtual HTML.
 */
export function pluginVirtualEntry(options: {
  appRoot: string;
  slidesSourceFile: string;
  clientEntryPath: string;
  clientStylePath: string;
}): Plugin {
  const { appRoot, slidesSourceFile, clientEntryPath, clientStylePath } = options;
  const title = extractTitleFromSlidesFile(slidesSourceFile);
  let buildIndexCleanup: (() => void) | undefined;

  function cleanupBuildIndex() {
    buildIndexCleanup?.();
    buildIndexCleanup = undefined;
  }

  return {
    name: "slidev-react:virtual-entry",
    enforce: "pre",

    config(_config, env) {
      const virtualBuildIndex = env.command === "build"
        ? prepareBuildIndexHtml({
            appRoot,
            title,
          })
        : undefined;

      buildIndexCleanup = virtualBuildIndex?.cleanup;

      return {
        appType: "custom",
        ...(virtualBuildIndex
          ? {
              build: {
                rollupOptions: {
                  input: virtualBuildIndex.filePath,
                },
              },
            }
          : {}),
      };
    },

    buildEnd() {
      cleanupBuildIndex();
    },

    closeBundle() {
      cleanupBuildIndex();
    },

    configureServer(server) {
      // Post-hook (returning function): runs AFTER Vite's static-file and
      // transform middlewares, so JS/CSS/image requests are handled normally.
      // Any unhandled navigation request falls through to us.
      return () => {
        server.middlewares.use(async (req, res, next) => {
          const accept = req.headers.accept ?? "";

          // Only serve HTML for navigation requests
          if (!accept.includes("text/html")) {
            next();
            return;
          }

          const url = req.url ?? "/";
          const html = generateIndexHtml({ title });
          const transformed = await server.transformIndexHtml(
            url,
            html,
            req.originalUrl,
          );
          res.setHeader("Content-Type", "text/html");
          res.statusCode = 200;
          res.end(transformed);
        });
      };
    },

    resolveId(id) {
      if (id === VIRTUAL_ENTRY_ID || id === `/${VIRTUAL_ENTRY_ID}`) {
        return RESOLVED_VIRTUAL_ENTRY;
      }
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_ENTRY) {
        return generateEntryModule({
          clientEntryPath,
          clientStylePath,
        });
      }
    },
  };
}
