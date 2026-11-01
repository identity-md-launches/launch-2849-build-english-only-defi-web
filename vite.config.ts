import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" keeps every asset URL relative, so the export works at an IPFS
// gateway subpath or an ENS name without a server rewrite.
export default defineConfig({
  base: "./",
  // NEXT_PUBLIC_DATA_MODE=demo|live selects the data source at build time.
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  plugins: [react()],
  build: { outDir: "dist", emptyOutDir: true, chunkSizeWarningLimit: 1500 },
});
