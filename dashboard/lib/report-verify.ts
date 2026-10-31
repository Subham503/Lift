/**
 * Cryptographic verification for evaluation reports.
 * Computes SHA-256 digest of report contents and validates against declared header.
 * Shows "Verified report" only if recomputed digest matches. Otherwise "Generated".
 */

export async function computeSha256(text: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return "";
}

export async function verifyReportDigest(content: string): Promise<{
  isVerified: boolean;
  computedDigest: string;
  expectedDigest: string;
}> {
  // Look for declared digest line: "- Digest: sha256:<hex>" or "Digest: <hex>"
  const match = content.match(/^[ \t]*-[ \t]*Digest:[ \t]*(?:sha256:)?([a-fA-F0-9]{64})/m);

  if (!match) {
    return {
      isVerified: false,
      computedDigest: "",
      expectedDigest: "",
    };
  }

  const expectedDigest = match[1].toLowerCase();

  // Strip the digest line from content to compute deterministic content hash
  const strippedContent = content
    .replace(/^[ \t]*-[ \t]*Digest:[ \t]*(?:sha256:)?[a-fA-F0-9]{64}[ \t]*\r?\n?/m, "")
    .trim();

  const computedDigest = await computeSha256(strippedContent);
  const isVerified = computedDigest.toLowerCase() === expectedDigest;

  return {
    isVerified,
    computedDigest,
    expectedDigest,
  };
}

