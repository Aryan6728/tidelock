import { SuiJsonRpcClient, JsonRpcHTTPTransport } from "@mysten/sui/jsonRpc";

const TATUM_API_KEY = import.meta.env.VITE_TATUM_API_KEY as string;

// In dev, calls go through Vite's proxy (configured in vite.config.mts),
// which forwards "/tatum" -> https://sui-testnet.gateway.tatum.io
// server-side, avoiding browser CORS. Used for READING on-chain data —
// e.g. verifying a Share is still valid before we decrypt a file.
export const tatumClient = new SuiJsonRpcClient({
  network: "testnet",
  transport: new JsonRpcHTTPTransport({
    url: "/tatum",
    rpc: {
      headers: { "x-api-key": TATUM_API_KEY },
    },
  }),
});