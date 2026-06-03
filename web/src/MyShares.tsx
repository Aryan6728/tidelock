import { useEffect, useState } from "react";
import { useCurrentAccount, useDAppKit } from "@mysten/dapp-kit-react";
import { listMyShares, buildRevokeTx, type OwnedShare } from "./lib/share";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { RefreshCw, FileLock2 } from "lucide-react";

export function MyShares() {
  const account = useCurrentAccount();
  const dAppKit = useDAppKit();
  const [shares, setShares] = useState<OwnedShare[]>([]);
  const [status, setStatus] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    if (!account) return;
    setLoading(true);
    setStatus("");
    try {
      const list = await listMyShares(account.address);
      setShares(list);
      if (!list.length) setStatus("No shares yet.");
    } catch (err) {
      setStatus(`Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.address]);

  async function handleRevoke(shareId: string) {
    setBusyId(shareId);
    try {
      const tx = buildRevokeTx(shareId);
      await dAppKit.signAndExecuteTransaction({ transaction: tx });
      setTimeout(refresh, 2000);
    } catch (err) {
      setStatus(`Error: ${(err as Error).message}`);
    } finally {
      setBusyId(null);
    }
  }

  if (!account) return null;

  function statusOf(s: OwnedShare): "active" | "revoked" | "expired" {
    if (s.revoked) return "revoked";
    if (s.expiryMs !== 0 && Date.now() > s.expiryMs) return "expired";
    return "active";
  }

  return (
    <div className="mx-auto max-w-xl rounded-2xl border bg-card p-6 card-elevated">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileLock2 className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold">My shares</h2>
        </div>
        <Button variant="ghost" onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {status && <p className="mt-3 text-sm text-muted-foreground">{status}</p>}

      <div className="mt-4 space-y-3">
        {shares.map((s) => {
          const st = statusOf(s);
          return (
           <div key={s.shareId} className="rounded-xl border bg-background/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1 text-xs">
                  <p className="truncate font-mono text-muted-foreground">
                    <span className="text-foreground">Share</span> {s.shareId}
                  </p>
                  <p className="truncate font-mono text-muted-foreground">
                    <span className="text-foreground">Blob</span> {s.blobId}
                  </p>
                </div>
                <Badge tone={st}>{st === "active" ? "Active" : st === "revoked" ? "Revoked" : "Expired"}</Badge>
              </div>
              {st === "active" && (
                <Button
                  variant="danger"
                  className="mt-3 w-full"
                  onClick={() => handleRevoke(s.shareId)}
                  disabled={busyId === s.shareId}
                >
                  {busyId === s.shareId ? "Revoking…" : "Revoke access"}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}