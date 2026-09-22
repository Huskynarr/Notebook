import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiErrorSchema, LoginResponseSchema, MAX_SOURCE_BYTES } from '@notebook/shared';
import type { FastifyInstance } from 'fastify';
import { loadConfig } from './config.ts';
import { createContext, type AppContext } from './context.ts';
import { openDatabase } from './db/database.ts';
import { LoginThrottle } from './loginThrottle.ts';
import { buildServer } from './server.ts';

const env = {
  AUTH_SECRET: 'test-only-stable-secret-of-at-least-32-characters',
  SEED_ON_EMPTY: 'false',
};

describe('Persistente Login-Drossel', () => {
  it('wartet nach drei Fehlern, verdoppelt bis 15 Minuten und setzt nach Erfolg zurück', () => {
    const db = openDatabase(':memory:');
    try {
      const limiter = new LoginThrottle(db);
      let now = 1_000_000;
      expect(limiter.failure('192.0.2.1', now)).toBeNull();
      expect(limiter.failure('192.0.2.1', now)).toBeNull();
      expect(limiter.failure('192.0.2.1', now)?.retryAfterSeconds).toBe(30);
      expect(limiter.check('192.0.2.1', now + 1001)?.retryAfterSeconds).toBe(29);
      now += 30_000;
      expect(limiter.check('192.0.2.1', now)).toBeNull();
      for (const expected of [60, 120, 240, 480, 900, 900]) {
        expect(limiter.failure('192.0.2.1', now)?.retryAfterSeconds).toBe(expected);
        now += expected * 1000;
      }
      limiter.success('192.0.2.1');
      expect(limiter.failure('192.0.2.1', now)).toBeNull();
    } finally {
      db.close();
    }
  });

  it('übersteht Neustarts und begrenzt wechselnde IPs am gemeinsamen Konto', () => {
    const dir = mkdtempSync(join(tmpdir(), 'notebook-security-'));
    const path = join(dir, 'state.sqlite');
    try {
      const firstDb = openDatabase(path);
      const first = new LoginThrottle(firstDb);
      first.failure('192.0.2.1', 1_000_000);
      first.failure('192.0.2.2', 1_000_000);
      first.failure('192.0.2.3', 1_000_000);
      firstDb.close();
      const secondDb = openDatabase(path);
      try {
        expect(new LoginThrottle(secondDb).check('192.0.2.4', 1_001_000)?.retryAfterSeconds).toBe(
          29,
        );
        expect(new LoginThrottle(secondDb).check('192.0.2.4', 100_000_000)).toBeNull();
      } finally {
        secondDb.close();
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('Sicherer API-Vertrag', () => {
  let app: FastifyInstance;
  let ctx: AppContext;
  beforeEach(async () => {
    ctx = createContext(loadConfig(env), openDatabase(':memory:'));
    app = await buildServer(ctx);
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await app.close();
    ctx.db.close();
  });

  it('antwortet ab dem dritten Fehler mit synchronisierbarer Wartezeit und prüft gesperrte Passwörter nicht', async () => {
    const now = 1_800_000_000_000;
    const clock = vi.spyOn(Date, 'now').mockReturnValue(now);
    for (let attempt = 1; attempt <= 3; attempt++) {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: { username: `name-${attempt}`, password: 'wrong' },
      });
      expect(response.statusCode).toBe(attempt < 3 ? 401 : 429);
    }
    const authSpy = vi.spyOn(ctx.auth, 'login');
    const blocked = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { username: 'admin', password: 'admin' },
      headers: { 'x-forwarded-for': '192.0.2.70' },
    });
    expect(blocked.statusCode).toBe(429);
    expect(blocked.headers['retry-after']).toBe('30');
    expect(ApiErrorSchema.parse(blocked.json()).error).toMatchObject({
      code: 'rate_limited',
      retryAfterSeconds: 30,
      retryAt: new Date(now + 30_000).toISOString(),
    });
    expect(authSpy).not.toHaveBeenCalled();
    expect(blocked.body).not.toContain('admin');
    clock.mockReturnValue(now + 30_000);
    const accepted = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { username: 'admin', password: 'admin' },
    });
    expect(accepted.statusCode).toBe(200);
    expect(ctx.loginThrottle.check('127.0.0.1')).toBeNull();
  });

  it('vertraut ohne Opt-in keinem X-Forwarded-For und schreibt keine IP im Klartext in Loginzustand', async () => {
    await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      remoteAddress: '192.0.2.25',
      headers: { 'x-forwarded-for': '198.51.100.44' },
      payload: { username: 'admin', password: 'wrong' },
    });
    const buckets = ctx.db.prepare('SELECT bucket FROM login_attempts').all();
    expect(buckets).toHaveLength(2);
    expect(JSON.stringify(buckets)).not.toContain('192.0.2.25');
    expect(JSON.stringify(buckets)).not.toContain('198.51.100.44');
    expect(ctx.loginThrottle.failure('192.0.2.25')).toBeNull();
    const rows = ctx.db.prepare('SELECT failures FROM login_attempts ORDER BY failures').all();
    expect(rows.map((row) => row['failures'])).toEqual([2, 2]);
  });

  it('schützt alle CRUD- und Export-Routen auch vor dem Parsen übergroßer Bodies', async () => {
    for (const [method, url] of [
      ['GET', '/v1/notebooks'],
      ['POST', '/v1/notebooks'],
      ['GET', '/v1/sources/x'],
      ['PATCH', '/v1/sources/x'],
      ['DELETE', '/v1/sources/x'],
      ['GET', '/v1/notebooks/x/export'],
      ['POST', '/v1/notebooks/x/ask'],
      ['POST', '/v1/notebooks/x/notes'],
    ] as const) {
      const response = await app.inject({ method, url });
      expect(response.statusCode, `${method} ${url}`).toBe(401);
      expect(response.headers['cache-control']).toBe('no-store');
    }
    const huge = await app.inject({
      method: 'POST',
      url: '/v1/notebooks',
      payload: { title: 'x'.repeat(1024 * 1024 + 1) },
    });
    expect(huge.statusCode).toBe(401);
  });

  it('verwendet 400/413/415 für fehlerhafte HTTP-Eingaben statt eines internen Fehlers', async () => {
    const malformed = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: '{',
    });
    expect(malformed.statusCode).toBe(400);
    const large = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { username: 'x'.repeat(10_000), password: 'x' },
    });
    expect(large.statusCode).toBe(413);
    const wrongType = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      headers: { 'content-type': 'application/octet-stream' },
      payload: 'binary',
    });
    expect(wrongType.statusCode).toBe(415);
  });

  it('begrenzt ein Notebook auf 100 Quellen, sodass jede zulässige Auswahl abfragbar bleibt', async () => {
    const login = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { username: 'admin', password: 'admin' },
    });
    const { token } = LoginResponseSchema.parse(login.json());
    const notebook = ctx.notebooks.create('Anzahlgrenze');
    for (let index = 0; index < 100; index++) {
      ctx.sources.create({
        notebookId: notebook.id,
        title: `Quelle ${index}`,
        kind: 'text',
        content: 'Eine kurze Quelle mit Beleg.',
      });
    }
    const result = await app.inject({
      method: 'POST',
      url: `/v1/notebooks/${notebook.id}/sources`,
      headers: { authorization: `Bearer ${token}` },
      payload: { kind: 'text', title: 'Quelle 101', content: 'Zusätzlicher Inhalt' },
    });
    expect(result.statusCode).toBe(409);
    expect(ctx.sources.listByNotebook(notebook.id)).toHaveLength(100);
  });

  it('begrenzt den gesamten Quellenspeicher und legt abgewiesene Inhalte nicht an', async () => {
    const login = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { username: 'admin', password: 'admin' },
    });
    const { token } = LoginResponseSchema.parse(login.json());
    const notebook = ctx.notebooks.create('Speichergrenze');
    vi.spyOn(ctx.sources, 'totalContentBytes').mockReturnValue(200 * 1024 * 1024 - 2);
    const result = await app.inject({
      method: 'POST',
      url: `/v1/notebooks/${notebook.id}/sources`,
      headers: { authorization: `Bearer ${token}` },
      payload: { kind: 'text', title: 'Test', content: 'mehr als zwei Bytes' },
    });
    expect(result.statusCode).toBe(413);
    expect(ApiErrorSchema.parse(result.json()).error.code).toBe('storage_limit');
    expect(ctx.sources.listByNotebook(notebook.id)).toHaveLength(0);
  });

  it('misst UTF-8-Bytes, akzeptiert exakt 10 MiB und verwirft größere oder binäre Quellen', async () => {
    const login = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { username: 'admin', password: 'admin' },
    });
    const { token } = LoginResponseSchema.parse(login.json());
    const headers = { authorization: `Bearer ${token}` };
    const notebook = ctx.notebooks.create('Grenztest');
    const create = vi.spyOn(ctx.sources, 'create');
    // A short chunker input would miss the exact byte boundary. Repository creation
    // is spied here to isolate transport validation from its independently tested chunker.
    create.mockImplementation((input) => ({
      id: 'securitysource',
      notebookId: input.notebookId,
      title: input.title,
      kind: input.kind,
      origin: null,
      wordCount: 1,
      selected: true,
      chunkCount: 1,
      createdAt: new Date().toISOString(),
    }));
    const send = (content: string) =>
      app.inject({
        method: 'POST',
        url: `/v1/notebooks/${notebook.id}/sources`,
        headers,
        payload: { kind: 'text', title: 'Test.txt', content },
      });
    expect((await send('ü'.repeat(MAX_SOURCE_BYTES / 2))).statusCode).toBe(201);
    expect((await send('ü'.repeat(MAX_SOURCE_BYTES / 2) + 'a')).statusCode).toBe(413);
    expect((await send('hello\u0000binary')).statusCode).toBe(400);
    expect(create).toHaveBeenCalledTimes(1);
  });
});

describe('Konfigurationsgrenzen', () => {
  it('verlangt in Produktion eigene Zugangsdaten und ein stabiles Geheimnis', () => {
    expect(() => loadConfig({ NODE_ENV: 'production' })).toThrow('AUTH_PASSWORD');
    expect(() =>
      loadConfig({ NODE_ENV: 'production', AUTH_PASSWORD: 'a-long-local-test-password' }),
    ).toThrow('AUTH_SECRET');
    expect(
      loadConfig({ ...env, NODE_ENV: 'production', AUTH_PASSWORD: 'a-long-local-test-password' })
        .NODE_ENV,
    ).toBe('production');
  });
  it('akzeptiert nur explizite Proxy-Adressen und vollständige CORS-Origins', () => {
    expect(loadConfig({ TRUST_PROXY: '127.0.0.1,::1,10.20.0.0/16' }).TRUST_PROXY).toEqual([
      '127.0.0.1',
      '::1',
      '10.20.0.0/16',
    ]);
    for (const value of [
      'true',
      '*',
      'loopback',
      '127.0.0.1/33',
      '0.0.0.0/0',
      '::/0',
      '127.0.0.1,',
      'hostname',
    ]) {
      expect(() => loadConfig({ TRUST_PROXY: value })).toThrow('TRUST_PROXY');
    }
    for (const value of ['*', 'https://user:pass@example.org', 'https://example.org/path']) {
      expect(() => loadConfig({ CORS_ORIGIN: value })).toThrow('CORS_ORIGIN');
    }
  });
});
