import type { FastifyInstance, FastifyReply } from 'fastify';
import { LoginRequestSchema, type ApiError, type HealthResponse } from '@notebook/shared';
import type { AppContext } from '../context.ts';
import { publicLlmInfo } from '../config.ts';
import type { LoginCooldown } from '../loginThrottle.ts';
import { fail, parseBody } from './helpers.ts';

export const APP_VERSION = '0.1.0';

export function registerAuthRoutes(app: FastifyInstance, ctx: AppContext): void {
  app.post('/v1/auth/login', { bodyLimit: 8 * 1024 }, (request, reply) => {
    const body = parseBody(LoginRequestSchema, request, reply);
    if (body === null) return reply;
    const account = ctx.auth.hasUsername(body.username) ? body.username : null;
    const cooldown = ctx.loginThrottle.check(request.ip, account);
    if (cooldown !== null) {
      request.log.warn({ event: 'auth_rate_limited', ip: request.ip }, 'Login gedrosselt');
      return rateLimited(reply, cooldown);
    }
    const session = ctx.auth.login(body.username, body.password);
    if (session === null) {
      request.log.warn({ event: 'auth_failed', ip: request.ip }, 'Login fehlgeschlagen');
      const nextCooldown = ctx.loginThrottle.failure(request.ip, account);
      if (nextCooldown !== null) return rateLimited(reply, nextCooldown);
      return fail(reply, 401, 'unauthorized', 'Benutzername oder Passwort stimmt nicht.');
    }
    ctx.loginThrottle.success(request.ip, body.username);
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

function rateLimited(reply: FastifyReply, cooldown: LoginCooldown): FastifyReply {
  return reply
    .status(429)
    .header('Retry-After', cooldown.retryAfterSeconds)
    .send({
      error: {
        code: 'rate_limited',
        message: 'Zu viele fehlgeschlagene Anmeldungen. Bitte die Wartezeit abwarten.',
        ...cooldown,
      },
    } satisfies ApiError);
}
