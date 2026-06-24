import { describe, expect, test } from 'vitest';
import { BASE, jsonResponse, mock } from './helpers';

describe('getKnowledgeBase', () => {
  test('GETs the knowledge base by slug', async () => {
    const { pj, calls } = mock(() => jsonResponse({ id: 'kb1', slug: 'product-docs', documents: [] }));

    await pj.getKnowledgeBase('product-docs');

    expect(calls[0].method).toBe('GET');
    expect(calls[0].url).toBe(`${BASE}/api/v1/knowledge-bases/product-docs`);
    expect(calls[0].headers.get('Authorization')).toBe('Bearer test-key');
  });
});

describe('uploadDocuments', () => {
  test('POSTs multipart with bracket-indexed fields and original filenames', async () => {
    const { pj, calls } = mock(() => jsonResponse([{ id: 'doc1' }, { id: 'doc2' }]));

    const files = [
      new File([new Uint8Array([1, 2, 3])], 'manual.pdf', { type: 'application/pdf' }),
      new File(['hello'], 'notes.txt', { type: 'text/plain' }),
    ];
    await pj.uploadDocuments('product-docs', files);

    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe(`${BASE}/api/v1/knowledge-bases/product-docs/documents`);
    expect(calls[0].headers.get('Authorization')).toBe('Bearer test-key');

    const form = calls[0].body as FormData;
    expect(form).toBeInstanceOf(FormData);

    const first = form.get('files[0]') as File;
    const second = form.get('files[1]') as File;
    expect(first.name).toBe('manual.pdf');
    expect(second.name).toBe('notes.txt');
    expect(await second.text()).toBe('hello');
  });

  test('returns the created documents', async () => {
    const { pj } = mock(() => jsonResponse([{ id: 'doc1' }, { id: 'doc2' }]));

    const docs = await pj.uploadDocuments('product-docs', [new File(['x'], 'a.txt')]);

    expect(docs).toHaveLength(2);
    expect(docs[0].id).toBe('doc1');
  });
});
