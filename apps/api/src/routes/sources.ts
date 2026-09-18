import type { FastifyInstance } from 'fastify';
import {
  CreateSourceRequestSchema,
  UpdateSourceRequestSchema,
  type SourceListResponse,
} from '@notebook/shared';
import type { AppContext } from '../context.ts';
import { AbrufFehler, quelleAbrufen } from '../domain/fetchSource.ts';
import { fail, idParam, notFound, parseBody } from './helpers.ts';

export function registerSourceRoutes(app: FastifyInstance, ctx: AppContext): void {
  app.get('/v1/notebooks/:id/sources', (request, reply) => {
    const notebookId = idParam(request);
    if (ctx.notebooks.get(notebookId) === null) return notFound(reply, 'Notebook');
    return { sources: ctx.sources.listByNotebook(notebookId) } satisfies SourceListResponse;
  });

  app.post('/v1/notebooks/:id/sources', async (request, reply) => {
    const notebookId = idParam(request);
    if (ctx.notebooks.get(notebookId) === null) return notFound(reply, 'Notebook');
    const body = parseBody(CreateSourceRequestSchema, request, reply);
    if (body === null) return reply;

    let eingabe: {
      title: string;
      kind: 'text' | 'markdown' | 'url';
      content: string;
      origin?: string;
    };
    if (body.kind === 'url') {
      try {
        const geholt = await quelleAbrufen(body.url);
        eingabe = {
          title: body.title ?? geholt.title,
          kind: 'url',
          content: geholt.content,
          origin: geholt.origin,
        };
      } catch (error) {
        if (error instanceof AbrufFehler) return fail(reply, 422, 'fetch_failed', error.message);
        throw error;
      }
    } else {
      eingabe = { title: body.title, kind: body.kind, content: body.content };
    }

    if (eingabe.content.trim() === '') {
      return fail(reply, 400, 'validation_failed', 'Die Quelle enthält keinen Text.');
    }
    const source = ctx.sources.create({ notebookId, ...eingabe });
    if (source.chunkCount === 0) {
      // Eine Quelle ohne Abschnitte waere sichtbar, aber unauffindbar. Lieber
      // gar nicht anlegen, als etwas vorzutaeuschen.
      ctx.sources.delete(source.id);
      return fail(
        reply,
        400,
        'validation_failed',
        'Aus dieser Quelle ließ sich kein durchsuchbarer Abschnitt bilden.',
      );
    }
    ctx.notebooks.touch(notebookId);
    return reply.status(201).send(source);
  });

  /** Volltext einer Quelle - Grundlage der Belegdarstellung im UI. */
  app.get('/v1/sources/:id', (request, reply) => {
    const source = ctx.sources.getWithContent(idParam(request));
    return source === null ? notFound(reply, 'Quelle') : source;
  });

  app.patch('/v1/sources/:id', (request, reply) => {
    const body = parseBody(UpdateSourceRequestSchema, request, reply);
    if (body === null) return reply;
    const updated = ctx.sources.update(idParam(request), body);
    return updated === null ? notFound(reply, 'Quelle') : updated;
  });

  app.delete('/v1/sources/:id', (request, reply) => {
    const deleted = ctx.sources.delete(idParam(request));
    return deleted ? reply.status(204).send() : notFound(reply, 'Quelle');
  });
}
