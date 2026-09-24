import { describe, expect, test } from 'vitest';
import { ApiError, ConnectionError, DecodeError, PromptJugglerError } from '../lib';
import { jsonResponse, mock } from './helpers';

describe('error translation', () => {
  test('turns a non-2xx response into an ApiError with status + server message', async () => {
    const { pj } = mock(() => jsonResponse({ error: 'Prompt run not found' }, 404));

    const error = await pj.getPromptRun('missing').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).statusCode).toBe(404);
    expect((error as ApiError).message).toBe('Prompt run not found');
  });

  test('ApiError is a PromptJugglerError so the whole surface can be caught at once', async () => {
    const { pj } = mock(() => jsonResponse({ error: 'boom' }, 500));

    const error = await pj.getPromptRun('x').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(PromptJugglerError);
  });

  test('falls back to a generic message when the error body is not JSON', async () => {
    const { pj } = mock(() => new Response('<html>oops</html>', { status: 502 }));

    const error = await pj.getPromptRun('x').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).statusCode).toBe(502);
    expect((error as ApiError).message).not.toBe('');
  });

  test('wraps a success response whose body does not decode in a DecodeError', async () => {
    const { pj } = mock(() =>
      jsonResponse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        promptId: '550e8400-e29b-41d4-a716-446655440001',
        memory: 'stateless',
        provider: 'openai',
        model: 'gpt-4o',
        modelParams: {},
        responseFormat: { type: 'text' },
        messages: [],
        tools: 'not-a-list',
      }),
    );

    const error = await pj.getPrompt('greeting', 'production').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(DecodeError);
    expect(error).toBeInstanceOf(PromptJugglerError);
  });

  test('wraps a network failure (no response) in a ConnectionError', async () => {
    const { pj } = mock(() => {
      throw new Error('getaddrinfo ENOTFOUND promptjuggler.com');
    });

    const error = await pj.getPromptRun('x').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ConnectionError);
    expect(error).toBeInstanceOf(PromptJugglerError);
    expect((error as ConnectionError).message).toContain('ENOTFOUND');
  });
});
