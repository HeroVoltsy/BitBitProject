import { defineConfig, loadEnv, type ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "API_");
  const target = env.API_PROXY_TARGET || "https://bit-bit-project.vercel.app";
  const proxy: Record<string, ProxyOptions> = {
    "/backend": {
      target,
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/backend/, ""),
      configure: (server) => {
        server.on("proxyRes", (response) => {
          response.headers["cache-control"] = "private, no-store";
        });
      },
    },
  };
  return {
    plugins: [react()],
    server: { proxy },
    preview: { proxy },
    build: { outDir: "dist", sourcemap: false },
  };
});
