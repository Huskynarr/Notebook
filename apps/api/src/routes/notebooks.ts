import type { FastifyInstance } from 'fastify';
import {
  CreateNotebookRequestSchema,
  UpdateNotebookRequestSchema,
  type NotebookListResponse,
} from '@notebook/shared';
import type { AppContext } from '../context.ts';
import { idParam, notFound, parseBody } from './helpers.ts';

export function registerNotebookRoutes(app: FastifyInstance, ctx: AppContext): void {
  app.get('/v1/notebooks', () => {
    return { notebooks: ctx.notebooks.list() } satisfies NotebookListResponse;
  });

  app.get('/v1/notebooks/:id', (request, reply) => {
    const notebook = ctx.notebooks.get(idParam(request));
    return notebook === null ? notFound(reply, 'Notebook') : notebook;
  });

  app.post('/v1/notebooks', (request, reply) => {
    const body = parseBody(CreateNotebookRequestSchema, request, reply);
    if (body === null) return reply;
    return reply.status(201).send(ctx.notebooks.create(body.title));
  });

  app.patch('/v1/notebooks/:id', (request, reply) => {
    const body = parseBody(UpdateNotebookRequestSchema, request, reply);
    if (body === null) return reply;
    const updated = ctx.notebooks.rename(idParam(request), body.title);
    return updated === null ? notFound(reply, 'Notebook') : updated;
  });

  app.delete('/v1/notebooks/:id', (request, reply) => {
    const deleted = ctx.notebooks.delete(idParam(request));
    return deleted ? reply.status(204).send() : notFound(reply, 'Notebook');
  });

  /** Export als Markdown (P3). Enthaelt Quellen und Notizen samt Belegangaben,
   *  damit der Export fuer sich allein nachvollziehbar bleibt. */
  app.get('/v1/notebooks/:id/export', (request, reply) => {
    const id = idParam(request);
    const notebook = ctx.notebooks.get(id);
    if (notebook === null) return notFound(reply, 'Notebook');

    const sources = ctx.sources.listByNotebook(id);
    const notes = ctx.notes.listByNotebook(id);

    const lines: string[] = [
      `# ${notebook.title}`,
      '',
      `Exportiert am ${new Date().toISOString().slice(0, 10)} · ${sources.length} Quellen · ${notes.length} Notizen`,
      '',
      '## Notizen',
      '',
    ];

    if (notes.length === 0) lines.push('_Keine Notizen._', '');
    for (const note of notes) {
      lines.push(`### ${note.title}`, '');
      if (note.question !== '') lines.push(`**Frage:** ${note.question}`, '');
      lines.push(note.body, '');
      if (note.citations.length > 0) {
        lines.push('**Belege:**', '');
        for (const c of note.citations) {
          const where = c.headingPath === '' ? '' : ` · ${c.headingPath}`;
          const exact = c.precision === 'exact' ? '' : ' (ganzer Abschnitt)';
          lines.push(
            `- [${c.marker}] ${c.sourceTitle}${where} · Zeichen ${c.startOffset}–${c.endOffset}${exact}`,
            `  > ${c.excerpt.replace(/\n+/g, ' ')}`,
          );
        }
        lines.push('');
      }
    }

    lines.push('## Quellen', '');
    for (const source of sources) {
      const content = ctx.sources.getWithContent(source.id);
      lines.push(
        `### ${source.title}`,
        '',
        `_${source.kind} · ${source.wordCount} Wörter · ${source.chunkCount} Abschnitte_`,
        '',
        content?.content ?? '',
        '',
      );
    }

    const filename = `${notebook.title.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase()}.md`;
    return reply
      .header('content-type', 'text/markdown; charset=utf-8')
      .header('content-disposition', `attachment; filename="${filename}"`)
      .send(lines.join('\n'));
  });

  app.get('/v1/notebooks/:id/notes', (request, reply) => {
    const id = idParam(request);
    if (ctx.notebooks.get(id) === null) return notFound(reply, 'Notebook');
    return { notes: ctx.notes.listByNotebook(id) };
  });
}
