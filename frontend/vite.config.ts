import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Static output — no server functions, keeps deployment on the free tier.
    outDir: "dist",
    sourcemap: false,
  },
});
