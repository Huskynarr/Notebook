import type { FastifyInstance } from 'fastify';
import { CreateNoteRequestSchema, UpdateNoteRequestSchema } from '@notebook/shared';
import type { AppContext } from '../context.ts';
import { idParam, notFound, parseBody } from './helpers.ts';

export function registerNoteRoutes(app: FastifyInstance, ctx: AppContext): void {
  app.post('/v1/notebooks/:id/notes', (request, reply) => {
    const notebookId = idParam(request);
    if (ctx.notebooks.get(notebookId) === null) return notFound(reply, 'Notebook');
    const body = parseBody(CreateNoteRequestSchema, request, reply);
    if (body === null) return reply;
    ctx.notebooks.touch(notebookId);
    return reply.status(201).send(ctx.notes.create({ notebookId, ...body }));
  });

  app.patch('/v1/notes/:id', (request, reply) => {
    const body = parseBody(UpdateNoteRequestSchema, request, reply);
    if (body === null) return reply;
    const updated = ctx.notes.update(idParam(request), body);
    return updated === null ? notFound(reply, 'Notiz') : updated;
  });

  app.delete('/v1/notes/:id', (request, reply) => {
    const deleted = ctx.notes.delete(idParam(request));
    return deleted ? reply.status(204).send() : notFound(reply, 'Notiz');
  });
}
