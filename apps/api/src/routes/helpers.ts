import type { FastifyReply, FastifyRequest } from 'fastify';
import type { z } from 'zod';
import type { ApiError } from '@notebook/shared';

export function fail(
  reply: FastifyReply,
  status: number,
  code: ApiError['error']['code'],
  message: string,
): FastifyReply {
  return reply.status(status).send({ error: { code, message } } satisfies ApiError);
}

export function notFound(reply: FastifyReply, what: string): FastifyReply {
  return fail(reply, 404, 'not_found', `${what} nicht gefunden.`);
}

/** Validiert den Anfragekoerper und antwortet bei Abweichung selbst.
 *  Gibt `null` zurueck, wenn bereits geantwortet wurde. */
export function parseBody<T>(
  schema: z.ZodType<T>,
  request: FastifyRequest,
  reply: FastifyReply,
): T | null {
  const parsed = schema.safeParse(request.body);
  if (parsed.success) return parsed.data;
  fail(
    reply,
    400,
    'validation_failed',
    parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
  );
  return null;
}

export function idParam(request: FastifyRequest, key = 'id'): string {
  const params = request.params as Record<string, string | undefined>;
  return params[key] ?? '';
}
