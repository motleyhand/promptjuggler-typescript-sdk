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

  // The API adds fields and enum values without a major version, so a published client must
  // decode a response carrying ones it doesn't know.
  test('decodes fields and enum values newer than the SDK', async () => {
    const { pj } = mock(() =>
      jsonResponse({
        ...REVISION,
        model: 'gpt-9',
        modelParams: { reasoningEffort: 'ultra' },
        responseFormat: { type: 'text', addedLater: 1 },
        tools: [
          {
            type: 'http',
            name: 'lookup',
            url: 'https://example.com',
            method: 'QUERY',
            paramsSchema: '{}',
            failFast: false,
          },
        ],
        addedLater: true,
      }),
    );

    const prompt = await pj.getPrompt('greeting', 'production');

    expect(prompt.model).toBe('gpt-9');
    expect(prompt.modelParams.reasoningEffort).toBe('ultra');
    expect(prompt.tools[0]).toMatchObject({ type: 'http', method: 'QUERY' });
  });
});
