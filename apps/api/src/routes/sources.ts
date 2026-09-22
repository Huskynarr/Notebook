import type { FastifyInstance } from 'fastify';
import {
  CreateSourceRequestSchema,
  MAX_SOURCE_BYTES,
  UpdateSourceRequestSchema,
  type SourceListResponse,
} from '@notebook/shared';
import type { AppContext } from '../context.ts';
import { fail, idParam, notFound, parseBody } from './helpers.ts';

export function registerSourceRoutes(app: FastifyInstance, ctx: AppContext): void {
  app.get('/v1/notebooks/:id/sources', (request, reply) => {
    const notebookId = idParam(request);
    if (ctx.notebooks.get(notebookId) === null) return notFound(reply, 'Notebook');
    return { sources: ctx.sources.listByNotebook(notebookId) } satisfies SourceListResponse;
  });

  // JSON escaping can double plain-text size; the decoded UTF-8 limit is checked below.
  app.post(
    '/v1/notebooks/:id/sources',
    { bodyLimit: 2 * MAX_SOURCE_BYTES + 8192 },
    (request, reply) => {
      const notebookId = idParam(request);
      const notebook = ctx.notebooks.get(notebookId);
      if (notebook === null) return notFound(reply, 'Notebook');
      if (notebook.sourceCount >= 100) {
        return fail(
          reply,
          409,
          'conflict',
          'Ein Notebook kann in dieser Demo höchstens 100 Quellen enthalten.',
        );
      }
      const candidate = request.body;
      if (
        typeof candidate === 'object' &&
        candidate !== null &&
        'content' in candidate &&
        typeof candidate.content === 'string'
      ) {
        if (Buffer.byteLength(candidate.content, 'utf8') > MAX_SOURCE_BYTES) {
          return fail(
            reply,
            413,
            'payload_too_large',
            'Eine Quelle darf höchstens 10 MiB UTF-8-Text enthalten.',
          );
        }
      }
      const body = parseBody(CreateSourceRequestSchema, request, reply);
      if (body === null) return reply;

      if (body.kind === 'url') {
        return fail(
          reply,
          422,
          'not_supported',
          'Website-Import ist in dieser Version deaktiviert. Text oder Markdown bitte als Datei importieren.',
        );
      }
      const eingabe = { title: body.title, kind: body.kind, content: body.content };
      for (const character of eingabe.content) {
        const code = character.charCodeAt(0);
        if ((code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127) {
          return fail(
            reply,
            400,
            'validation_failed',
            'Binärdaten sind keine gültige Text- oder Markdown-Quelle.',
          );
        }
      }

      if (eingabe.content.trim() === '') {
        return fail(reply, 400, 'validation_failed', 'Die Quelle enthält keinen Text.');
      }
      if (
        ctx.sources.totalContentBytes() + Buffer.byteLength(eingabe.content, 'utf8') >
        200 * 1024 * 1024
      ) {
        return fail(
          reply,
          413,
          'storage_limit',
          'Die Demo ist auf insgesamt 200 MiB Quellentext begrenzt. Bitte zuvor Quellen löschen.',
        );
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
    },
  );

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
