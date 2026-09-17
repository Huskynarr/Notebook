import type { FastifyInstance } from 'fastify';
import { AskRequestSchema } from '@notebook/shared';
import type { AppContext } from '../context.ts';
import { ask } from '../domain/ask.ts';
import { LlmUnavailableError } from '../llm/provider.ts';
import { fail, idParam, notFound, parseBody } from './helpers.ts';

export function registerAskRoutes(app: FastifyInstance, ctx: AppContext): void {
  app.post('/v1/notebooks/:id/ask', async (request, reply) => {
    const notebookId = idParam(request);
    if (ctx.notebooks.get(notebookId) === null) return notFound(reply, 'Notebook');
    const body = parseBody(AskRequestSchema, request, reply);
    if (body === null) return reply;

    // Nur Quellen dieses Notebooks zulassen. Ein Notebook darf nie auf die
    // Quellen eines anderen zugreifen.
    const allowed = new Set(ctx.sources.listByNotebook(notebookId).map((s) => s.id));
    const sourceIds = body.sourceIds.filter((id) => allowed.has(id));

    try {
      return await ask(ctx.db, ctx.llm, { question: body.question, sourceIds }, {
        topK: ctx.config.RETRIEVAL_TOP_K,
      });
    } catch (error) {
      if (error instanceof LlmUnavailableError) {
        return fail(reply, 503, 'llm_unavailable', error.message);
      }
      throw error;
    }
  });
}
