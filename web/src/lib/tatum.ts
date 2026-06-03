import { SuiJsonRpcClient, JsonRpcHTTPTransport } from "@mysten/sui/jsonRpc";

// Both dev and prod call "/api/tatum":
//  - dev: Vite proxies /api/tatum -> Tatum (see vite.config.mts)
//  - prod: the /api/tatum serverless function forwards to Tatum
export const tatumClient = new SuiJsonRpcClient({
  network: "testnet",
  transport: new JsonRpcHTTPTransport({
    url: "/api/tatum",
  }),
});
