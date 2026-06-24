import { describe, expect, test } from 'vitest';
import { ApiError, PromptJugglerError } from '../lib';
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
});
