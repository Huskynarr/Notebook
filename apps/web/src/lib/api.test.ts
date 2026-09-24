import { afterEach, describe, expect, it, vi } from 'vitest';
import { uebersetzen } from '../i18n/index.ts';
import { ApiClient } from './api.ts';

const client = new ApiClient(
  () => null,
  (key, params) => uebersetzen('de', key, params),
  '',
);
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('API login rejection contract', () => {
  it('honors cooldown metadata even when CORS hides the Retry-After header', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: 'rate_limited',
              message: 'Pause',
              retryAfterSeconds: 30,
              retryAt: '2030-01-01T00:00:00Z',
            },
          }),
          { status: 429, headers: { 'content-type': 'application/json' } },
        ),
      ),
    );
    await expect(client.login('name', 'invalid')).rejects.toMatchObject({
      status: 429,
      retryAfterSeconds: 30,
    });
    expect(fetch).toHaveBeenCalledWith(
      '/v1/auth/login',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('honors a longer Retry-After header and never converts network errors into credential failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { code: 'rate_limited', message: 'Pause', retryAfterSeconds: 30 },
          }),
          { status: 429, headers: { 'retry-after': '60' } },
        ),
      ),
    );
    await expect(client.login('name', 'invalid')).rejects.toMatchObject({
      status: 429,
      retryAfterSeconds: 60,
    });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network')));
    await expect(client.login('name', 'invalid')).rejects.toMatchObject({
      status: 0,
      code: 'network',
      retryAfterSeconds: 0,
    });
  });
});

describe('API health contract', () => {
  it('shows an explicitly blocked model while accepting older health responses', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          status: 'ok',
          version: '0.1.0',
          llm: {
            configured: false,
            provider: 'openai',
            model: 'mimo-v2.6-flash-free',
            accessBlocked: true,
          },
        }),
        { status: 200 },
      ),
    );
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          status: 'ok',
          version: '0.1.0',
          llm: { configured: true, provider: 'openai', model: 'local-model' },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(client.health()).resolves.toMatchObject({
      llm: { accessBlocked: true, model: 'mimo-v2.6-flash-free' },
    });
    await expect(client.health()).resolves.toMatchObject({
      llm: { configured: true, model: 'local-model' },
    });
  });
});

describe('model selection request', () => {
  it('sends the selected free model with the question and omits it for legacy requests', async () => {
    const fetched = vi.fn().mockImplementation(() =>
      Promise.resolve(
        Response.json({
          answer: 'Nicht belegt.',
          citations: [],
          retrieved: [],
          grounded: false,
          unsupportedSentenceCount: 0,
          droppedMarkers: [],
          simulated: false,
          model: 'test',
          elapsedMs: 0,
        }),
      ),
    );
    vi.stubGlobal('fetch', fetched);
    await client.ask('notebook-id', 'Frage?', [], 'de', 'nvidia/nemotron-3.5-lightning:free');
    const first = fetched.mock.calls[0]?.[1] as RequestInit | undefined;
    expect(
      JSON.parse(typeof first?.body === 'string' ? first.body : '{}') as unknown,
    ).toMatchObject({
      question: 'Frage?',
      model: 'nvidia/nemotron-3.5-lightning:free',
    });
    await client.ask('notebook-id', 'Frage?', [], 'de');
    const second = fetched.mock.calls[1]?.[1] as RequestInit | undefined;
    expect(
      JSON.parse(typeof second?.body === 'string' ? second.body : '{}') as Record<string, unknown>,
    ).not.toHaveProperty('model');
  });
});
