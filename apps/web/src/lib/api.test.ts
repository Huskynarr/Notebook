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
