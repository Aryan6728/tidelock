// src/lib/walrus.ts
// Tidelock's storage layer: encrypt a file in the browser, store the
// ciphertext on Walrus, then reverse it to get the original file back.

const PUBLISHER = "https://publisher.walrus-testnet.walrus.space";
const AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space";
const EPOCHS = 5;

// Guarantees a Uint8Array backed by a plain ArrayBuffer (not SharedArrayBuffer),
// which is what Web Crypto and fetch expect. Satisfies strict TypeScript.
function toBufferSource(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return copy as Uint8Array<ArrayBuffer>;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  let s = value.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const binary = atob(s);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out as Uint8Array<ArrayBuffer>;
}

export interface UploadResult {
  blobId: string;
  key: string;
  fileName: string;
  mimeType: string;
}

export async function encryptAndUpload(file: File): Promise<UploadResult> {
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const plaintext = toBufferSource(new Uint8Array(await file.arrayBuffer()));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: toBufferSource(iv) }, key, plaintext),
  );

  const payload = new Uint8Array(iv.length + ciphertext.length);
  payload.set(iv, 0);
  payload.set(ciphertext, iv.length);

  const res = await fetch(`${PUBLISHER}/v1/blobs?epochs=${EPOCHS}`, {
    method: "PUT",
    body: toBufferSource(payload),
  });
  if (!res.ok) throw new Error(`Walrus upload failed (${res.status})`);
  const json = await res.json();

  const blobId =
    json?.newlyCreated?.blobObject?.blobId ?? json?.alreadyCertified?.blobId;
  if (!blobId) throw new Error("Walrus response had no blobId");

  const rawKey = new Uint8Array(await crypto.subtle.exportKey("raw", key));

  return {
    blobId,
    key: bytesToBase64Url(rawKey),
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
  };
}

export async function downloadAndDecrypt(
  blobId: string,
  keyBase64: string,
  mimeType = "application/octet-stream",
): Promise<Blob> {
  const res = await fetch(`${AGGREGATOR}/v1/blobs/${blobId}`);
  if (!res.ok) throw new Error(`Walrus download failed (${res.status})`);
  const payload = new Uint8Array(await res.arrayBuffer());

  const iv = toBufferSource(payload.slice(0, 12));
  const ciphertext = toBufferSource(payload.slice(12));

  const key = await crypto.subtle.importKey(
    "raw",
    base64UrlToBytes(keyBase64),
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext,
  );
  return new Blob([plaintext], { type: mimeType });
}