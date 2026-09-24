import type { FastifyInstance } from 'fastify';
import {
  CreateNoteRequestSchema,
  UpdateNoteRequestSchema,
  type CreateNoteRequest,
} from '@notebook/shared';
import type { AppContext } from '../context.ts';
import { fail, idParam, notFound, parseBody } from './helpers.ts';

const MAX_NOTES_PER_NOTEBOOK = 100;
const MAX_NOTE_BYTES = 50 * 1024 * 1024;

function contentBytes(note: CreateNoteRequest): number {
  return Buffer.byteLength(
    note.title + note.body + note.question + JSON.stringify(note.citations),
    'utf8',
  );
}

export function registerNoteRoutes(app: FastifyInstance, ctx: AppContext): void {
  app.post('/v1/notebooks/:id/notes', (request, reply) => {
    const notebookId = idParam(request);
    const notebook = ctx.notebooks.get(notebookId);
    if (notebook === null) return notFound(reply, 'Notebook');
    const body = parseBody(CreateNoteRequestSchema, request, reply);
    if (body === null) return reply;
    if (notebook.noteCount >= MAX_NOTES_PER_NOTEBOOK) {
      return fail(reply, 409, 'conflict', 'Die Demo erlaubt höchstens 100 Notizen pro Notebook.');
    }
    const citations = ctx.sources.canonicalizeCitations(notebookId, body.citations);
    if (citations === null) {
      return fail(
        reply,
        400,
        'validation_failed',
        'Ein Beleg passt nicht zum Originaltext dieses Notebooks.',
      );
    }
    const input = { ...body, citations };
    if (ctx.notes.totalContentBytes() + contentBytes(input) > MAX_NOTE_BYTES) {
      return fail(
        reply,
        413,
        'storage_limit',
        'Die Demo erlaubt insgesamt 50 MiB gespeicherten Notiztext einschließlich Belegen.',
      );
    }
    ctx.notebooks.touch(notebookId);
    return reply.status(201).send(ctx.notes.create({ notebookId, ...input }));
  });

  app.patch('/v1/notes/:id', (request, reply) => {
    const body = parseBody(UpdateNoteRequestSchema, request, reply);
    if (body === null) return reply;
    const current = ctx.notes.get(idParam(request));
    if (current === null) return notFound(reply, 'Notiz');
    const newSize = contentBytes({
      ...current,
      title: body.title ?? current.title,
      body: body.body ?? current.body,
    });
    if (ctx.notes.totalContentBytes() - contentBytes(current) + newSize > MAX_NOTE_BYTES) {
      return fail(
        reply,
        413,
        'storage_limit',
        'Die Demo erlaubt insgesamt 50 MiB gespeicherten Notiztext einschließlich Belegen.',
      );
    }
    ctx.notebooks.touch(current.notebookId);
    return ctx.notes.update(current.id, body);
  });

  app.delete('/v1/notes/:id', (request, reply) => {
    const deleted = ctx.notes.delete(idParam(request));
    return deleted ? reply.status(204).send() : notFound(reply, 'Notiz');
  });
}
