declare const process: { env: Record<string, string | undefined> };

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  const body = await req.text();
  const res = await fetch("https://sui-testnet.gateway.tatum.io", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.TATUM_API_KEY ?? "",
    },
    body,
  });
  return new Response(res.body, {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}