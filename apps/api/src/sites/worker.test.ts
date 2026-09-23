import { DatabaseSync, type StatementSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MAX_SOURCE_BYTES, type AskResponse, type SourceContent } from '@notebook/shared';
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
    AUTH_USERNAME: 'Huskynar',
    AUTH_PASSWORD: 'local-only-passphrase-with-length',
    AUTH_ADDITIONAL_USERS: JSON.stringify([
      { username: 'everlabs', password: 'local-second-account-passphrase-only' },
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
  username = 'Huskynar',
  password = 'local-only-passphrase-with-length',
): Promise<string> {
  const response = await call(env, '/v1/auth/login', 'POST', undefined, { username, password });
  expect(response.status).toBe(200);
  const body = (await response.json()) as { token: string };
  return body.token;
}

describe('Sites Worker API and durable SQLite-compatible state', () => {
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
    const other = await signIn(env, 'everlabs', 'local-second-account-passphrase-only');
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
        username: 'Huskynar',
        password: 'false-password',
      });
      expect(response.status).toBe(status);
      if (status === 429)
        expect(Number(response.headers.get('Retry-After'))).toBeGreaterThanOrEqual(29);
    }
    const stillBlocked = await call(env, '/v1/auth/login', 'POST', undefined, {
      username: 'Huskynar',
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
          username: 'Huskynar',
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
      question: 'Wie lang ist die Widerspruchsfrist?',
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
      title: 'Frist',
      body: 'Nachprüfbarer Auszug',
      citations: answer.citations,
      question: 'Widerspruchsfrist?',
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
                      answer: 'Vierzehn Tage [1].',
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
      question: 'Wie lang ist die Widerspruchsfrist?',
      sourceIds: sources.sources.map((s) => s.id),
    });
    expect(response.status).toBe(200);
    const answer = (await response.json()) as AskResponse;
    expect(answer.simulated).toBe(false);
    expect(answer.grounded).toBe(false);
    expect(answer.citations).toHaveLength(0);
    expect(answer.answer).toContain('keine Antwort freigegeben');
  });
});
