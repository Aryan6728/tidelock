import { useEffect, useState } from "react";
import { tatumClient } from "./lib/tatum";
import { PACKAGE_ID } from "./lib/constants";

export function TatumTest() {
  const [status, setStatus] = useState("Reading your package via Tatum...");

  useEffect(() => {
    tatumClient
      .getObject({ id: PACKAGE_ID, options: { showType: true } })
      .then((res) => setStatus(`Tatum read OK — object type: ${res.data?.type}`))
      .catch((err) => setStatus(`Tatum read failed: ${err.message}`));
  }, []);

  return (
    <div style={{ maxWidth: 560, margin: "1rem auto", padding: "1rem", border: "1px solid #444", borderRadius: 12 }}>
      <strong>Tatum RPC test:</strong> {status}
    </div>
  );
}