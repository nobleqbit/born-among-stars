// The "cyber" half: a SHA-256 signature of the date + occasion.
//
// This is deliberately NOT meaningful — it's a fair, reproducible way to
// assign a destination so that the same date always yields the same card,
// and two people can compare passes. The meaning lives in the astronomy
// (which is real), not in the hash (which is just fair).

const subtle =
  globalThis.crypto?.subtle ??
  (await import('node:crypto')).webcrypto.subtle;

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * @param {number} jdn        Julian Day Number of the date
 * @param {string} occasion   'birthday' | 'anniversary' | 'milestone' | 'because'
 * @param {number} catalogSize
 * @returns {{ hex: string, code: string, index: number, salt: number }}
 */
export async function cosmicSignature(jdn, occasion, catalogSize) {
  const hex = await sha256Hex(`born-among-stars|${jdn}|${occasion}`);
  const index = parseInt(hex.slice(0, 8), 16) % catalogSize;
  // A second, independent slice drives small variations (quantum note, etc.)
  const salt = parseInt(hex.slice(8, 16), 16);
  const code = `${hex.slice(0, 8)}-${hex.slice(8, 16)}`.toUpperCase();
  return { hex, code, index, salt };
}
