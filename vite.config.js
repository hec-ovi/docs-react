import fs from "node:fs";
import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { writeIndex, DEFAULT_ROOT, EXAMPLE_ROOT, resolveRoot } from "./lib/library.mjs";

const TYPES = {
  ".md": "text/markdown; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
};

/** Serve the library at ./content/ in dev, keep its index fresh, and copy it into the build. */
function docsLibrary(root) {
  let outDir = "dist";
  let timer = null;
  const reindex = () => {
    const { count, warnings } = writeIndex(root);
    for (const w of warnings) console.warn(`[docs] warning: ${w}`);
    return count;
  };
  return {
    name: "docs-library",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    configureServer(server) {
      console.log(`[docs] library ${root}: ${reindex()} docs`);
      server.watcher.add(root);
      const onChange = (file) => {
        if (!file.startsWith(root) || !file.endsWith(".md") || path.basename(file) === "INDEX.md") return;
        clearTimeout(timer);
        timer = setTimeout(() => {
          reindex();
          server.ws.send({ type: "custom", event: "docs:changed", data: { file: path.relative(root, file) } });
        }, 120);
      };
      server.watcher.on("add", onChange).on("change", onChange).on("unlink", onChange);
      server.middlewares.use("/content", (req, res, next) => {
        const rel = decodeURIComponent((req.url || "/").split("?")[0]);
        const file = path.join(root, rel);
        if (!file.startsWith(root + path.sep)) return next();
        fs.stat(file, (err, st) => {
          if (err || !st.isFile()) return next();
          res.setHeader("Content-Type", TYPES[path.extname(file).toLowerCase()] || "application/octet-stream");
          res.setHeader("Cache-Control", "no-cache");
          fs.createReadStream(file).pipe(res);
        });
      });
    },
    closeBundle() {
      const count = reindex();
      fs.cpSync(root, path.join(outDir, "content"), {
        recursive: true,
        filter: (src) => !path.basename(src).startsWith("."),
      });
      console.log(`[docs] copied ${count} docs from ${root} to ${path.join(outDir, "content")}`);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (env.DOCS_ROOT && !process.env.DOCS_ROOT) process.env.DOCS_ROOT = env.DOCS_ROOT;
  // The public GitHub Pages build (docs/) only ever ships the example library.
  const pages = mode === "pages";
  const root = pages ? EXAMPLE_ROOT : process.env.DOCS_ROOT ? resolveRoot() : fs.existsSync(DEFAULT_ROOT) ? DEFAULT_ROOT : EXAMPLE_ROOT;
  return {
    plugins: [react(), docsLibrary(root)],
    base: "./",
    build: {
      outDir: pages ? "docs" : "dist",
      emptyOutDir: true,
      chunkSizeWarningLimit: 700,
    },
  };
});
