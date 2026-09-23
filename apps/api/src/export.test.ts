import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { ApiErrorSchema } from '@notebook/shared';
import { createContext, type AppContext } from './context.ts';
import { loadConfig } from './config.ts';
import { openDatabase } from './db/database.ts';
import { buildServer } from './server.ts';
import { markdownChunks } from './routes/notebooks.ts';

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve = (): void => {
    throw new Error('Promise resolver not initialized');
  };
  const promise = new Promise<void>((ready) => {
    resolve = ready;
  });
  return { promise, resolve };
}

describe('Speicherbegrenzter Markdown-Export', () => {
  let ctx: AppContext;
  let app: FastifyInstance;
  let headers: { authorization: string };
  beforeEach(async () => {
    ctx = createContext(
      loadConfig({ AUTH_SECRET: 'export-test-secret-only-12345678', SEED_ON_EMPTY: 'false' }),
      openDatabase(':memory:'),
    );
    app = await buildServer(ctx);
    const token = ctx.auth.login('Huskynarr', 'admin')?.token;
    if (token === undefined) throw new Error('Missing test session');
    headers = { authorization: `Bearer ${token}` };
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await app.close();
    ctx.db.close();
  });

  it('liefert identische Markdown-Bytes und verliert kein Unicode an Chunk-Grenzen', () => {
    const lines = ['Start', '', 'x'.repeat(16_383) + '🐺' + 'ä'.repeat(50_000), 'Ende', ''];
    const chunks = [...markdownChunks(lines)];
    expect(chunks.every((chunk) => Buffer.byteLength(chunk, 'utf8') <= 64 * 1024)).toBe(true);
    expect(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString('utf8')).toBe(
      lines.join('\n'),
    );
  });

  it('liest spätere Quellen erst, wenn der Stream sie benötigt', () => {
    let readSources = 0;
    function* lines(): Generator<string> {
      yield 'Header';
      readSources += 1;
      yield 'a'.repeat(64 * 1024);
      readSources += 1;
      yield 'Second source';
    }
    const stream = markdownChunks(lines());
    expect(readSources).toBe(0);
    expect(stream.next().value).toBe('Header');
    expect(readSources).toBe(0);
    stream.next();
    expect(readSources).toBe(1);
    stream.next();
    expect(readSources).toBe(1);
    stream.return(undefined);
    expect(readSources).toBe(1);
  });

  it('überträgt Quellen, Unicode-Dateinamen und Hinweise zu gelöschten Belegen korrekt', async () => {
    const notebook = ctx.notebooks.create('Prüfung 🐺');
    const content = 'Unicode 🐺 bleibt unverändert.\n' + 'Längerer Text ü. '.repeat(5000);
    const source = ctx.sources.create({
      notebookId: notebook.id,
      title: 'Quelle',
      kind: 'markdown',
      content,
    });
    ctx.notes.create({
      notebookId: notebook.id,
      title: 'Notiz',
      body: 'Ein gespeicherter Beleg [1].',
      question: 'Frage?',
      citations: [
        {
          marker: 1,
          sourceId: 'deletedsource',
          sourceTitle: 'Gelöschte Quelle',
          chunkId: 'deletedchunk',
          headingPath: '',
          startOffset: 0,
          endOffset: 4,
          excerpt: 'Test',
          precision: 'exact',
        },
      ],
    });
    const exported = await app.inject({
      method: 'GET',
      url: `/v1/notebooks/${notebook.id}/export`,
      headers,
    });
    expect(exported.statusCode).toBe(200);
    expect(exported.headers['content-type']).toBe('text/markdown; charset=utf-8');
    expect(exported.headers['content-length']).toBeUndefined();
    expect(exported.headers['content-disposition']).toBe(
      'attachment; filename="prfung.md"; filename*=UTF-8\'\'pr%C3%BCfung.md',
    );
    expect(exported.body).toBe(
      [
        '# Prüfung 🐺',
        '',
        `Exportiert am ${new Date().toISOString().slice(0, 10)} · 1 Quellen · 1 Notizen`,
        '',
        '## Notizen',
        '',
        '_Notizen sind bearbeitbare Texte. Belege prüfen Textstellen, nicht den Wahrheitsgehalt oder die KI-Herkunft der Notiz._',
        '',
        '### Notiz',
        '',
        '**Frage:** Frage?',
        '',
        'Ein gespeicherter Beleg [1].',
        '',
        '**Belege:**',
        '',
        '- [1] Gelöschte Quelle · Zeichen 0–4 · Originalquelle gelöscht; nur gespeicherter Belegauszug verfügbar',
        '  > Test',
        '',
        '## Quellen',
        '',
        '### Quelle',
        '',
        `_markdown · ${source.wordCount} Wörter · ${source.chunkCount} Abschnitte_`,
        '',
        content,
        '',
      ].join('\n'),
    );
  });

  it('begrenzt parallele Downloads auf zwei und gibt den Platz nach Abschluss frei', async () => {
    const notebook = ctx.notebooks.create('Parallel');
    const release = deferred();
    const occupied = deferred();
    let waiting = 0;
    app.addHook('onSend', async (request, reply, payload) => {
      if (request.url.endsWith('/export') && reply.statusCode === 200 && waiting < 2) {
        waiting += 1;
        if (waiting === 2) occupied.resolve();
        await release.promise;
      }
      return payload;
    });
    const request = { method: 'GET', url: `/v1/notebooks/${notebook.id}/export`, headers } as const;
    const first = app.inject(request).then((result) => result);
    const second = app.inject(request).then((result) => result);
    try {
      await occupied.promise;
      const blocked = await app.inject(request);
      expect(blocked.statusCode).toBe(429);
      expect(ApiErrorSchema.parse(blocked.json()).error.retryAfterSeconds).toBe(5);
      expect(blocked.headers['retry-after']).toBe('5');
    } finally {
      release.resolve();
    }
    expect((await first).statusCode).toBe(200);
    expect((await second).statusCode).toBe(200);
    expect((await app.inject(request)).statusCode).toBe(200);
  });
});
