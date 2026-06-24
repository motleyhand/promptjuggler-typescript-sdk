import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verifies a PromptJuggler webhook signature. PromptJuggler signs each delivery with
 * the `PromptJuggler-Signature` header (`t=<unix-ts>,v1=<hex-hmac>`); the HMAC-SHA256
 * is computed over `<timestamp>.<raw-body>`.
 *
 * @param payload         The raw request body, exactly as received (verify before JSON parsing).
 * @param signatureHeader The `PromptJuggler-Signature` header value.
 * @param secret          The webhook signing secret.
 * @param tolerance       Max age, in seconds, of the signature timestamp (replay window). Defaults to 300.
 * @param now             Current Unix time in seconds. Defaults to the system clock (override for testing).
 * @returns Whether `signatureHeader` is a valid signature for `payload`.
 */
export function verifyWebhookSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
  tolerance = 300,
  now = Math.floor(Date.now() / 1000),
): boolean {
  const parsed = parseSignatureHeader(signatureHeader);
  if (!parsed) {
    return false;
  }

  if (Math.abs(now - parsed.timestamp) > tolerance) {
    return false;
  }

  const expected = createHmac('sha256', secret).update(`${parsed.timestamp}.${payload}`).digest('hex');

  return constantTimeEquals(expected, parsed.signature);
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

function constantTimeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}
