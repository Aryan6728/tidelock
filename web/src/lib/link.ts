export interface ShareLinkData {
  shareId: string;
  fileName: string;
  mimeType: string;
  key: string;
}

// Build the shareable link. Everything lives in the URL fragment (after #),
// so the key is never sent to any server.
export function buildShareLink(d: ShareLinkData): string {
  const params = new URLSearchParams({
    share: d.shareId,
    n: d.fileName,
    t: d.mimeType,
    k: d.key,
  });
  return `${window.location.origin}/#${params.toString()}`;
}

// Read share data out of the current URL fragment. Returns null if this
// isn't a share link (i.e. we should show the upload page instead).
export function parseShareLink(): ShareLinkData | null {
  const hash = window.location.hash.slice(1); // drop the leading #
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const shareId = params.get("share");
  const key = params.get("k");
  if (!shareId || !key) return null;
  return {
    shareId,
    key,
    fileName: params.get("n") || "download",
    mimeType: params.get("t") || "application/octet-stream",
  };
}