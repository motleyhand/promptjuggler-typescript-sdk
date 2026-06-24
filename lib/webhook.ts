/**
 * Verifies a PromptJuggler webhook signature. PromptJuggler signs each delivery with
 * the `PromptJuggler-Signature` header (`t=<unix-ts>,v1=<hex-hmac>`); the HMAC-SHA256
 * is computed over `<timestamp>.<raw-body>`.
 *
 * Uses the Web Crypto API (`crypto.subtle`, a global in Node 22+, edge runtimes, and
 * browsers), so it adds no Node-only dependency to the package.
 *
 * @param payload         The raw request body, exactly as received (verify before JSON parsing).
 * @param signatureHeader The `PromptJuggler-Signature` header value.
 * @param secret          The webhook signing secret.
 * @param tolerance       Max age, in seconds, of the signature timestamp (replay window). Defaults to 300.
 * @param now             Current Unix time in seconds. Defaults to the system clock (override for testing).
 * @returns Whether `signatureHeader` is a valid signature for `payload`.
 */
export async function verifyWebhookSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
  tolerance = 300,
  now = Math.floor(Date.now() / 1000),
): Promise<boolean> {
  const parsed = parseSignatureHeader(signatureHeader);
  if (!parsed) {
    return false;
  }

  if (Math.abs(now - parsed.timestamp) > tolerance) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${parsed.timestamp}.${payload}`),
  );

  return constantTimeEquals(toHex(mac), parsed.signature);
}

function parseSignatureHeader(header: string): { timestamp: number; signature: string } | null {
  const fields = new Map<string, string>();
  for (const part of header.split(',')) {
    const eq = part.indexOf('=');
    if (eq !== -1) {
      fields.set(part.slice(0, eq).trim(), part.slice(eq + 1).trim());
    }
  }

  const timestamp = Number(fields.get('t'));
  const signature = fields.get('v1');
  if (!signature || !Number.isInteger(timestamp)) {
    return null;
  }

  return { timestamp, signature };
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return diff === 0;
}
