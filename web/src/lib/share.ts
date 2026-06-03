import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID, MODULE } from "./constants";
import { tatumClient } from "./tatum";

// Builds (but does not sign/send) a transaction that calls
// create_share(blob_id, expiry_ms) on your published contract.
export function buildCreateShareTx(blobId: string, expiryMs: number): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULE}::create_share`,
    arguments: [
      tx.pure.string(blobId),
      tx.pure.u64(expiryMs),
    ],
  });
  return tx;
}

// Given a transaction digest, ask Tatum for the object it created and
// return the new Share object's ID. Retries briefly since the fullnode
// may take a moment to index a just-submitted transaction.
export async function findCreatedShareId(digest: string): Promise<string | null> {
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const res: any = await tatumClient.core.getTransaction({
        digest,
        include: { objectChanges: true, effects: true },
      } as any);
      console.log("getTransaction result:", res);

      const tx = res.Transaction ?? res;
      const changes: any[] =
        tx.objectChanges ??
        tx.effects?.changedObjects ??
        tx.effects?.created ??
        [];

      const created = changes.find((c: any) => {
        const op = c.idOperation ?? c.type ?? c.outputState?.$kind;
        return (
          op === "Created" ||
          op === "created" ||
          c.outputState?.$kind === "ObjectWrite" ||
          (!c.inputState && c.outputState)
        );
      });

      const id =
        created?.objectId ??
        created?.id ??
        created?.reference?.objectId ??
        null;
      if (id) return id;
    } catch (e) {
      console.log(`findCreatedShareId attempt ${attempt} failed:`, e);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return null;
}

export interface ShareRecord {
  blobId: string;
  owner: string;
  expiryMs: number;
  revoked: boolean;
}

// Read a Share object via Tatum's JSON-RPC (sui_getObject with showContent),
// which returns already-decoded Move struct fields (no BCS to parse).
export async function readShare(shareId: string): Promise<ShareRecord | null> {
  const res: any = await tatumClient.call("sui_getObject", [
    shareId,
    { showContent: true },
  ]);
  console.log("readShare raw:", res);

  const fields = res?.data?.content?.fields ?? null;
  if (!fields) return null;

  return {
    blobId: fields.blob_id,
    owner: fields.owner,
    expiryMs: Number(fields.expiry_ms),
    revoked: Boolean(fields.revoked),
  };
}
// Build a transaction that calls revoke(share) on a Share you own.
export function buildRevokeTx(shareId: string): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULE}::revoke`,
    arguments: [tx.object(shareId)],
  });
  return tx;
}

export interface OwnedShare {
  shareId: string;
  blobId: string;
  expiryMs: number;
  revoked: boolean;
}

// List all Share objects owned by an address, via Tatum JSON-RPC.
export async function listMyShares(owner: string): Promise<OwnedShare[]> {
  const res: any = await tatumClient.call("suix_getOwnedObjects", [
    owner,
    {
      filter: { StructType: `${PACKAGE_ID}::${MODULE}::Share` },
      options: { showContent: true },
    },
  ]);
  console.log("listMyShares raw:", res);

  const items: any[] = res?.data ?? [];
  return items
    .map((it) => {
      const fields = it?.data?.content?.fields;
      if (!fields) return null;
      return {
        shareId: it.data.objectId,
        blobId: fields.blob_id,
        expiryMs: Number(fields.expiry_ms),
        revoked: Boolean(fields.revoked),
      } as OwnedShare;
    })
    .filter((x): x is OwnedShare => x !== null);
}