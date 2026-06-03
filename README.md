# 🌊 Tidelock

**File sharing you control.** Encrypt files in your browser, store them on [Walrus](https://www.walrus.xyz/), and control access on [Sui](https://sui.io/) — revoke any time. No platform can override you.

Built for the **Tatum x Walrus Hackathon**.

🔗 **Live demo:** _<add your deployed URL here>_
📺 **Demo video:** _<add your video link here>_

---

## The problem

When you share a file through WeTransfer, Dropbox, or Google Drive, the *platform* controls it. They decide when your link expires, they can delete your file, and they can read it. You're trusting a company not to lose, leak, or lock you out of your own data.

## What Tidelock does

Tidelock flips that around. The file is encrypted in your browser before it ever leaves your device, stored on decentralized Walrus storage, and its access rules live on-chain on Sui — owned by you. Only you can revoke a share or let it expire, and no central server can take the file down or read it.

The recipient needs **no wallet and no account** — they just open a link.

## How it works
SENDER                                              RECIPIENT
  |                                                     |
  |-- 1. Encrypt file in browser (AES-GCM, Web Crypto)  |
  |-- 2. Upload ciphertext to Walrus  --> blob ID       |
  |-- 3. create_share() on Sui  --> Share object        |
  |       { blob_id, owner, expiry, revoked }            |
  |-- 4. Build link:  ...#share=<id>&k=<key>             |
  |       (key lives in the URL fragment, never sent     |
  |        to any server)                                |
  |                                                       |
  +---------------- share link ------------------------> |
                                                          |-- 5. Read Share on Sui via Tatum RPC
                                                          |       -> check revoked / expiry
                                                          |-- 6. Fetch ciphertext from Walrus
                                                          +-- 7. Decrypt in browser, download


When the owner calls `revoke()`, step 5 fails for everyone — the link instantly stops working.

## Why each technology is load-bearing

This isn't a generic dApp with a blockchain bolted on. Remove any one piece and the product breaks:

- **Walrus** stores the actual encrypted file. Not a hash, not a pointer — the real ciphertext blob lives on Walrus, and retrieval *is* the download. This is the storage layer the whole product is built on.
- **Sui** holds the access registry. Each share is a Move object you own, recording the Walrus blob ID, an expiry, and a revoked flag. Ownership is what makes "only you can revoke" true — it's enforced by Sui's object model, not by our server.
- **Tatum** is the RPC gateway for every on-chain read: confirming a freshly minted share, listing your shares, and — most importantly — the recipient-side access check before any file is decrypted.

## Tech stack

- **Smart contract:** Move (Sui), one `Share` module — `create_share`, `revoke`
- **Frontend:** React + TypeScript + Vite, Tailwind CSS v4
- **Wallet & signing:** `@mysten/dapp-kit-react`
- **On-chain reads:** `@mysten/sui` JSON-RPC client pointed at Tatum's Sui gateway
- **Storage:** Walrus HTTP API (publisher / aggregator)
- **Encryption:** Web Crypto API (AES-GCM 256-bit), entirely client-side

## On-chain details (Sui testnet)

- **Package ID:** `0x23532b39364ddb42e86dbcfcb4503a14299e94b7d2fc2b53045453c1e76e0a97`
- **Module:** `share`
- **Network:** Sui Testnet

## The `Share` contract

```move
public struct Share has key, store {
    id: UID,
    blob_id: String,   // where the encrypted file lives on Walrus
    owner: address,    // who can revoke
    expiry_ms: u64,    // 0 = never expires
    revoked: bool,
}

public fun create_share(blob_id: String, expiry_ms: u64, ctx: &mut TxContext) { /* ... */ }
public fun revoke(share: &mut Share, ctx: &TxContext) { /* owner-only */ }
```

## Running locally

```bash
# 1. Contract (already deployed to testnet; only needed to redeploy)
cd contracts
sui move build
sui client publish --gas-budget 100000000

# 2. Frontend
cd web
npm install

# Create web/.env.local with your Tatum testnet API key:
echo "VITE_TATUM_API_KEY=your_tatum_testnet_key" > .env.local

npm run dev
```

A free Tatum API key is available at [dashboard.tatum.io](https://dashboard.tatum.io). The app reads on-chain data through Tatum's Sui testnet gateway (`https://sui-testnet.gateway.tatum.io`).

## Security model — honest disclosure

Tidelock's access control is **app-enforced, not cryptographically enforced**. The app checks the on-chain `revoked`/`expiry` state before fetching and decrypting a file, and the decryption key never touches a server (it lives in the URL fragment). This is meaningful protection for the intended use case, and revocation genuinely prevents access through the app.

However: a recipient who already opened a valid link and saved both the blob and the key could decrypt the file offline, bypassing the on-chain check. True cryptographic enforcement would require gating decryption itself on the on-chain policy.

**Future work:** integrate [Seal](https://github.com/MystenLabs/seal) (Mysten Labs' on-chain-gated decryption) so the decryption key is only released when the Sui access policy says so — making revocation cryptographically binding, not just app-binding.

## Limitations

- Public Walrus testnet publisher caps blobs at ~10 MiB; demo with images / PDFs / small files.
- Built and tested on Sui Testnet.
- The Vite dev proxy used for Tatum requests is replaced by a serverless function in production.

## Acknowledgements

Built with [Sui](https://sui.io/), [Walrus](https://www.walrus.xyz/), and [Tatum](https://tatum.io/) for the Tatum x Walrus Hackathon.
Build by Mahesh Vishwakarma 
