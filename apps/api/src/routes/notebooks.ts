import type { FastifyInstance } from 'fastify';
import { Readable } from 'node:stream';
import {
  CreateNotebookRequestSchema,
  UpdateNotebookRequestSchema,
  type NotebookListResponse,
  type ApiError,
} from '@notebook/shared';
import type { AppContext } from '../context.ts';
import { fail, idParam, notFound, parseBody } from './helpers.ts';

export function registerNotebookRoutes(app: FastifyInstance, ctx: AppContext): void {
  let activeExports = 0;
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
    if (ctx.notebooks.count() >= 100) {
      return fail(reply, 409, 'conflict', 'Die Demo erlaubt höchstens 100 Notebooks.');
    }
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

    if (activeExports >= 2) {
      return reply
        .status(429)
        .header('Retry-After', 5)
        .send({
          error: {
            code: 'rate_limited',
            message: 'Es laufen bereits zwei Exporte. Bitte kurz warten.',
            retryAfterSeconds: 5,
            retryAt: new Date(Date.now() + 5000).toISOString(),
          },
        } satisfies ApiError);
    }
    const title = notebook.title;
    const exportedOn = new Date().toISOString().slice(0, 10);
    const sources = ctx.sources.listByNotebook(id);
    const notes = ctx.notes.listByNotebook(id);

    // Read source text only when the consumer requests it. Backpressure keeps
    // whole notebooks out of memory; at most the current source is retained.
    function* lines(): Generator<string> {
      yield* [
        `# ${title}`,
        '',
        `Exportiert am ${exportedOn} · ${sources.length} Quellen · ${notes.length} Notizen`,
        '',
        '## Notizen',
        '',
        '_Notizen sind bearbeitbare Texte. Belege prüfen Textstellen, nicht den Wahrheitsgehalt oder die KI-Herkunft der Notiz._',
        '',
      ];
      if (notes.length === 0) yield* ['_Keine Notizen._', ''];
      for (const note of notes) {
        yield* [`### ${note.title}`, ''];
        if (note.question !== '') yield* [`**Frage:** ${note.question}`, ''];
        yield* [note.body, ''];
        if (note.citations.length > 0) {
          yield* ['**Belege:**', ''];
          for (const c of note.citations) {
            const where = c.headingPath === '' ? '' : ` · ${c.headingPath}`;
            const exact = c.precision === 'exact' ? '' : ' (ganzer Abschnitt)';
            const missing = sources.some((source) => source.id === c.sourceId)
              ? ''
              : ' · Originalquelle gelöscht; nur gespeicherter Belegauszug verfügbar';
            yield* [
              `- [${c.marker}] ${c.sourceTitle}${where} · Zeichen ${c.startOffset}–${c.endOffset}${exact}${missing}`,
              `  > ${c.excerpt.replace(/\n+/g, ' ')}`,
            ];
          }
          yield '';
        }
      }
      yield* ['## Quellen', ''];
      for (const source of sources) {
        const content = ctx.sources.getWithContent(source.id);
        // Concurrent deletion must abort the download, not silently omit text.
        if (content === null) throw new Error('Eine Quelle wurde während des Exports gelöscht.');
        yield* [
          `### ${source.title}`,
          '',
          `_${source.kind} · ${source.wordCount} Wörter · ${source.chunkCount} Abschnitte_`,
          '',
          content.content,
          '',
        ];
      }
    }
    const stream = Readable.from(markdownChunks(lines()), {
      objectMode: false,
      highWaterMark: 64 * 1024,
    });
    activeExports += 1;
    let released = false;
    const release = (): void => {
      if (released) return;
      released = true;
      activeExports -= 1;
    };
    reply.raw.once('finish', release);
    reply.raw.once('close', release);
    stream.once('close', release);

    const stem =
      notebook.title
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase() || 'notebook';
    const filename = `${stem}.md`;
    const fallback = `${stem.replace(/[^a-z0-9-]/g, '').replace(/^-|-$/g, '') || 'notebook'}.md`;
    return reply
      .header('content-type', 'text/markdown; charset=utf-8')
      .header(
        'content-disposition',
        `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      )
      .send(stream);
  });

  app.get('/v1/notebooks/:id/notes', (request, reply) => {
    const id = idParam(request);
    if (ctx.notebooks.get(id) === null) return notFound(reply, 'Notebook');
    return { notes: ctx.notes.listByNotebook(id) };
  });
}

/** Preserve the existing Markdown bytes while avoiding a notebook-wide join.
 * Surrogate pairs stay together when UTF-8 encoding each bounded chunk. */
export function* markdownChunks(lines: Iterable<string>): Generator<string> {
  let first = true;
  for (const line of lines) {
    if (!first) yield '\n';
    first = false;
    for (let start = 0; start < line.length;) {
      let end = Math.min(start + 16_384, line.length);
      const last = line.charCodeAt(end - 1);
      if (end < line.length && last >= 0xd800 && last <= 0xdbff) end -= 1;
      yield line.slice(start, end);
      start = end;
    }
  }
}
