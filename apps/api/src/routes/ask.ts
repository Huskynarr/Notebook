import type { FastifyInstance } from 'fastify';
import { AskRequestSchema } from '@notebook/shared';
import type { AppContext } from '../context.ts';
import { ask } from '../domain/ask.ts';
import { LlmUnavailableError } from '../llm/provider.ts';
import { fail, idParam, notFound, parseBody } from './helpers.ts';
import { AskBudget } from '../askBudget.ts';

export function registerAskRoutes(app: FastifyInstance, ctx: AppContext): void {
  const budget = new AskBudget(ctx.db);
  app.post('/v1/notebooks/:id/ask', async (request, reply) => {
    const notebookId = idParam(request);
    if (ctx.notebooks.get(notebookId) === null) return notFound(reply, 'Notebook');
    const body = parseBody(AskRequestSchema, request, reply);
    if (body === null) return reply;

    // Nur Quellen dieses Notebooks zulassen. Ein Notebook darf nie auf die
    // Quellen eines anderen zugreifen.
    const allowed = new Set(ctx.sources.listByNotebook(notebookId).map((s) => s.id));
    const sourceIds = body.sourceIds.filter((id) => allowed.has(id));

    const admission = budget.acquire();
    if ('retryAfterSeconds' in admission) {
      const seconds = admission.retryAfterSeconds;
      return reply
        .header('Retry-After', seconds)
        .status(429)
        .send({
          error: {
            code: 'rate_limited',
            message:
              'Das Anfragekontingent ist erreicht oder es laufen bereits zwei Fragen. Später erneut versuchen.',
            retryAfterSeconds: seconds,
            retryAt: new Date(Date.now() + seconds * 1000).toISOString(),
          },
        });
    }

    try {
      return await ask(
        ctx.db,
        ctx.llm,
        { question: body.question, sourceIds, language: body.language },
        {
          topK: ctx.config.RETRIEVAL_TOP_K,
          ...(ctx.config.EMBEDDING_PROVIDER === 'openrouter'
            ? { openRouterEmbeddingKey: ctx.config.OPENROUTER_EMBEDDING_KEY }
            : {}),
        },
      );
    } catch (error) {
      if (error instanceof LlmUnavailableError) {
        return await fail(reply, 503, 'llm_unavailable', error.message);
      }
      throw error;
    } finally {
      admission.release();
    }
  });
}
