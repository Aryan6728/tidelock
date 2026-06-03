import { SuiJsonRpcClient, JsonRpcHTTPTransport } from "@mysten/sui/jsonRpc";

export const tatumClient = new SuiJsonRpcClient({
  network: "testnet",
  transport: new JsonRpcHTTPTransport({
    url: "/api/tatum",
  }),
});