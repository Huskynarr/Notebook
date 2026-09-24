import { handleApi } from './api.ts';
import type { SiteEnv } from './db.ts';

export default {
  async fetch(request: Request, env: SiteEnv): Promise<Response> {
    if (new URL(request.url).pathname.startsWith('/v1/')) return handleApi(request, env);
    if (!env.ASSETS) return new Response('Assets unavailable', { status: 503 });
    const result = await env.ASSETS.fetch(request);
    const headers = new Headers(result.headers);
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'no-referrer');
    headers.set('X-Frame-Options', 'DENY');
    headers.set(
      'Content-Security-Policy',
      "default-src 'self'; connect-src 'self'; img-src 'self' data: blob:; " +
        "script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; " +
        "object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    );
    return new Response(result.body, {
      status: result.status,
      statusText: result.statusText,
      headers,
    });
  },
};
