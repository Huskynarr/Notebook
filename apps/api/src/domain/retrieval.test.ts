import { beforeEach, describe, expect, it } from 'vitest';
import { loadConfig } from '../config.ts';
import { createContext, type AppContext } from '../context.ts';
import { openDatabase } from '../db/database.ts';
import { EXAMPLE_SOURCES } from '../seed/example.ts';
import { buildMatchQuery, retrieve } from './retrieval.ts';

describe('buildMatchQuery', () => {
  it('entfernt Fuellwoerter und sucht lange Begriffe als Praefix', () => {
    const query = buildMatchQuery('Wie lange ist die Widerspruchsfrist?');
    expect(query).toBe('"lange"* OR "widerspruchsfrist"*');
  });

  it('sucht kurze Begriffe exakt, damit sie nicht zu viel treffen', () => {
    // "hoch" darf nicht ueber ein Praefix "Hochschule" finden.
    expect(buildMatchQuery('Wie hoch ist der Rahmen?')).toBe('"hoch" OR "rahmen"*');
  });

  it('gibt fuer eine Frage ohne brauchbare Begriffe nichts zurueck', () => {
    expect(buildMatchQuery('Wie ist das?')).toBeNull();
    expect(buildMatchQuery('???')).toBeNull();
  });
});

describe('retrieve', () => {
  let ctx: AppContext;
  let sourceIds: string[];

  beforeEach(() => {
    ctx = createContext(
      loadConfig({ AUTH_SECRET: 'testgeheimnis-mindestens-16-zeichen' }),
      openDatabase(':memory:'),
    );
    const notebook = ctx.notebooks.create('Test');
    sourceIds = EXAMPLE_SOURCES.map(
      (source) => ctx.sources.create({ notebookId: notebook.id, ...source }).id,
    );
  });

  it('findet die Textstelle zur Widerspruchsfrist', () => {
    const hits = retrieve(ctx.db, 'Wie lange ist die Widerspruchsfrist?', {
      sourceIds,
      topK: 5,
    });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => h.text.includes('vierzehn Tage'))).toBe(true);
  });

  it('findet zu einer fachfremden Frage nichts', () => {
    const hits = retrieve(ctx.db, 'Wie hoch ist die Mehrwertsteuer auf Kaffeebohnen?', {
      sourceIds,
      topK: 5,
    });
    expect(hits).toEqual([]);
  });

  it('beruecksichtigt ausschliesslich die uebergebenen Quellen', () => {
    const [first] = sourceIds;
    const hits = retrieve(ctx.db, 'Einsicht in die Pruefungsakte', {
      sourceIds: [first ?? ''],
      topK: 10,
    });
    for (const hit of hits) expect(hit.sourceId).toBe(first);
  });

  it('gibt ohne ausgewaehlte Quelle nichts zurueck', () => {
    expect(retrieve(ctx.db, 'Widerspruchsfrist', { sourceIds: [], topK: 5 })).toEqual([]);
  });

  it('liefert Abschnitte mit gueltigen Offsets in den Originaltext', () => {
    const hits = retrieve(ctx.db, 'Widerspruchsfrist', { sourceIds, topK: 5 });
    for (const hit of hits) {
      const source = ctx.sources.getWithContent(hit.sourceId);
      expect(source).not.toBeNull();
      expect(source?.content.slice(hit.startOffset, hit.endOffset)).toBe(hit.text);
    }
  });

  it('sortiert nach Relevanz absteigend', () => {
    const hits = retrieve(ctx.db, 'Widerspruch Begruendung Pruefungsamt', {
      sourceIds,
      topK: 10,
    });
    for (let i = 1; i < hits.length; i += 1) {
      expect(hits[i - 1]!.score).toBeGreaterThanOrEqual(hits[i]!.score);
    }
  });
});
