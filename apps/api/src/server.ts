import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
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
  const app = Fastify({
    // Im Test still: die Zugriffsprotokolle wuerden echte Testausgaben verdecken.
    logger:
      process.env['VITEST'] === undefined ? { level: process.env['LOG_LEVEL'] ?? 'info' } : false,
    bodyLimit: 4 * 1024 * 1024,
  });

  await app.register(cors, {
    origin: ctx.config.CORS_ORIGIN.split(',').map((o) => o.trim()),
    credentials: false,
  });

  app.addHook('onRequest', (request, reply, done) => {
    if (request.method === 'OPTIONS' || PUBLIC_PATHS.has(request.url.split('?')[0] ?? '')) {
      done();
      return;
    }
    if (!ctx.auth.verify(bearerToken(request.headers.authorization))) {
      void fail(reply, 401, 'unauthorized', 'Anmeldung erforderlich.');
      return;
    }
    done();
  });

  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, 'Unbehandelter Fehler');
    // Der Fehlertext geht bewusst nicht an den Client: er koennte Pfade oder
    // Konfigurationswerte enthalten.
    void fail(reply, 500, 'internal', 'Unerwarteter Fehler im Backend.');
  });

  registerAuthRoutes(app, ctx);
  registerNotebookRoutes(app, ctx);
  registerSourceRoutes(app, ctx);
  registerNoteRoutes(app, ctx);
  registerAskRoutes(app, ctx);

  return app;
}
