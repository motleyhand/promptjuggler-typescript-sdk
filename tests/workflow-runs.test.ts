import { describe, expect, test } from 'vitest';
import { BASE, jsonResponse, mock, sentBody } from './helpers';

describe('runWorkflow', () => {
  test('POSTs to the workflow runs endpoint', async () => {
    const { pj, calls } = mock(() => jsonResponse({ id: 'wfrun1' }));

    await pj.runWorkflow('onboarding', 'production', { email: 'a@b.com' }, { metadata: { tags: ['x'] } });

    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe(`${BASE}/api/v1/workflows/onboarding/production/runs`);
    expect(sentBody(calls[0])).toEqual({
      inputs: { email: 'a@b.com' },
      metadata: { tags: ['x'] },
    });
  });
});

describe('getWorkflowRun', () => {
  test('GETs the workflow run by ID', async () => {
    const { pj, calls } = mock(() => jsonResponse({ id: 'wfrun1', status: 'running' }));

    await pj.getWorkflowRun('wfrun1');

    expect(calls[0].method).toBe('GET');
    expect(calls[0].url).toBe(`${BASE}/api/v1/workflowruns/wfrun1`);
  });
});
