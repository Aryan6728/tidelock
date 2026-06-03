import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Forward "/tatum" calls to Tatum's Sui testnet gateway,
      // server-side, so the browser never hits CORS.
      "/tatum": {
        target: "https://sui-testnet.gateway.tatum.io",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tatum/, ""),
      },
    },
  },
});