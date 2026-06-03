import { useState, useRef } from "react";
import { useCurrentAccount, useDAppKit } from "@mysten/dapp-kit-react";
import { encryptAndUpload, type UploadResult } from "./lib/walrus";
import { buildCreateShareTx, findCreatedShareId } from "./lib/share";
import { buildShareLink } from "./lib/link";
import { Button } from "./components/ui/button";
import { UploadCloud, Lock, Database, Link2, Check, Copy } from "lucide-react";

type Phase = "idle" | "encrypting" | "storing" | "recording" | "done" | "error";

export function WalrusTest() {
  const account = useCurrentAccount();
  const dAppKit = useDAppKit();
  const inputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function processFile(file: File) {
    if (!account) {
      setError("Connect your wallet first.");
      setPhase("error");
      return;
    }
    setError("");
    setResult(null);
    setShareId(null);
    try {
      setPhase("encrypting");
      await new Promise((r) => setTimeout(r, 250));
      setPhase("storing");
      const r = await encryptAndUpload(file);
      setResult(r);

      setPhase("recording");
      const expiryMs = Date.now() + 24 * 60 * 60 * 1000;
      const tx = buildCreateShareTx(r.blobId, expiryMs);
      const res = await dAppKit.signAndExecuteTransaction({ transaction: tx });
      const digest: string = (res as any).Transaction?.digest ?? (res as any).digest;

      const id = await findCreatedShareId(digest);
      setShareId(id);
      setPhase("done");
    } catch (err) {
      setError((err as Error).message);
      setPhase("error");
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  }

  const link =
    result && shareId
      ? buildShareLink({ shareId, fileName: result.fileName, mimeType: result.mimeType, key: result.key })
      : "";

  function copyLink() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function reset() {
    setPhase("idle");
    setResult(null);
    setShareId(null);
    setError("");
  }

  const busy = phase === "encrypting" || phase === "storing" || phase === "recording";

  return (
    <div className="mx-auto max-w-xl">
      {(phase === "idle" || phase === "error") && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-14 text-center transition-all ${
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-secondary/40"
          }`}
        >
          <input ref={inputRef} type="file" className="hidden" onChange={onPick} />
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <UploadCloud className="h-7 w-7 text-primary" />
          </div>
          <p className="mt-4 text-lg font-medium">Drop a file to share</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Encrypted in your browser · stored on Walrus · access controlled on Sui
          </p>
          {phase === "error" && <p className="mt-4 text-sm text-destructive">{error}</p>}
        </div>
      )}

      {busy && (
        <div className="rounded-2xl border bg-card p-8 card-elevated">
          <Step icon={<Lock className="h-5 w-5" />} label="Encrypting in your browser" done={phase !== "encrypting"} active={phase === "encrypting"} />
          <Step icon={<Database className="h-5 w-5" />} label="Storing on Walrus" done={phase === "recording"} active={phase === "storing"} />
          <Step icon={<Link2 className="h-5 w-5" />} label="Recording access on Sui (approve in wallet)" done={false} active={phase === "recording"} />
        </div>
      )}

      {phase === "done" && result && (
        <div className="rounded-2xl border bg-card p-8 text-center card-elevated">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[oklch(0.62_0.16_155_/_0.12)]">
            <Check className="h-6 w-6 text-[oklch(0.45_0.16_155)]" />
          </div>
          <h3 className="mt-4 font-display text-xl font-semibold">Your share link is ready</h3>
          <p className="mt-1 text-sm text-muted-foreground break-all">{result.fileName}</p>

          <div className="mt-6 flex items-center gap-2 rounded-lg border bg-background p-2">
            <input readOnly value={link} onFocus={(e) => e.currentTarget.select()}
              className="flex-1 bg-transparent px-2 text-sm outline-none" />
            <Button variant="primary" onClick={copyLink}>
              {copied ? <><Check className="h-4 w-4" /> Copied</> : <><Copy className="h-4 w-4" /> Copy</>}
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            The decryption key lives only in this link — no server ever sees it.
          </p>
          {!shareId && (
            <p className="mt-2 text-xs text-warning">Confirming on-chain… (link works once confirmed)</p>
          )}

          <Button variant="ghost" className="mt-6" onClick={reset}>Share another file</Button>
        </div>
      )}
    </div>
  );
}

function Step({ icon, label, active, done }: { icon: React.ReactNode; label: string; active: boolean; done: boolean }) {
  return (
    <div className={`flex items-center gap-3 py-2 transition-opacity ${active || done ? "opacity-100" : "opacity-40"}`}>
      <div className={`flex h-9 w-9 items-center justify-center rounded-full border ${
        done ? "border-[oklch(0.62_0.16_155_/_0.4)] text-[oklch(0.45_0.16_155)]"
        : active ? "border-primary text-primary animate-pulse" : "text-muted-foreground"
      }`}>
        {done ? <Check className="h-5 w-5" /> : icon}
      </div>
      <span className="text-sm">{label}</span>
    </div>
  );
}