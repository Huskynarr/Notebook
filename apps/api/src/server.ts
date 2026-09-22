import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import type { ApiError } from '@notebook/shared';
import { RequestQuota } from './requestQuota.ts';
import type { AppContext } from './context.ts';
import { bearerToken } from './auth.ts';
import { fail } from './routes/helpers.ts';
import { registerAskRoutes } from './routes/ask.ts';
import { registerAuthRoutes } from './routes/auth.ts';
import { registerNoteRoutes } from './routes/notes.ts';
import { registerNotebookRoutes } from './routes/notebooks.ts';
import { registerSourceRoutes } from './routes/sources.ts';

/** Pfade ohne Anmeldung. Alles Uebrige verlangt ein gueltiges Token. */
const PUBLIC_PATHS = new Set(['/v1/auth/login', '/v1/health']);

export async function buildServer(ctx: AppContext): Promise<FastifyInstance> {
  const quota = new RequestQuota();
  const app = Fastify({
    // Im Test still: die Zugriffsprotokolle wuerden echte Testausgaben verdecken.
    logger:
      process.env['VITEST'] === undefined
        ? {
            level: process.env['LOG_LEVEL'] ?? 'info',
            timestamp: () => `,"time":"${new Date().toISOString()}"`,
            redact: ['req.headers.authorization', 'req.headers.cookie', 'req.body.password'],
          }
        : false,
    bodyLimit: 1024 * 1024,
    trustProxy: ctx.config.TRUST_PROXY.length === 0 ? false : ctx.config.TRUST_PROXY,
    requestTimeout: 120_000,
    connectionTimeout: ctx.config.LLM_TIMEOUT_MS + 10_000,
  });

  await app.register(cors, {
    origin: ctx.config.CORS_ORIGIN.split(',').map((o) => o.trim()),
    credentials: false,
    exposedHeaders: ['Retry-After'],
    // Ausdruecklich aufzaehlen: die Vorgabe deckt PATCH und DELETE nicht ab,
    // wodurch jede Aenderung an Quellen und Notizen schon am Preflight
    // scheiterte. Geprueft durch 'erlaubt PATCH und DELETE im Preflight'.
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['content-type', 'authorization'],
    maxAge: 86_400,
  });

  app.addHook('onRequest', (request, reply, done) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('Cache-Control', 'no-store');
    reply.header('Referrer-Policy', 'no-referrer');
    if (request.method === 'OPTIONS' || PUBLIC_PATHS.has(request.url.split('?')[0] ?? '')) {
      done();
      return;
    }
    if (!ctx.auth.verify(bearerToken(request.headers.authorization))) {
      void fail(reply, 401, 'unauthorized', 'Anmeldung erforderlich.');
      return;
    }
    const retryAfterSeconds = quota.consume(request.ip);
    if (retryAfterSeconds !== null) {
      void reply
        .status(429)
        .header('Retry-After', retryAfterSeconds)
        .send({
          error: {
            code: 'rate_limited',
            message: 'Zu viele Anfragen. Bitte kurz warten.',
            retryAfterSeconds,
            retryAt: new Date(Date.now() + retryAfterSeconds * 1000).toISOString(),
          },
        } satisfies ApiError);
      return;
    }
    done();
  });

  app.setErrorHandler((error, request, reply) => {
    const status =
      typeof error === 'object' && error !== null && 'statusCode' in error
        ? error.statusCode
        : undefined;
    if (status === 413) {
      return fail(
        reply,
        413,
        'payload_too_large',
        'Die Anfrage ist zu groß. Quellen sind auf 10 MiB begrenzt.',
      );
    }
    if (status === 400 || status === 415) {
      return fail(
        reply,
        status,
        'validation_failed',
        'Ungültige Anfrage oder nicht unterstütztes Datenformat.',
      );
    }
    request.log.error({ err: error }, 'Unbehandelter Fehler');
    // Der Fehlertext geht bewusst nicht an den Client: er koennte Pfade oder
    // Konfigurationswerte enthalten.
    return fail(reply, 500, 'internal', 'Unerwarteter Fehler im Backend.');
  });

  registerAuthRoutes(app, ctx);
  registerNotebookRoutes(app, ctx);
  registerSourceRoutes(app, ctx);
  registerNoteRoutes(app, ctx);
  registerAskRoutes(app, ctx);

  return app;
}
