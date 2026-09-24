import { DatabaseSync, type StatementSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  EXAMPLE_NOTEBOOK_TITLE,
  MAX_SOURCE_BYTES,
  type AskResponse,
  type SourceContent,
} from '@notebook/shared';
import { handleApi } from './api.ts';
import type { Bucket, Database, SiteEnv, Statement } from './db.ts';

type Value = string | number | null;
class TestStatement implements Statement {
  private readonly stmt: StatementSync;
  private values: Value[] = [];
  constructor(stmt: StatementSync) {
    this.stmt = stmt;
  }
  bind(...values: Value[]): Statement {
    this.values = values;
    return this;
  }
  first(): Promise<Record<string, unknown> | null> {
    return Promise.resolve(
      (this.stmt.get(...this.values) ?? null) as Record<string, unknown> | null,
    );
  }
  all(): Promise<{ results: Record<string, unknown>[] }> {
    return Promise.resolve({ results: this.stmt.all(...this.values) });
  }
  run(): Promise<{ meta: { changes: number } }> {
    return Promise.resolve({ meta: { changes: Number(this.stmt.run(...this.values).changes) } });
  }
}

class TestDb implements Database {
  readonly raw = new DatabaseSync(':memory:');
  constructor() {
    this.raw.exec('PRAGMA foreign_keys=ON');
    this.raw.exec(
      readFileSync(new URL('../../../../drizzle/0000_sites.sql', import.meta.url), 'utf8'),
    );
  }
  prepare(sql: string): Statement {
    return new TestStatement(this.raw.prepare(sql));
  }
  async batch(statements: Statement[]): Promise<unknown[]> {
    this.raw.exec('BEGIN');
    try {
      const results: unknown[] = [];
      for (const statement of statements) results.push(await statement.run());
      this.raw.exec('COMMIT');
      return results;
    } catch (error) {
      this.raw.exec('ROLLBACK');
      throw error;
    }
  }
}

class TestBucket implements Bucket {
  readonly data = new Map<string, string>();
  put(key: string, value: string): Promise<unknown> {
    this.data.set(key, value);
    return Promise.resolve(undefined);
  }
  get(key: string): Promise<{ text(): Promise<string> } | null> {
    const value = this.data.get(key);
    return Promise.resolve(value === undefined ? null : { text: () => Promise.resolve(value) });
  }
  delete(key: string): Promise<void> {
    this.data.delete(key);
    return Promise.resolve();
  }
}

const dbs: TestDb[] = [];
afterEach(() => {
  vi.unstubAllGlobals();
  for (const db of dbs) db.raw.close();
  dbs.length = 0;
});
function setup(): SiteEnv {
  const DB = new TestDb();
  dbs.push(DB);
  return {
    DB,
    BUCKET: new TestBucket(),
    AUTH_USERNAME: 'Huskynarr',
    AUTH_PASSWORD: 'local-only-passphrase-with-length',
    AUTH_ADDITIONAL_USERS: JSON.stringify([
      { username: 'Everlast', password: 'local-second-account-passphrase-only' },
    ]),
    AUTH_SECRET: 'local-test-signing-secret-at-least-32-characters',
    LLM_PROVIDER: 'stub',
  };
}

function call(
  env: SiteEnv,
  path: string,
  method = 'GET',
  token?: string,
  data?: unknown,
): Promise<Response> {
  const headers: Record<string, string> = { 'CF-Connecting-IP': '203.0.113.18' };
  if (token) headers.authorization = `Bearer ${token}`;
  if (data !== undefined) headers['content-type'] = 'application/json';
  return handleApi(
    new Request(`https://notebook.example${path}`, {
      method,
      headers,
      ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
    }),
    env,
  );
}

async function signIn(
  env: SiteEnv,
  username = 'Huskynarr',
  password = 'local-only-passphrase-with-length',
): Promise<string> {
  const response = await call(env, '/v1/auth/login', 'POST', undefined, { username, password });
  expect(response.status).toBe(200);
  const body = (await response.json()) as { token: string };
  return body.token;
}

async function legacyExampleId(username: string): Promise<string> {
  const digest = new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(username)),
  );
  const key = Array.from(digest.slice(0, 12))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return `example_${key}`;
}

describe('Sites Worker API and durable SQLite-compatible state', () => {
  it('retains notebook and source IDs when both accounts are renamed', async () => {
    const env = setup();
    env.AUTH_USERNAME = 'Huskynar';
    env.AUTH_ADDITIONAL_USERS = JSON.stringify([
      { username: 'everlabs', password: 'local-second-account-passphrase-only' },
    ]);
    const oldPrimaryToken = await signIn(env, 'Huskynar');
    const oldSecondaryToken = await signIn(env, 'everlabs', 'local-second-account-passphrase-only');
    const firstId = await legacyExampleId('Huskynar');
    const secondId = await legacyExampleId('everlabs');
    for (const [id, owner] of [
      [firstId, 'Huskynar'],
      [secondId, 'everlabs'],
    ] as const) {
      (env.DB as TestDb).raw
        .prepare('INSERT INTO notebooks(id,owner,title,created_at,updated_at) VALUES(?,?,?,?,?)')
        .run(id, owner, 'Beispiel: Prüfungsrecht (erfundene Ordnung)', '2026-09-01', '2026-09-01');
    }
    const added = await call(env, `/v1/notebooks/${firstId}/sources`, 'POST', oldPrimaryToken, {
      kind: 'markdown',
      title: 'Alte Beispielquelle.md',
      content: '# Alter Inhalt\n\nDiese Quelle soll beim Kontenwechsel erhalten bleiben.',
    });
    expect(added.status).toBe(201);
    const secondarySource = await call(
      env,
      `/v1/notebooks/${secondId}/sources`,
      'POST',
      oldSecondaryToken,
      {
        kind: 'markdown',
        title: 'Zweite alte Beispielquelle.md',
        content: '# Alter Inhalt\n\nAuch die Quelle des zweiten Kontos bleibt erhalten.',
      },
    );
    expect(secondarySource.status).toBe(201);
    const secondarySourceId = ((await secondarySource.json()) as { id: string }).id;
    const oldSources = (await (
      await call(env, `/v1/notebooks/${firstId}/sources`, 'GET', oldPrimaryToken)
    ).json()) as { sources: Array<{ id: string }> };

    env.AUTH_USERNAME = 'Huskynarr';
    env.AUTH_ADDITIONAL_USERS = JSON.stringify([
      { username: 'Everlast', password: 'local-second-account-passphrase-only' },
    ]);
    expect((await call(env, '/v1/notebooks', 'GET', oldPrimaryToken)).status).toBe(401);
    const primaryToken = await signIn(env);
    const secondaryToken = await signIn(env, 'Everlast', 'local-second-account-passphrase-only');
    for (const [token, notebookId, expectedOwner] of [
      [primaryToken, firstId, 'Huskynarr'],
      [secondaryToken, secondId, 'Everlast'],
    ] as const) {
      const list = (await (await call(env, '/v1/notebooks', 'GET', token)).json()) as {
        notebooks: Array<{ id: string; title: string }>;
      };
      expect(list.notebooks).toHaveLength(2);
      expect(list.notebooks).toContainEqual(
        expect.objectContaining({
          id: notebookId,
          title: 'Archiv: Prüfungsrecht (erfundene Ordnung)',
        }),
      );
      expect(list.notebooks).toContainEqual(
        expect.objectContaining({ title: EXAMPLE_NOTEBOOK_TITLE }),
      );
      expect(
        (env.DB as TestDb).raw.prepare('SELECT owner FROM notebooks WHERE id=?').get(notebookId),
      ).toMatchObject({ owner: expectedOwner });
    }
    expect(
      (await call(env, `/v1/sources/${oldSources.sources[0]?.id}`, 'GET', primaryToken)).status,
    ).toBe(200);
    expect(
      (await call(env, `/v1/sources/${secondarySourceId}`, 'GET', secondaryToken)).status,
    ).toBe(200);
    expect((await call(env, `/v1/notebooks/${firstId}`, 'GET', secondaryToken)).status).toBe(404);
  });

  it('does not recreate the new example after deletion and keeps archived sources', async () => {
    const env = setup();
    const token = await signIn(env);
    const legacyId = await legacyExampleId('Huskynarr');
    (env.DB as TestDb).raw
      .prepare('INSERT INTO notebooks(id,owner,title,created_at,updated_at) VALUES(?,?,?,?,?)')
      .run(
        legacyId,
        'Huskynarr',
        'Beispiel: Prüfungsrecht (erfundene Ordnung)',
        '2026-09-01',
        '2026-09-01',
      );
    const sourceResponse = await call(env, `/v1/notebooks/${legacyId}/sources`, 'POST', token, {
      kind: 'markdown',
      title: 'Archivquelle.md',
      content:
        '# Bestehender Beleg\n\nDer archivierte Originaltext bleibt nach dem Wechsel verfügbar.',
    });
    expect(sourceResponse.status).toBe(201);
    const archivedSource = (await sourceResponse.json()) as { id: string };
    const readBooks = async (): Promise<Array<{ id: string; title: string }>> => {
      const response = await call(env, '/v1/notebooks', 'GET', token);
      expect(response.status).toBe(200);
      const result = (await response.json()) as {
        notebooks: Array<{ id: string; title: string }>;
      };
      return result.notebooks;
    };
    const first = await readBooks();
    expect(first).toHaveLength(2);
    const created = first.find((book) => book.title === EXAMPLE_NOTEBOOK_TITLE);
    expect(created?.id).toMatch(/^example_everlast_/);
    expect((await call(env, `/v1/notebooks/${created?.id}`, 'DELETE', token)).status).toBe(204);
    expect(await readBooks()).toEqual([
      expect.objectContaining({
        id: legacyId,
        title: 'Archiv: Prüfungsrecht (erfundene Ordnung)',
      }),
    ]);
    expect((await call(env, `/v1/sources/${archivedSource.id}`, 'GET', token)).status).toBe(200);
  });

  it('does not move notebooks while the former account still exists', async () => {
    const env = setup();
    env.AUTH_ADDITIONAL_USERS = JSON.stringify([
      { username: 'Huskynar', password: 'local-second-account-passphrase-only' },
    ]);
    (env.DB as TestDb).raw
      .prepare('INSERT INTO notebooks VALUES(?,?,?,?,?)')
      .run('old-book', 'Huskynar', 'Alt', '2026-09-01', '2026-09-01');
    const token = await signIn(env);
    const response = await call(env, '/v1/notebooks', 'GET', token);
    expect(response.status).toBe(200);
    expect(
      (env.DB as TestDb).raw.prepare('SELECT owner FROM notebooks WHERE id=?').get('old-book'),
    ).toMatchObject({
      owner: 'Huskynar',
    });
  });

  it('separates account data and seeds a real searchable example per user', async () => {
    const env = setup(),
      first = await signIn(env);
    const notebooks = (await (await call(env, '/v1/notebooks', 'GET', first)).json()) as {
      notebooks: Array<{ id: string }>;
    };
    expect(notebooks.notebooks).toHaveLength(1);
    const bookId = notebooks.notebooks[0]?.id ?? '';
    const sources = (await (
      await call(env, `/v1/notebooks/${bookId}/sources`, 'GET', first)
    ).json()) as {
      sources: Array<{ id: string }>;
    };
    expect(sources.sources).toHaveLength(2);
    const other = await signIn(env, 'Everlast', 'local-second-account-passphrase-only');
    expect((await call(env, `/v1/notebooks/${bookId}`, 'GET', other)).status).toBe(404);
    expect((await call(env, `/v1/sources/${sources.sources[0]?.id}`, 'GET', other)).status).toBe(
      404,
    );
    expect((await call(env, `/v1/notebooks/${bookId}/export`, 'GET', other)).status).toBe(404);
    expect((await call(env, '/v1/notebooks', 'GET', other)).status).toBe(200);
  });

  it('persists login cooldown after three failures and stops a correct password during the delay', async () => {
    const env = setup();
    for (const status of [401, 401, 429]) {
      const response = await call(env, '/v1/auth/login', 'POST', undefined, {
        username: 'Huskynarr',
        password: 'false-password',
      });
      expect(response.status).toBe(status);
      if (status === 429)
        expect(Number(response.headers.get('Retry-After'))).toBeGreaterThanOrEqual(29);
    }
    const stillBlocked = await call(env, '/v1/auth/login', 'POST', undefined, {
      username: 'Huskynarr',
      password: 'local-only-passphrase-with-length',
    });
    expect(stillBlocked.status).toBe(429);
    expect(
      (env.DB as TestDb).raw.prepare('SELECT MAX(failures) AS count FROM login_attempts').get()?.[
        'count'
      ],
    ).toBe(3);
  });

  it('counts simultaneous failed logins atomically across Worker requests', async () => {
    const env = setup();
    const attempts = await Promise.all(
      Array.from({ length: 3 }, () =>
        call(env, '/v1/auth/login', 'POST', undefined, {
          username: 'Huskynarr',
          password: 'false-password',
        }),
      ),
    );
    expect(attempts.some((response) => response.status === 429)).toBe(true);
    expect(
      (env.DB as TestDb).raw.prepare('SELECT MAX(failures) AS count FROM login_attempts').get()?.[
        'count'
      ],
    ).toBe(3);
  });

  it('checks original offsets, rejects forged note citations and exports the original', async () => {
    const env = setup(),
      token = await signIn(env);
    const list = (await (await call(env, '/v1/notebooks', 'GET', token)).json()) as {
      notebooks: Array<{ id: string }>;
    };
    const bookId = list.notebooks[0]?.id ?? '';
    const sources = (await (
      await call(env, `/v1/notebooks/${bookId}/sources`, 'GET', token)
    ).json()) as { sources: Array<{ id: string }> };
    const selected = sources.sources.map((source) => source.id);
    const response = await call(env, `/v1/notebooks/${bookId}/ask`, 'POST', token, {
      question: 'Wen nennt das Impressum unter Vertreten durch?',
      sourceIds: selected,
      language: 'de',
    });
    expect(response.status).toBe(200);
    const answer = (await response.json()) as AskResponse;
    expect(answer.simulated).toBe(true);
    expect(answer.retrieved.length).toBeGreaterThan(0);
    const firstCitation = answer.citations[0];
    expect(firstCitation).toBeDefined();
    const original = (await (
      await call(env, `/v1/sources/${firstCitation?.sourceId}`, 'GET', token)
    ).json()) as SourceContent;
    expect(original.content.slice(firstCitation?.startOffset, firstCitation?.endOffset)).toBe(
      firstCitation?.excerpt,
    );
    const noteData = {
      title: 'Angaben zur Vertretung',
      body: 'Nachprüfbarer Auszug',
      citations: answer.citations,
      question: 'Wer wird im Impressum als Vertretung genannt?',
    };
    const stored = await call(env, `/v1/notebooks/${bookId}/notes`, 'POST', token, noteData);
    expect(stored.status).toBe(201);
    const forged = await call(env, `/v1/notebooks/${bookId}/notes`, 'POST', token, {
      ...noteData,
      citations: [{ ...firstCitation, excerpt: 'erfunden' }],
    });
    expect(forged.status).toBe(400);
    const exportResult = await call(env, `/v1/notebooks/${bookId}/export`, 'GET', token);
    expect(exportResult.status).toBe(200);
    expect(await exportResult.text()).toContain(original.content);
  });

  it('sends only selected FTS hits to the optional embedding endpoint', async () => {
    const env = setup();
    env.EMBEDDING_PROVIDER = 'openrouter';
    env.OPENROUTER_EMBEDDING_KEY = 'server-only-test-key';
    const fetcher = vi.fn<typeof fetch>().mockImplementation((_url, init) => {
      const body = typeof init?.body === 'string' ? init.body : '';
      const input = (JSON.parse(body) as { input: string[] }).input;
      return Promise.resolve(
        Response.json({
          data: input.map((_text, index) => ({ index, embedding: [1, index + 1] })),
        }),
      );
    });
    vi.stubGlobal('fetch', fetcher);
    const token = await signIn(env);
    const list = (await (await call(env, '/v1/notebooks', 'GET', token)).json()) as {
      notebooks: Array<{ id: string }>;
    };
    const bookId = list.notebooks[0]?.id ?? '';
    const sources = (await (
      await call(env, `/v1/notebooks/${bookId}/sources`, 'GET', token)
    ).json()) as {
      sources: Array<{ id: string }>;
    };
    const selected = sources.sources[0]?.id ?? '';
    const response = await call(env, `/v1/notebooks/${bookId}/ask`, 'POST', token, {
      question: 'Everlast',
      sourceIds: [selected],
      language: 'de',
    });
    expect(response.status).toBe(200);
    const answer = (await response.json()) as AskResponse;
    expect(answer.simulated).toBe(true);
    expect(answer.retrieved.length).toBeGreaterThan(0);
    expect(answer.retrieved.every((chunk) => chunk.sourceId === selected)).toBe(true);
    expect(fetcher).toHaveBeenCalledOnce();
    const outgoing = fetcher.mock.calls[0]?.[1]?.body;
    const payload = typeof outgoing === 'string' ? outgoing : '';
    expect(payload).not.toContain('server-only-test-key');
    expect((await (await call(env, '/v1/health')).json()) as unknown).toMatchObject({
      embeddings: { configured: true, model: 'nvidia/llama-nemotron-embed-vl-1b-v2:free' },
    });
  });

  it('limits decoded source bytes, preserving a source beyond D1 single-cell capacity', async () => {
    const env = setup(),
      token = await signIn(env);
    const list = (await (await call(env, '/v1/notebooks', 'GET', token)).json()) as {
      notebooks: Array<{ id: string }>;
    };
    const bookId = list.notebooks[0]?.id ?? '';
    const content = `# Grenzen\n\n${'Text mit Quelle und Beleg. '.repeat(88_000)}`;
    expect(new TextEncoder().encode(content).byteLength).toBeGreaterThan(2_000_000);
    const uploaded = await call(env, `/v1/notebooks/${bookId}/sources`, 'POST', token, {
      title: 'Große Quelle.md',
      kind: 'markdown',
      content,
    });
    expect(uploaded.status).toBe(201);
    const item = (await uploaded.json()) as { id: string; chunkCount: number };
    expect(item.chunkCount).toBeGreaterThan(10);
    const read = (await (
      await call(env, `/v1/sources/${item.id}`, 'GET', token)
    ).json()) as SourceContent;
    expect(read.content).toBe(content);
    const tooLarge = await call(env, `/v1/notebooks/${bookId}/sources`, 'POST', token, {
      title: 'zu groß',
      kind: 'text',
      content: 'X'.repeat(MAX_SOURCE_BYTES + 1),
    });
    expect(tooLarge.status).toBe(413);
  });

  it('accepts exactly 10 MiB of UTF-8 text without truncating its original offsets', async () => {
    const env = setup(),
      token = await signIn(env);
    const list = (await (await call(env, '/v1/notebooks', 'GET', token)).json()) as {
      notebooks: Array<{ id: string }>;
    };
    const content = 'ä'.repeat(MAX_SOURCE_BYTES / 2);
    expect(new TextEncoder().encode(content).byteLength).toBe(MAX_SOURCE_BYTES);
    const bookId = list.notebooks[0]?.id ?? '';
    const result = await call(env, `/v1/notebooks/${bookId}/sources`, 'POST', token, {
      title: '10 MiB.md',
      kind: 'markdown',
      content,
    });
    expect(result.status).toBe(201);
    const source = (await result.json()) as { id: string; chunkCount: number };
    expect(source.chunkCount).toBeGreaterThan(1);
    const saved = (await (
      await call(env, `/v1/sources/${source.id}`, 'GET', token)
    ).json()) as SourceContent;
    expect(saved.content).toBe(content);
    const last = (env.DB as TestDb).raw
      .prepare(
        `SELECT text,start_offset,end_offset FROM chunks
      WHERE source_id=? ORDER BY ordinal DESC LIMIT 1`,
      )
      .get(source.id);
    expect(saved.content.slice(Number(last?.['start_offset']), Number(last?.['end_offset']))).toBe(
      last?.['text'],
    );
  });

  it('holds back a model claim when its quote is absent from the retrieved source', async () => {
    const env = setup();
    env.LLM_PROVIDER = 'openai';
    env.LLM_BASE_URL = 'https://model.example/v1';
    env.LLM_API_KEY = 'test-secret-server-only';
    env.LLM_MODEL = 'test-model';
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      grounded: true,
                      answer: 'Unbelegte Aussage über die Geschäftsführung [1].',
                      quotes: { '1': 'erfundenes Zitat ohne Quelle' },
                    }),
                  },
                  finish_reason: 'stop',
                },
              ],
            }),
            { headers: { 'content-type': 'application/json' } },
          ),
        ),
      ),
    );
    const token = await signIn(env);
    const list = (await (await call(env, '/v1/notebooks', 'GET', token)).json()) as {
      notebooks: Array<{ id: string }>;
    };
    const bookId = list.notebooks[0]?.id ?? '';
    const sources = (await (
      await call(env, `/v1/notebooks/${bookId}/sources`, 'GET', token)
    ).json()) as { sources: Array<{ id: string }> };
    const response = await call(env, `/v1/notebooks/${bookId}/ask`, 'POST', token, {
      question: 'Wen nennt das Impressum unter Vertreten durch?',
      sourceIds: sources.sources.map((s) => s.id),
    });
    expect(response.status).toBe(200);
    const answer = (await response.json()) as AskResponse;
    expect(answer.simulated).toBe(false);
    expect(answer.grounded).toBe(false);
    expect(answer.citations).toHaveLength(0);
    expect(answer.answer).toContain('keine Antwort freigegeben');
  });

  it('calls only free MiMo at the keyless Console endpoint and checks the citations', async () => {
    const env = setup();
    env.LLM_PROVIDER = 'openai';
    env.LLM_BASE_URL = 'https://opencode.ai/inference/openai/v1';
    env.LLM_MODEL = 'mimo-v2.6-flash-free';
    const outgoing = vi.fn<typeof fetch>().mockImplementation(() =>
      Promise.resolve(
        Response.json({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  grounded: true,
                  answer: 'Unbelegte Aussage [1].',
                  quotes: { '1': 'erfundenes Zitat' },
                }),
              },
              finish_reason: 'stop',
            },
          ],
        }),
      ),
    );
    vi.stubGlobal('fetch', outgoing);
    const health = (await (await call(env, '/v1/health')).json()) as {
      llm: { configured: boolean; model: string };
    };
    expect(health.llm).toMatchObject({ configured: true, model: 'mimo-v2.6-flash-free' });
    const token = await signIn(env);
    const list = (await (await call(env, '/v1/notebooks', 'GET', token)).json()) as {
      notebooks: Array<{ id: string }>;
    };
    const bookId = list.notebooks[0]?.id ?? '';
    const sources = (await (
      await call(env, `/v1/notebooks/${bookId}/sources`, 'GET', token)
    ).json()) as { sources: Array<{ id: string }> };
    const response = await call(env, `/v1/notebooks/${bookId}/ask`, 'POST', token, {
      question: 'Wen nennt das Impressum unter Vertreten durch?',
      sourceIds: sources.sources.map((source) => source.id),
    });
    expect(response.status).toBe(200);
    const result = (await response.json()) as AskResponse;
    expect(result).toMatchObject({ simulated: false, grounded: false, citations: [] });
    expect(outgoing).toHaveBeenCalledOnce();
    const [url, options] = outgoing.mock.calls[0]!;
    expect(url).toBe('https://opencode.ai/inference/openai/v1/chat/completions');
    expect(options?.headers).not.toHaveProperty('authorization');
    if (typeof options?.body !== 'string') throw new Error('JSON-Request-Body erwartet');
    const body = JSON.parse(options.body) as unknown;
    expect(body).toMatchObject({ model: 'mimo-v2.6-flash-free' });
    expect(body).not.toHaveProperty('response_format');
    env.LLM_API_KEY = 'test-key-must-not-leave-worker';
    const retry = await call(env, `/v1/notebooks/${bookId}/ask`, 'POST', token, {
      question: 'Wen nennt das Impressum unter Vertreten durch?',
      sourceIds: sources.sources.map((source) => source.id),
    });
    expect(retry.status).toBe(200);
    expect(outgoing.mock.calls[1]?.[1]?.headers).toMatchObject({
      authorization: `Bearer ${env.LLM_API_KEY}`,
    });
    expect(outgoing.mock.calls[1]?.[1]?.body).not.toContain(env.LLM_API_KEY);
    env.LLM_MODEL = 'muse-spark-1.3-contributor-free';
    outgoing.mockResolvedValueOnce(
      Response.json({
        status: 'completed',
        output: [
          {
            type: 'message',
            role: 'assistant',
            content: [
              {
                type: 'output_text',
                text: JSON.stringify({
                  grounded: true,
                  answer: 'Unbelegte Aussage [1].',
                  quotes: { '1': 'erfundenes Zitat' },
                }),
              },
            ],
          },
        ],
      }),
    );
    const muse = await call(env, `/v1/notebooks/${bookId}/ask`, 'POST', token, {
      question: 'Wen nennt das Impressum unter Vertreten durch?',
      sourceIds: sources.sources.map((source) => source.id),
    });
    expect(muse.status).toBe(200);
    expect((await muse.json()) as AskResponse).toMatchObject({
      simulated: false,
      grounded: false,
      citations: [],
    });
    expect(outgoing.mock.calls[2]?.[0]).toBe('https://opencode.ai/inference/openai/v1/responses');
    outgoing.mockResolvedValueOnce(
      new Response(null, {
        status: 307,
        headers: { location: 'https://other.example/chat' },
      }),
    );
    const redirected = await call(env, `/v1/notebooks/${bookId}/ask`, 'POST', token, {
      question: 'Wen nennt das Impressum unter Vertreten durch?',
      sourceIds: sources.sources.map((source) => source.id),
    });
    expect(redirected.status).toBe(503);
    expect(outgoing).toHaveBeenCalledTimes(4);
    expect(outgoing.mock.calls[3]?.[1]?.redirect).toBe('manual');
    env.LLM_MODEL = 'glm-5.3-flash';
    outgoing.mockResolvedValueOnce(
      Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify({
                grounded: true,
                answer: 'Unbelegte Aussage [1].',
                quotes: { '1': 'erfundenes Zitat' },
              }),
            },
            finish_reason: 'stop',
          },
        ],
      }),
    );
    const glm = await call(env, `/v1/notebooks/${bookId}/ask`, 'POST', token, {
      question: 'Wen nennt das Impressum unter Vertreten durch?',
      sourceIds: sources.sources.map((source) => source.id),
    });
    expect(glm.status).toBe(200);
    expect((await glm.json()) as AskResponse).toMatchObject({
      simulated: false,
      grounded: false,
      citations: [],
    });
    const [glmUrl, glmInit] = outgoing.mock.calls[4]!;
    expect(glmUrl).toBe('https://opencode.ai/inference/openai/v1/chat/completions');
    expect(glmInit?.headers).toMatchObject({ authorization: `Bearer ${env.LLM_API_KEY}` });
    if (typeof glmInit?.body !== 'string') throw new Error('JSON-Request-Body erwartet');
    expect(JSON.parse(glmInit.body) as unknown).toMatchObject({ model: 'glm-5.3-flash' });
    expect(JSON.parse(glmInit.body) as Record<string, unknown>).not.toHaveProperty(
      'response_format',
    );
    env.LLM_MODEL = 'nemotron-3.5-lightning-free';
    const nemotronHealth = (await (await call(env, '/v1/health')).json()) as {
      llm: { configured: boolean; model: string };
    };
    expect(nemotronHealth.llm).toMatchObject({
      configured: true,
      model: 'nemotron-3.5-lightning-free',
    });
    const nemotron = await call(env, `/v1/notebooks/${bookId}/ask`, 'POST', token, {
      question: 'Wen nennt das Impressum unter Vertreten durch?',
      sourceIds: sources.sources.map((source) => source.id),
    });
    expect(nemotron.status).toBe(200);
    expect((await nemotron.json()) as AskResponse).toMatchObject({
      simulated: false,
      grounded: false,
      citations: [],
    });
    const [nemotronUrl, nemotronInit] = outgoing.mock.calls[5]!;
    expect(nemotronUrl).toBe('https://opencode.ai/inference/openai/v1/chat/completions');
    expect(nemotronInit?.headers).not.toHaveProperty('authorization');
    if (typeof nemotronInit?.body !== 'string') throw new Error('JSON-Request-Body erwartet');
    expect(JSON.parse(nemotronInit.body) as unknown).toMatchObject({
      model: 'nemotron-3.5-lightning-free',
    });
  });

  it('marks confirmed external free-tier blocking and refuses repeated provider requests', async () => {
    const env = setup();
    env.LLM_PROVIDER = 'openai';
    env.LLM_BASE_URL = 'https://opencode.ai/inference/openai/v1';
    env.LLM_MODEL = 'mimo-v2.6-flash-free';
    env.LLM_ACCESS_STATUS = 'blocked';
    env.LLM_API_KEY = 'candidate-console-service-key';
    const outgoing = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', outgoing);
    const health = (await (await call(env, '/v1/health')).json()) as {
      llm: { configured: boolean; accessBlocked: boolean; model: string };
    };
    expect(health.llm).toMatchObject({
      configured: false,
      accessBlocked: true,
      model: 'mimo-v2.6-flash-free',
    });
    const token = await signIn(env);
    const list = (await (await call(env, '/v1/notebooks', 'GET', token)).json()) as {
      notebooks: Array<{ id: string }>;
    };
    const bookId = list.notebooks[0]?.id ?? '';
    const sources = (await (
      await call(env, `/v1/notebooks/${bookId}/sources`, 'GET', token)
    ).json()) as { sources: Array<{ id: string }> };
    const response = await call(env, `/v1/notebooks/${bookId}/ask`, 'POST', token, {
      question: 'Wen nennt das Impressum unter Vertreten durch?',
      sourceIds: sources.sources.map((source) => source.id),
    });
    expect(response.status).toBe(503);
    const body = (await response.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('llm_unavailable');
    expect(body.error.message).toContain('noch nicht erfolgreich geprüft');
    expect(outgoing).not.toHaveBeenCalled();
    env.LLM_MODEL = 'glm-5.3-flash';
    const blockedPaid = await call(env, `/v1/notebooks/${bookId}/ask`, 'POST', token, {
      question: 'Wen nennt das Impressum unter Vertreten durch?',
      sourceIds: sources.sources.map((source) => source.id),
    });
    expect(blockedPaid.status).toBe(503);
    expect(outgoing).not.toHaveBeenCalled();
    env.LLM_MODEL = 'muse-spark-1.3-contributor-free';
    const blockedMuse = await call(env, `/v1/notebooks/${bookId}/ask`, 'POST', token, {
      question: 'Wen nennt das Impressum unter Vertreten durch?',
      sourceIds: sources.sources.map((source) => source.id),
    });
    expect(blockedMuse.status).toBe(503);
    env.LLM_MODEL = 'nemotron-3.5-lightning-free';
    const blockedNemotron = await call(env, `/v1/notebooks/${bookId}/ask`, 'POST', token, {
      question: 'Wen nennt das Impressum unter Vertreten durch?',
      sourceIds: sources.sources.map((source) => source.id),
    });
    expect(blockedNemotron.status).toBe(503);
    expect(outgoing).not.toHaveBeenCalled();
  });

  it('rejects a different Console model before any provider call', async () => {
    const env = setup();
    env.LLM_PROVIDER = 'openai';
    env.LLM_BASE_URL = 'https://opencode.ai/inference/openai/v1';
    env.LLM_MODEL = 'paid-model';
    const outgoing = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', outgoing);
    const health = (await (await call(env, '/v1/health')).json()) as {
      llm: { configured: boolean };
    };
    expect(health.llm.configured).toBe(false);
    const token = await signIn(env);
    const list = (await (await call(env, '/v1/notebooks', 'GET', token)).json()) as {
      notebooks: Array<{ id: string }>;
    };
    const bookId = list.notebooks[0]?.id ?? '';
    const sources = (await (
      await call(env, `/v1/notebooks/${bookId}/sources`, 'GET', token)
    ).json()) as { sources: Array<{ id: string }> };
    const response = await call(env, `/v1/notebooks/${bookId}/ask`, 'POST', token, {
      question: 'Wen nennt das Impressum unter Vertreten durch?',
      sourceIds: sources.sources.map((source) => source.id),
    });
    expect(response.status).toBe(503);
    expect(outgoing).not.toHaveBeenCalled();
  });
});
