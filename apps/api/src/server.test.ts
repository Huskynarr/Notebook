import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  AskResponseSchema,
  LoginResponseSchema,
  NotebookListResponseSchema,
  NotebookSchema,
  SourceSchema,
} from '@notebook/shared';
import { loadConfig } from './config.ts';
import { createContext, type AppContext } from './context.ts';
import { openDatabase } from './db/database.ts';
import { buildServer } from './server.ts';
import { EXAMPLE_SOURCES } from './seed/example.ts';
import type { CompletionRequest, CompletionResult, LlmProvider } from './llm/provider.ts';

/** Ein Modell-Doppel, das genau das tut, was der Test braucht. Es ist als
 *  Testdoppel benannt und wird nie ausgeliefert - AGENTS.md Regel 5 betrifft
 *  Produktivcode, nicht Tests. */
class ScriptedProvider implements LlmProvider {
  readonly name = 'scripted';
  lastRequest: CompletionRequest | null = null;
  private readonly answer: CompletionResult['answer'];

  constructor(answer: CompletionResult['answer']) {
    this.answer = answer;
  }

  complete(request: CompletionRequest): Promise<CompletionResult> {
    this.lastRequest = request;
    return Promise.resolve({ answer: this.answer, model: 'testdoppel', simulated: false });
  }
}

/** Nur das, was die Tests von einer Antwort brauchen. Eine eigene Form statt
 *  des Bibliothekstyps, damit der Test nicht an dessen Interna haengt. */
interface TestResponse {
  readonly statusCode: number;
  readonly body: string;
}

/** Liest den Antwortkoerper ueber das Schema statt ueber eine Typzusicherung -
 *  so faellt eine Vertragsabweichung im Test auf, statt durchzurutschen. */
function body<T>(schema: z.ZodType<T>, response: TestResponse): T {
  return schema.parse(JSON.parse(response.body) as unknown);
}

/** EXAMPLE_SOURCES[i] ist unter noUncheckedIndexedAccess moeglicherweise
 *  undefined. Ein fehlender Beispieltext soll den Test laut scheitern lassen. */
function exampleSource(index: number): { title: string; kind: 'markdown'; content: string } {
  const source = EXAMPLE_SOURCES[index];
  if (source === undefined) throw new Error(`Beispielquelle ${index} fehlt`);
  return source;
}

function makeContext(llm?: LlmProvider): AppContext {
  const config = loadConfig({
    AUTH_SECRET: 'testgeheimnis-mindestens-16-zeichen',
    SEED_ON_EMPTY: 'false',
  });
  const base = createContext(config, openDatabase(':memory:'));
  return llm === undefined ? base : { ...base, llm };
}

async function start(ctx: AppContext): Promise<{ app: FastifyInstance; token: string }> {
  const app = await buildServer(ctx);
  const login = await app.inject({
    method: 'POST',
    url: '/v1/auth/login',
    payload: { username: 'admin', password: 'admin' },
  });
  return { app, token: body(LoginResponseSchema, login).token };
}

describe('Zugangssicherung', () => {
  let app: FastifyInstance;
  beforeEach(async () => {
    ({ app } = await start(makeContext()));
  });
  afterEach(async () => {
    await app.close();
  });

  it('weist Anfragen ohne Token ab', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/notebooks' });
    expect(response.statusCode).toBe(401);
  });

  it('laesst die Zustandsabfrage ohne Anmeldung zu und gibt kein Geheimnis preis', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/health' });
    expect(response.statusCode).toBe(200);
    const body = response.body;
    expect(body).not.toContain('AUTH_SECRET');
    expect(body).not.toContain('testgeheimnis');
    expect(body).not.toContain('localhost:11434');
  });

  it('lehnt falsche Zugangsdaten ab', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { username: 'admin', password: 'falsch' },
    });
    expect(response.statusCode).toBe(401);
  });
});

describe('Notebooks, Quellen und Notizen', () => {
  let app: FastifyInstance;
  let token: string;
  let auth: { authorization: string };

  beforeEach(async () => {
    ({ app, token } = await start(makeContext()));
    auth = { authorization: `Bearer ${token}` };
  });
  afterEach(async () => {
    await app.close();
  });

  it('legt ein Notebook an, liest es und loescht es wieder', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/v1/notebooks',
      headers: auth,
      payload: { title: 'Seminar Stochastik' },
    });
    expect(created.statusCode).toBe(201);
    const notebook = body(NotebookSchema, created);
    expect(notebook.title).toBe('Seminar Stochastik');
    expect(notebook.sourceCount).toBe(0);

    const list = await app.inject({ method: 'GET', url: '/v1/notebooks', headers: auth });
    expect(body(NotebookListResponseSchema, list).notebooks).toHaveLength(1);

    const removed = await app.inject({
      method: 'DELETE',
      url: `/v1/notebooks/${notebook.id}`,
      headers: auth,
    });
    expect(removed.statusCode).toBe(204);
    const after = await app.inject({ method: 'GET', url: '/v1/notebooks', headers: auth });
    expect(body(NotebookListResponseSchema, after).notebooks).toHaveLength(0);
  });

  it('zerlegt eine neue Quelle sofort in Abschnitte', async () => {
    const notebook = body(
      NotebookSchema,
      await app.inject({
        method: 'POST',
        url: '/v1/notebooks',
        headers: auth,
        payload: { title: 'Test' },
      }),
    );
    const created = await app.inject({
      method: 'POST',
      url: `/v1/notebooks/${notebook.id}/sources`,
      headers: auth,
      payload: exampleSource(0),
    });
    expect(created.statusCode).toBe(201);
    const source = body(SourceSchema, created);
    expect(source.chunkCount).toBeGreaterThan(3);
    expect(source.selected).toBe(true);
  });

  it('weist eine Quelle ohne Text ab', async () => {
    const notebook = body(
      NotebookSchema,
      await app.inject({
        method: 'POST',
        url: '/v1/notebooks',
        headers: auth,
        payload: { title: 'Test' },
      }),
    );
    const response = await app.inject({
      method: 'POST',
      url: `/v1/notebooks/${notebook.id}/sources`,
      headers: auth,
      payload: { title: 'leer.md', kind: 'markdown', content: '   \n\n  ' },
    });
    expect(response.statusCode).toBe(400);
  });

  it('exportiert das Notebook als Markdown', async () => {
    const notebook = body(
      NotebookSchema,
      await app.inject({
        method: 'POST',
        url: '/v1/notebooks',
        headers: auth,
        payload: { title: 'Exporttest' },
      }),
    );
    await app.inject({
      method: 'POST',
      url: `/v1/notebooks/${notebook.id}/sources`,
      headers: auth,
      payload: exampleSource(0),
    });
    await app.inject({
      method: 'POST',
      url: `/v1/notebooks/${notebook.id}/notes`,
      headers: auth,
      payload: {
        title: 'Widerspruchsfrist',
        body: 'Vierzehn Tage [1].',
        citations: [],
        question: 'Wie lange?',
      },
    });

    const response = await app.inject({
      method: 'GET',
      url: `/v1/notebooks/${notebook.id}/export`,
      headers: auth,
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.body).toContain('# Exporttest');
    expect(response.body).toContain('Widerspruchsfrist');
    expect(response.body).toContain('Widerspruchsfrist betraegt vierzehn Tage');
  });
});

describe('Quellenbasierte Antwort', () => {
  let app: FastifyInstance;
  let auth: { authorization: string };
  let notebookId: string;
  let sourceIds: string[];

  async function setup(llm?: LlmProvider): Promise<void> {
    const ctx = makeContext(llm);
    const started = await start(ctx);
    app = started.app;
    auth = { authorization: `Bearer ${started.token}` };
    const notebook = body(
      NotebookSchema,
      await app.inject({
        method: 'POST',
        url: '/v1/notebooks',
        headers: auth,
        payload: { title: 'Pruefungsrecht' },
      }),
    );
    notebookId = notebook.id;
    sourceIds = [];
    for (const source of EXAMPLE_SOURCES) {
      const created = await app.inject({
        method: 'POST',
        url: `/v1/notebooks/${notebookId}/sources`,
        headers: auth,
        payload: source,
      });
      sourceIds.push(body(SourceSchema, created).id);
    }
  }

  afterEach(async () => {
    await app.close();
  });

  async function askQuestion(question: string, ids: string[] = sourceIds) {
    const response = await app.inject({
      method: 'POST',
      url: `/v1/notebooks/${notebookId}/ask`,
      headers: auth,
      payload: { question, sourceIds: ids },
    });
    return body(AskResponseSchema, response);
  }

  it('findet die passende Stelle und belegt sie zeichengenau', async () => {
    // Zuerst wird abgerufen, damit der Test nicht annimmt, welcher Abschnitt
    // oben landet. Das woertliche Zitat wird dann unter der Nummer angegeben,
    // die dieser Abschnitt im Abruf tatsaechlich bekommen hat.
    await setup(new ScriptedProvider({ grounded: true, answer: 'Platzhalter.', quotes: {} }));
    const probe = await askQuestion('Wie lange ist die Widerspruchsfrist?');
    const index = probe.retrieved.findIndex((c) => c.text.includes('vierzehn Tage'));
    expect(index).toBeGreaterThanOrEqual(0);
    const marker = String(index + 1);
    await app.close();

    await setup(
      new ScriptedProvider({
        grounded: true,
        answer: `Die Widerspruchsfrist betraegt vierzehn Tage ab Bekanntgabe [${marker}].`,
        quotes: { [marker]: 'betraegt vierzehn Tage ab Bekanntgabe der Bewertung' },
      }),
    );
    const result = await askQuestion('Wie lange ist die Widerspruchsfrist?');

    expect(result.grounded).toBe(true);
    expect(result.citations).toHaveLength(1);
    const citation = result.citations[0]!;
    expect(citation.precision).toBe('exact');
    expect(citation.excerpt).toContain('vierzehn Tage');

    // Die Offsets muessen im Originaltext der Quelle genau den Beleg treffen.
    const source = await app.inject({
      method: 'GET',
      url: `/v1/sources/${citation.sourceId}`,
      headers: auth,
    });
    const content = body(z.object({ content: z.string() }), source).content;
    expect(content.slice(citation.startOffset, citation.endOffset)).toBe(citation.excerpt);
  });

  it('entfernt einen erfundenen Beleg, bevor die Antwort das Backend verlaesst', async () => {
    await setup(
      new ScriptedProvider({
        grounded: true,
        answer: 'Die Frist betraegt vierzehn Tage [1]. Zusaetzlich verfaellt der Anspruch [99].',
        quotes: { '1': 'vierzehn Tage' },
      }),
    );
    const result = await askQuestion('Wie lange ist die Widerspruchsfrist?');

    expect(result.answer).not.toContain('[99]');
    expect(result.droppedMarkers).toContain(99);
    for (const citation of result.citations) {
      expect(result.retrieved.some((r) => r.id === citation.chunkId)).toBe(true);
    }
  });

  it('beruecksichtigt nur ausgewaehlte Quellen', async () => {
    const provider = new ScriptedProvider({ grounded: true, answer: 'Antwort [1].', quotes: {} });
    await setup(provider);
    const onlyFirst = sourceIds.slice(0, 1);
    const result = await askQuestion('Was steht zur Einsicht in die Pruefungsakte?', onlyFirst);
    for (const chunk of result.retrieved) {
      expect(onlyFirst).toContain(chunk.sourceId);
    }
  });

  it('antwortet ohne ausgewaehlte Quelle mit einer Auskunft statt mit Modellwissen', async () => {
    const provider = new ScriptedProvider({
      grounded: true,
      answer: 'Sollte nie erscheinen [1].',
      quotes: {},
    });
    await setup(provider);
    const result = await askQuestion('Wie lange ist die Widerspruchsfrist?', []);

    expect(result.grounded).toBe(false);
    expect(result.citations).toHaveLength(0);
    expect(result.answer).toContain('keine Quelle ausgewaehlt');
    // Entscheidend: das Modell wurde gar nicht erst gefragt.
    expect(provider.lastRequest).toBeNull();
  });

  it('sagt bei fehlender Deckung, dass die Quellen das nicht hergeben', async () => {
    const provider = new ScriptedProvider({ grounded: true, answer: 'Erfunden [1].', quotes: {} });
    await setup(provider);
    const result = await askQuestion('Wie hoch ist die Mehrwertsteuer auf Kaffeebohnen?');

    expect(result.grounded).toBe(false);
    expect(result.citations).toHaveLength(0);
    expect(provider.lastRequest).toBeNull();
  });

  it('kennzeichnet den Offline-Modus als simuliert', async () => {
    await setup();
    const result = await askQuestion('Wie lange ist die Widerspruchsfrist?');
    expect(result.simulated).toBe(true);
    expect(result.grounded).toBe(false);
    expect(result.answer).toContain('kein Sprachmodell verbunden');
  });
});
