import { describe, expect, test } from 'vitest';
import { BASE, jsonResponse, mock } from './helpers';

const THREAD = '0198f0e2-9c3a-7c1d-8f4b-2a6d5e7c9b10';

describe('createStreamToken', () => {
  test('POSTs to the thread stream-token endpoint', async () => {
    const { pj, calls } = mock(() =>
      jsonResponse({ token: 'jwt', expiresAt: '2026-01-01T00:00:00+00:00', url: 'u' }),
    );

    await pj.createStreamToken(THREAD);

    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe(`${BASE}/api/v1/threads/${THREAD}/stream-token`);
    expect(calls[0].headers.get('Authorization')).toBe('Bearer test-key');
  });

  test('returns the token alongside the resolved stream URL', async () => {
    const url = `https://stream.promptjuggler.com/stream/${THREAD}`;
    const { pj } = mock(() =>
      jsonResponse({ token: 'jwt-value', expiresAt: '2026-01-01T00:00:00+00:00', url }),
    );

    const result = await pj.createStreamToken(THREAD);

    expect(result.token).toBe('jwt-value');
    expect(result.url).toBe(url);
    expect(result.expiresAt).toEqual(new Date('2026-01-01T00:00:00+00:00'));
  });
});
