import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    {
      name: "standalone-index-alias",
      closeBundle() {
        const outputDir = resolve(__dirname, "dist-standalone");
        const standaloneIndex = resolve(outputDir, "index.standalone.html");
        const netlifyIndex = resolve(outputDir, "index.html");
        if (existsSync(standaloneIndex)) {
          copyFileSync(standaloneIndex, netlifyIndex);
        }
      },
    },
  ],
  build: {
    outDir: "dist-standalone",
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, "index.standalone.html"),
    },
  },
});
