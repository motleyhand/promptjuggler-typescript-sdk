import { describe, expect, test } from 'vitest';
import { BASE, jsonResponse, mock } from './helpers';

describe('getKnowledgeDocument', () => {
  test('GETs the document by ID', async () => {
    const { pj, calls } = mock(() => jsonResponse({ id: 'doc1', status: 'ready' }));

    await pj.getKnowledgeDocument('doc1');

    expect(calls[0].method).toBe('GET');
    expect(calls[0].url).toBe(`${BASE}/api/v1/knowledge-documents/doc1`);
  });
});

describe('deleteKnowledgeDocument', () => {
  test('DELETEs the document by ID', async () => {
    const { pj, calls } = mock(() => new Response(null, { status: 204 }));

    await pj.deleteKnowledgeDocument('doc1');

    expect(calls[0].method).toBe('DELETE');
    expect(calls[0].url).toBe(`${BASE}/api/v1/knowledge-documents/doc1`);
    expect(calls[0].headers.get('Authorization')).toBe('Bearer test-key');
  });
});
