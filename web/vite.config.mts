import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api/tatum": {
          target: "https://sui-testnet.gateway.tatum.io",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/tatum/, ""),
          headers: { "x-api-key": env.VITE_TATUM_API_KEY ?? "" },
        },
      },
    },
  };
});