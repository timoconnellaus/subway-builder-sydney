import { defineConfig } from "vite";

export default defineConfig({
  publicDir: "public",
  build: { outDir: "dist", emptyOutDir: true, target: "es2022", chunkSizeWarningLimit: 1500 },
  server: {
    port: 5173,
    proxy: { "/api": { target: "http://127.0.0.1:8787", ws: true, changeOrigin: true } }
  }
});
