import { createHmac } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import { verifyWebhookSignature } from '../lib';

const SECRET = 'whsec_test';
const PAYLOAD = '{"event":"promptrun.finished","id":"run1"}';
const TIMESTAMP = 1_700_000_000;

function header(payload: string, secret: string, timestamp: number): string {
  const signature = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');

  return `t=${timestamp},v1=${signature}`;
}

describe('verifyWebhookSignature', () => {
  test('accepts a correctly signed payload', () => {
    expect(verifyWebhookSignature(PAYLOAD, header(PAYLOAD, SECRET, TIMESTAMP), SECRET, 300, TIMESTAMP)).toBe(
      true,
    );
  });

  test('rejects a tampered payload', () => {
    const signed = header(PAYLOAD, SECRET, TIMESTAMP);

    expect(verifyWebhookSignature(`${PAYLOAD} `, signed, SECRET, 300, TIMESTAMP)).toBe(false);
  });

  test('rejects a wrong secret', () => {
    const signed = header(PAYLOAD, SECRET, TIMESTAMP);

    expect(verifyWebhookSignature(PAYLOAD, signed, 'whsec_wrong', 300, TIMESTAMP)).toBe(false);
  });

  test('rejects a timestamp outside the tolerance window', () => {
    const signed = header(PAYLOAD, SECRET, TIMESTAMP);

    expect(verifyWebhookSignature(PAYLOAD, signed, SECRET, 300, TIMESTAMP + 301)).toBe(false);
  });

  test('accepts a timestamp at the edge of the tolerance window', () => {
    const signed = header(PAYLOAD, SECRET, TIMESTAMP);

    expect(verifyWebhookSignature(PAYLOAD, signed, SECRET, 300, TIMESTAMP + 300)).toBe(true);
  });

  test('rejects a malformed header', () => {
    expect(verifyWebhookSignature(PAYLOAD, 'not-a-signature', SECRET, 300, TIMESTAMP)).toBe(false);
  });
});
