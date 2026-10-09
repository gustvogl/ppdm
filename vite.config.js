import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

function staticWorker() {
  let root, outDir;
  return {
    name: "nexo-static-worker",
    apply: "build",
    configResolved(config) {
      root = config.root;
      outDir = resolve(root, config.build.outDir);
    },
    async closeBundle() {
      const assets = await readdir(resolve(outDir, "assets"));
      const paths = [
        "/index.html",
        "/favicon.svg",
        "/manifest.webmanifest",
        "/icons/icon-192.png",
        "/icons/icon-512.png",
        "/icons/maskable-512.png",
        "/icons/apple-touch-icon.png",
        ...assets
          .filter((name) => !name.endsWith(".map"))
          .map((name) => `/assets/${name}`),
      ];
      const hash = createHash("sha256");
      for (const path of paths)
        hash.update(await readFile(resolve(outDir, `.${path}`)));
      const source = await readFile(
        resolve(root, "pwa/service-worker.js"),
        "utf8",
      );
      await writeFile(
        resolve(outDir, "sw.js"),
        source
          .replace("__VERSION__", hash.digest("hex").slice(0, 16))
          .replace("__PRECACHE__", JSON.stringify(paths)),
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), staticWorker()],
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.js"],
    clearMocks: true,
  },
});
