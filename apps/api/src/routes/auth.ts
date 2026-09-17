import type { FastifyInstance } from 'fastify';
import { LoginRequestSchema, type HealthResponse } from '@notebook/shared';
import type { AppContext } from '../context.ts';
import { publicLlmInfo } from '../config.ts';
import { fail, parseBody } from './helpers.ts';

export const APP_VERSION = '0.1.0';

export function registerAuthRoutes(app: FastifyInstance, ctx: AppContext): void {
  app.post('/v1/auth/login', (request, reply) => {
    const body = parseBody(LoginRequestSchema, request, reply);
    if (body === null) return reply;
    const session = ctx.auth.login(body.username, body.password);
    if (session === null) {
      return fail(reply, 401, 'unauthorized', 'Benutzername oder Passwort stimmt nicht.');
    }
    return session;
  });

  /** Offen zugaenglich: sagt, ob der Server laeuft und ob ein Modell verbunden
   *  ist - ohne Basis-URL und ohne Schluessel. */
  app.get('/v1/health', () => {
    return {
      status: 'ok',
      version: APP_VERSION,
      llm: publicLlmInfo(ctx.config),
    } satisfies HealthResponse;
  });
}
