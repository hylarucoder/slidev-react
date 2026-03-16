import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

export function prepareBuildIndexHtml(options: {
  appRoot: string;
  html: string;
}) {
  const buildDir = path.join(options.appRoot, ".slidev-react", "build");
  const filePath = path.join(buildDir, "index.html");
  const legacyBuildIndexPath = path.join(options.appRoot, ".slidev-react", "index.html");

  mkdirSync(buildDir, { recursive: true });
  writeFileSync(filePath, options.html, "utf8");

  return {
    filePath,
    cleanup() {
      rmSync(filePath, { force: true });
      rmSync(legacyBuildIndexPath, { force: true });
      if (existsSync(buildDir)) {
        rmSync(buildDir, { force: true, recursive: true });
      }
    },
  };
}
