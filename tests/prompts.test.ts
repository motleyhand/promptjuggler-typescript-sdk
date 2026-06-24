import { describe, expect, test } from 'vitest';
import { BASE, jsonResponse, mock } from './helpers';

const REVISION = { id: 'p1', promptId: 'pr1', memory: {}, messages: [], tools: [] };

describe('getPrompt', () => {
  test('GETs the revision by slug + string version, with bearer auth', async () => {
    const { pj, calls } = mock(() => jsonResponse(REVISION));

    await pj.getPrompt('greeting', 'production');

    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe('GET');
    expect(calls[0].url).toBe(`${BASE}/api/v1/prompts/greeting/production`);
    expect(calls[0].headers.get('Authorization')).toBe('Bearer test-key');
  });

  test('accepts a numeric version', async () => {
    const { pj, calls } = mock(() => jsonResponse(REVISION));

    await pj.getPrompt('greeting', 42);

    expect(calls[0].url).toBe(`${BASE}/api/v1/prompts/greeting/42`);
  });
});
