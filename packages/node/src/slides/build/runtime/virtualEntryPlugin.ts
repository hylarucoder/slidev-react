import { existsSync, renameSync, rmSync } from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import { prepareBuildIndexHtml } from "./buildIndexHtml.ts";
import { extractTitleFromSlidesFile, generateSlidesIndexHtml } from "./slidesHtmlShell.ts";
import { generateVirtualEntryModule } from "./virtualEntryModule.ts";

const VIRTUAL_ENTRY_ID = "virtual:slidev-react/entry";
const RESOLVED_VIRTUAL_ENTRY = "\0" + VIRTUAL_ENTRY_ID;

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
  const html = generateSlidesIndexHtml({
    title,
    entryModuleId: VIRTUAL_ENTRY_ID,
  });
  let buildIndexCleanup: (() => void) | undefined;
  let outputDir: string | undefined;

  function cleanupBuildIndex() {
    buildIndexCleanup?.();
    buildIndexCleanup = undefined;
  }

  function finalizeBuiltIndex() {
    if (!outputDir) return;

    const nestedIndexPath = path.join(outputDir, ".slidev-react", "build", "index.html");
    const outputIndexPath = path.join(outputDir, "index.html");
    const nestedOutputDir = path.join(outputDir, ".slidev-react");

    if (!existsSync(nestedIndexPath)) return;

    renameSync(nestedIndexPath, outputIndexPath);
    rmSync(nestedOutputDir, { force: true, recursive: true });
  }

  return {
    name: "slidev-react:virtual-entry",
    enforce: "pre",

    configResolved(config) {
      outputDir = path.resolve(config.root, config.build.outDir);
    },

    config(_config, env) {
      const virtualBuildIndex = env.command === "build"
        ? prepareBuildIndexHtml({
            appRoot,
            html,
          })
        : undefined;

      buildIndexCleanup = virtualBuildIndex
        ? () => {
            virtualBuildIndex.cleanup();
          }
        : undefined;

      return {
        appType: "custom",
        ...(virtualBuildIndex
          ? {
              build: {
                rollupOptions: {
                  input: {
                    index: virtualBuildIndex.filePath,
                  },
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
      finalizeBuiltIndex();
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
        return generateVirtualEntryModule({
          clientEntryPath,
          clientStylePath,
        });
      }
    },
  };
}
