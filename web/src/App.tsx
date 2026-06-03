import { ConnectButton } from "@mysten/dapp-kit-react/ui";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { WalrusTest } from "./WalrusTest";
import { MyShares } from "./MyShares";
import { Receive } from "./Receive";
import { parseShareLink } from "./lib/link";
import { Waves } from "lucide-react";

function App() {
  const shareLink = parseShareLink();
  const account = useCurrentAccount();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Waves className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">Tidelock</span>
          </div>
          <ConnectButton />
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        {shareLink ? (
          <Receive link={shareLink} />
        ) : (
          <>
            <section className="mx-auto max-w-2xl text-center">
              <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Sui · Walrus · Tatum
              </div>
              <h1 className="animate-fade-up delay-1 mt-6 font-display text-5xl font-bold tracking-tight">
                File sharing <span className="text-primary">you</span> control
              </h1>
              <p className="animate-fade-up delay-2 mx-auto mt-5 max-w-lg text-lg text-muted-foreground">
                Encrypt files in your browser, store them on Walrus, and control
                access on Sui. Revoke any time — no platform can override you.
              </p>
            </section>

            <div className="animate-fade-up delay-3 mt-12 space-y-8">
              {!account && (
                <p className="text-center text-sm text-muted-foreground">
                  Connect your wallet to start sharing.
                </p>
              )}
              <WalrusTest />
              <MyShares />
            </div>
          </>
        )}
      </main>

      <footer className="mt-16 border-t py-6 text-center text-xs text-muted-foreground">
        Built on Sui · Walrus · Tatum · for the Tatum x Walrus Hackathon
      </footer>
    </div>
  );
}

export default App;