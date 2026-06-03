import { useEffect, useState } from "react";
import { readShare } from "./lib/share";
import { downloadAndDecrypt } from "./lib/walrus";
import type { ShareLinkData } from "./lib/link";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Download, ShieldCheck, ShieldX, FileDown, Waves } from "lucide-react";

type State = "checking" | "ready" | "blocked" | "error";

export function Receive({ link }: { link: ShareLinkData }) {
  const [state, setState] = useState<State>("checking");
  const [message, setMessage] = useState("Checking access on Sui…");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const share = await readShare(link.shareId);
        if (!share) { setState("error"); setMessage("This share couldn't be found on-chain."); return; }
        if (share.revoked) { setState("blocked"); setMessage("This share has been revoked by its owner."); return; }
        if (share.expiryMs !== 0 && Date.now() > share.expiryMs) { setState("blocked"); setMessage("This share has expired."); return; }
        setState("ready"); setMessage("Access verified on-chain. Ready to download.");
      } catch (err) {
        setState("error"); setMessage(`Error reading the share: ${(err as Error).message}`);
      }
    })();
  }, [link.shareId]);

  async function handleDownload() {
    setBusy(true);
    try {
      const share = await readShare(link.shareId);
      if (!share || share.revoked || (share.expiryMs !== 0 && Date.now() > share.expiryMs)) {
        setState("blocked"); setMessage("This share is no longer available."); return;
      }
      const blob = await downloadAndDecrypt(share.blobId, link.key, link.mimeType);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = link.fileName; a.click();
      URL.revokeObjectURL(url);
      setMessage(`Downloaded "${link.fileName}".`);
    } catch (err) {
      setMessage(`Error: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-card p-8 text-center">
      <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
        state === "ready" ? "bg-[oklch(0.72_0.15_160_/_0.15)]"
        : state === "blocked" || state === "error" ? "bg-[oklch(0.58_0.18_25_/_0.15)]"
        : "bg-secondary"
      }`}>
        {state === "ready" ? <ShieldCheck className="h-7 w-7 text-[oklch(0.8_0.15_160)]" />
          : state === "blocked" || state === "error" ? <ShieldX className="h-7 w-7 text-[oklch(0.7_0.18_25)]" />
          : <Waves className="h-7 w-7 text-primary animate-pulse" />}
      </div>

      <h2 className="mt-5 font-display text-xl font-semibold">A file was shared with you</h2>
      <div className="mt-3 flex items-center justify-center gap-2">
        <FileDown className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground break-all">{link.fileName}</span>
      </div>

      <div className="mt-4">
        {state === "ready" && <Badge tone="active">Access verified</Badge>}
        {state === "blocked" && <Badge tone="revoked">Access denied</Badge>}
      </div>

      <p className="mt-4 text-sm text-muted-foreground">{message}</p>

      {state === "ready" && (
        <Button variant="primary" className="mt-6 w-full" onClick={handleDownload} disabled={busy}>
          <Download className="h-4 w-4" /> {busy ? "Decrypting…" : `Download "${link.fileName}"`}
        </Button>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        Decrypted in your browser · access checked on Sui via Tatum
      </p>
    </div>
  );
}