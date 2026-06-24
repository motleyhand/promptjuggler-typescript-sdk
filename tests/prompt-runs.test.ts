import { describe, expect, test } from 'vitest';
import { BASE, jsonResponse, mock, sentBody } from './helpers';

describe('runPrompt', () => {
  test('POSTs to the runs endpoint with just inputs when no options are given', async () => {
    const { pj, calls } = mock(() => jsonResponse({ id: 'run1' }));

    await pj.runPrompt('greeting', 'production', { name: 'Ada' });

    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe(`${BASE}/api/v1/prompts/greeting/production/runs`);
    expect(calls[0].headers.get('Authorization')).toBe('Bearer test-key');
    expect(sentBody(calls[0])).toEqual({ inputs: { name: 'Ada' } });
  });

  test('serializes options, including array-valued metadata', async () => {
    const { pj, calls } = mock(() => jsonResponse({ id: 'run1' }));

    await pj.runPrompt(
      'greeting',
      1,
      { topic: 'AI safety' },
      {
        priority: 'onsite',
        thread: 'thread-1',
        environment: 'staging',
        envVars: { MY_API_KEY: 'sk-x' },
        metadata: { tags: ['a', 'b'], user_id: '42' },
        channel: 'support',
      },
    );

    expect(sentBody(calls[0])).toEqual({
      inputs: { topic: 'AI safety' },
      priority: 'onsite',
      thread: 'thread-1',
      environment: 'staging',
      envVars: { MY_API_KEY: 'sk-x' },
      metadata: { tags: ['a', 'b'], user_id: '42' },
      channel: 'support',
    });
  });

  test('omits unset optional fields from the body', async () => {
    const { pj, calls } = mock(() => jsonResponse({ id: 'run1' }));

    await pj.runPrompt('greeting', 1, { topic: 'AI' }, { priority: 'low' });

    const body = sentBody(calls[0]);
    expect(body).not.toHaveProperty('thread');
    expect(body).not.toHaveProperty('metadata');
    expect(body).not.toHaveProperty('channel');
  });
});

describe('getPromptRun', () => {
  test('GETs the run by ID', async () => {
    const { pj, calls } = mock(() => jsonResponse({ id: 'run1', status: 'completed' }));

    await pj.getPromptRun('run1');

    expect(calls[0].method).toBe('GET');
    expect(calls[0].url).toBe(`${BASE}/api/v1/promptruns/run1`);
  });
});
