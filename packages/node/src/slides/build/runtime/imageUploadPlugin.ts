import path from "node:path";
import { existsSync, mkdirSync, writeFileSync, readdirSync, unlinkSync } from "node:fs";
import type { Plugin } from "vite";

export function pluginImageUpload(options: { appRoot: string; slidesSourceFile: string }): Plugin {
  const slidesDir = path.dirname(options.slidesSourceFile);
  const assetsDir = path.join(slidesDir, "assets");
  const assetsPublicPath = "/" + path.relative(options.appRoot, assetsDir).replace(/\\/g, "/");

  return {
    name: "slidev-react:image-upload",
    config() {
      return {
        define: {
          __SLIDES_ASSETS_BASE__: JSON.stringify(assetsPublicPath),
        },
      };
    },
    configureServer(server) {
      server.middlewares.use("/__slides-api/upload", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }

        const chunks: Buffer[] = [];
        req.on("data", (chunk: Buffer) => chunks.push(chunk));
        req.on("end", () => {
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString());
            const { id, data } = body as { id: string; data: string };

            if (!id || !data) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "missing id or data" }));
              return;
            }

            if (!existsSync(assetsDir)) {
              mkdirSync(assetsDir, { recursive: true });
            }

            const base64 = data.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64, "base64");
            const ext = data.match(/^data:image\/(\w+);/)?.[1] || "png";
            const filename = `${id}.${ext}`;
            const filepath = path.join(assetsDir, filename);

            writeFileSync(filepath, buffer);

            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ url: `${assetsPublicPath}/${filename}` }));
          } catch {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "upload failed" }));
          }
        });
      });

      server.middlewares.use("/__slides-api/image-list", (_req, res) => {
        if (!existsSync(assetsDir)) {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({}));
          return;
        }

        const files = readdirSync(assetsDir);
        const map: Record<string, string> = {};
        for (const file of files) {
          const id = file.replace(/\.\w+$/, "");
          map[id] = `${assetsPublicPath}/${file}`;
        }

        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(map));
      });

      server.middlewares.use("/__slides-api/delete-image", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }

        const chunks: Buffer[] = [];
        req.on("data", (chunk: Buffer) => chunks.push(chunk));
        req.on("end", () => {
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString());
            const { id } = body as { id: string };

            if (!existsSync(assetsDir)) {
              res.statusCode = 404;
              res.end();
              return;
            }

            const files = readdirSync(assetsDir);
            const match = files.find((f) => f.replace(/\.\w+$/, "") === id);
            if (match) {
              unlinkSync(path.join(assetsDir, match));
            }

            res.statusCode = 200;
            res.end();
          } catch {
            res.statusCode = 500;
            res.end();
          }
        });
      });
    },
  };
}
