import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { LoginResponseSchema, NoteSchema, type Citation } from '@notebook/shared';
import { loadConfig } from './config.ts';
import { createContext, type AppContext } from './context.ts';
import { openDatabase } from './db/database.ts';
import { buildServer } from './server.ts';

describe('Notizbelege und Exportintegrität', () => {
  let ctx: AppContext;
  let app: FastifyInstance;
  let auth: { authorization: string };
  let notebookId: string;
  let citation: Citation;

  beforeEach(async () => {
    ctx = createContext(
      loadConfig({
        AUTH_SECRET: 'notiz-testgeheimnis-mindestens-32-zeichen',
        SEED_ON_EMPTY: 'false',
      }),
      openDatabase(':memory:'),
    );
    app = await buildServer(ctx);
    const login = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { username: 'Huskynar', password: 'admin' },
    });
    auth = { authorization: `Bearer ${LoginResponseSchema.parse(login.json()).token}` };
    notebookId = ctx.notebooks.create('Belege').id;
    const source = ctx.sources.create({
      notebookId,
      title: 'Original.md',
      kind: 'markdown',
      content: '# Fristen\n\nDie Widerspruchsfrist beträgt vierzehn Tage ab Bekanntgabe.\n',
    });
    const chunk = ctx.sources.chunksOf(source.id)[0];
    if (chunk === undefined) throw new Error('Testquelle hat keinen Abschnitt');
    const excerpt = 'vierzehn Tage';
    const startOffset = chunk.start_offset + chunk.text.indexOf(excerpt);
    citation = {
      marker: 1,
      sourceId: source.id,
      sourceTitle: source.title,
      chunkId: chunk.id,
      headingPath: chunk.heading_path,
      startOffset,
      endOffset: startOffset + excerpt.length,
      excerpt,
      precision: 'exact',
    };
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await app.close();
    ctx.db.close();
  });

  function save(citations: Citation[] = [citation]) {
    return app.inject({
      method: 'POST',
      url: `/v1/notebooks/${notebookId}/notes`,
      headers: auth,
      payload: {
        title: 'Frist',
        body: 'Die Frist beträgt vierzehn Tage [1].',
        citations,
        question: 'Welche Frist?',
      },
    });
  }

  it('übernimmt Titel und Überschriften nur aus der gespeicherten Quelle', async () => {
    const response = await save([
      { ...citation, sourceTitle: 'Erfundener Titel', headingPath: 'Erfundene Überschrift' },
    ]);
    expect(response.statusCode).toBe(201);
    const saved = NoteSchema.parse(response.json());
    expect(saved.citations).toEqual([citation]);
    const original = ctx.sources.getWithContent(citation.sourceId);
    expect(original?.content.slice(citation.startOffset, citation.endOffset)).toBe(
      saved.citations[0]?.excerpt,
    );
  });

  it.each([
    ['unbekannter Abschnitt', { chunkId: 'unknown-chunk' }],
    ['unbekannte Quelle', { sourceId: 'unknown-source' }],
    ['geänderter Auszug', { excerpt: 'einundzwanzig Tage' }],
    ['verschobener Beginn', { startOffset: 0 }],
    ['überschrittenes Ende', { endOffset: 9999 }],
    ['leerer Auszug', { excerpt: '', startOffset: 1, endOffset: 1 }],
    ['falsche Abschnittspräzision', { precision: 'chunk' as const }],
  ])('weist einen manipulierten Beleg ab: %s', async (_name, patch) => {
    const response = await save([{ ...citation, ...patch }]);
    expect(response.statusCode).toBe(400);
    expect(ctx.notes.listByNotebook(notebookId)).toHaveLength(0);
  });

  it('weist gültige Belege aus einem anderen Notebook ab', async () => {
    const other = ctx.notebooks.create('Anderes Notebook');
    const source = ctx.sources.create({
      notebookId: other.id,
      title: 'Fremde Quelle',
      kind: 'text',
      content: citation.excerpt,
    });
    const chunk = ctx.sources.chunksOf(source.id)[0];
    if (chunk === undefined) throw new Error('Testquelle hat keinen Abschnitt');
    const response = await save([
      {
        ...citation,
        sourceId: source.id,
        chunkId: chunk.id,
        startOffset: 0,
        endOffset: citation.excerpt.length,
      },
    ]);
    expect(response.statusCode).toBe(400);
    expect(ctx.notes.listByNotebook(notebookId)).toHaveLength(0);
  });

  it('weist mehrdeutige doppelte Belegnummern ab', async () => {
    expect((await save([citation, citation])).statusCode).toBe(400);
  });

  it('erhält nach dem Löschen einen gekennzeichneten Auszug und bearbeitbare Notizen', async () => {
    const saved = NoteSchema.parse((await save()).json());
    ctx.sources.delete(citation.sourceId);
    const edited = await app.inject({
      method: 'PATCH',
      url: `/v1/notes/${saved.id}`,
      headers: auth,
      payload: { body: 'Eigene Interpretation; kein unabhängiger KI-Nachweis.' },
    });
    expect(edited.statusCode).toBe(200);
    expect(NoteSchema.parse(edited.json()).citations).toEqual([citation]);
    expect((await save()).statusCode).toBe(400);
    const exported = await app.inject({
      method: 'GET',
      url: `/v1/notebooks/${notebookId}/export`,
      headers: auth,
    });
    expect(exported.statusCode).toBe(200);
    expect(exported.body).toContain(
      'Originalquelle gelöscht; nur gespeicherter Belegauszug verfügbar',
    );
    expect(exported.body).toContain(citation.excerpt);
    expect(exported.body).toContain('nicht den Wahrheitsgehalt oder die KI-Herkunft');
  });

  it('exportiert internationale Dateinamen mit ASCII-Fallback und UTF-8-Parameter', async () => {
    ctx.notebooks.rename(notebookId, 'Prüfung 数学 🧮');
    const exported = await app.inject({
      method: 'GET',
      url: `/v1/notebooks/${notebookId}/export`,
      headers: auth,
    });
    expect(exported.statusCode).toBe(200);
    expect(exported.headers['content-disposition']).toBe(
      `attachment; filename="prfung.md"; filename*=UTF-8''${encodeURIComponent('prüfung-数学.md')}`,
    );
    expect(exported.body).toContain('# Prüfung 数学 🧮');
  });

  it('begrenzt die Anzahl der Notebooks und Notizen', async () => {
    for (let i = 1; i < 100; i += 1) ctx.notebooks.create(`Notebook ${i}`);
    const notebook = await app.inject({
      method: 'POST',
      url: '/v1/notebooks',
      headers: auth,
      payload: { title: 'Zu viel' },
    });
    expect(notebook.statusCode).toBe(409);
    expect(ctx.notebooks.count()).toBe(100);
    for (let i = 0; i < 100; i += 1) {
      ctx.notes.create({ notebookId, title: `Notiz ${i}`, body: '', citations: [], question: '' });
    }
    expect((await save()).statusCode).toBe(409);
    expect(ctx.notes.listByNotebook(notebookId)).toHaveLength(100);
  });

  it('zählt gespeicherte Inhalte in UTF-8-Bytes einschließlich Beleg-Snapshots', async () => {
    const saved = NoteSchema.parse((await save()).json());
    expect(ctx.notes.totalContentBytes()).toBe(
      Buffer.byteLength(
        saved.title + saved.body + saved.question + JSON.stringify(saved.citations),
        'utf8',
      ),
    );
    expect(ctx.sources.totalContentBytes()).toBe(
      Buffer.byteLength(ctx.sources.getWithContent(citation.sourceId)?.content ?? '', 'utf8'),
    );
    ctx.sources.delete(citation.sourceId);
    expect(ctx.sources.totalContentBytes()).toBe(0);
  });

  it('verhindert neue oder vergrößerte Notizen bei erreichtem Speicherbudget', async () => {
    const saved = NoteSchema.parse((await save()).json());
    vi.spyOn(ctx.notes, 'totalContentBytes').mockReturnValue(50 * 1024 * 1024);
    expect((await save()).statusCode).toBe(413);
    const grown = await app.inject({
      method: 'PATCH',
      url: `/v1/notes/${saved.id}`,
      headers: auth,
      payload: { body: saved.body + ' Mehr.' },
    });
    expect(grown.statusCode).toBe(413);
    const shrunk = await app.inject({
      method: 'PATCH',
      url: `/v1/notes/${saved.id}`,
      headers: auth,
      payload: { body: '' },
    });
    expect(shrunk.statusCode).toBe(200);
  });
});
