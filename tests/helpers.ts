import { PromptJuggler } from '../lib';

export interface Capture {
  url: string;
  method: string;
  headers: Headers;
  body: BodyInit | null | undefined;
}

/**
 * Builds a {@link PromptJuggler} backed by a mock `fetch` that records every request
 * and replies with `responder`'s response. The returned `calls` array lets a test
 * assert the exact method, URL, headers, and body the SDK put on the wire.
 */
export function mock(responder: (request: Capture) => Response | Promise<Response> = () => jsonResponse({})) {
  const calls: Capture[] = [];
  const fetchApi: typeof fetch = async (input, init) => {
    const request: Capture = {
      url: typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
      method: init?.method ?? 'GET',
      headers: new Headers(init?.headers),
      body: init?.body,
    };
    calls.push(request);

    return responder(request);
  };

  return { pj: new PromptJuggler('test-key', { fetch: fetchApi }), calls };
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function sentBody(capture: Capture): Record<string, unknown> {
  return JSON.parse(capture.body as string) as Record<string, unknown>;
}

export const BASE = 'https://promptjuggler.com';
