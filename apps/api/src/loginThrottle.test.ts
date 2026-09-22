import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { loadConfig } from './config.ts';
import { createContext, type AppContext } from './context.ts';
import { openDatabase } from './db/database.ts';
import { LoginThrottle } from './loginThrottle.ts';
import { buildServer } from './server.ts';

describe('Kontogrenzen der Login-Drossel', () => {
  it('isoliert Konten bei verschiedenen IPs und setzt nur das erfolgreich angemeldete Konto zurück', () => {
    const db = openDatabase(':memory:');
    try {
      const throttle = new LoginThrottle(db);
      const now = 1_000_000;
      for (const ip of ['192.0.2.1', '192.0.2.2', '192.0.2.3']) {
        throttle.failure(ip, 'first-user', now);
      }
      expect(throttle.check('192.0.2.4', 'first-user', now)?.retryAfterSeconds).toBe(30);
      expect(throttle.check('192.0.2.4', 'second-user', now)).toBeNull();
      throttle.failure('192.0.2.4', 'second-user', now);
      throttle.success('192.0.2.4', 'second-user');
      expect(throttle.check('192.0.2.4', 'second-user', now)).toBeNull();
      expect(throttle.check('192.0.2.4', 'first-user', now)?.retryAfterSeconds).toBe(30);
      const stored = JSON.stringify(db.prepare('SELECT bucket FROM login_attempts').all());
      expect(stored).not.toContain('first-user');
      expect(stored).not.toContain('second-user');
      expect(stored).not.toContain('192.0.2.');
    } finally {
      db.close();
    }
  });

  it('verhindert das Umgehen der IP-Sperre durch einen Wechsel des Benutzernamens', () => {
    const db = openDatabase(':memory:');
    try {
      const throttle = new LoginThrottle(db);
      const now = 1_000_000;
      throttle.failure('192.0.2.1', 'first-user', now);
      throttle.failure('192.0.2.1', 'second-user', now);
      expect(throttle.failure('192.0.2.1', null, now)?.retryAfterSeconds).toBe(30);
      expect(throttle.check('192.0.2.1', 'first-user', now)?.retryAfterSeconds).toBe(30);
      expect(throttle.check('192.0.2.1', 'second-user', now)?.retryAfterSeconds).toBe(30);
      expect(throttle.check('192.0.2.2', 'first-user', now)).toBeNull();
    } finally {
      db.close();
    }
  });
});

describe('API mit mehreren konfigurierten Zugängen', () => {
  let app: FastifyInstance;
  let ctx: AppContext;
  beforeEach(async () => {
    const config = loadConfig({
      AUTH_USERNAME: 'first-user',
      AUTH_PASSWORD: 'first-test-password',
      AUTH_ADDITIONAL_USERS: JSON.stringify([
        { username: 'second-user', password: 'second-test-password' },
      ]),
      AUTH_SECRET: 'test-only-stable-secret-at-least-32-characters',
      SEED_ON_EMPTY: 'false',
    });
    ctx = createContext(config, openDatabase(':memory:'));
    app = await buildServer(ctx);
    vi.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000);
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await app.close();
    ctx.db.close();
  });

  it('sperrt verteilte Fehlversuche am Zielkonto und erlaubt weiterhin das andere Konto', async () => {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        remoteAddress: `192.0.2.${attempt}`,
        payload: { username: 'first-user', password: 'wrong' },
      });
      expect(response.statusCode).toBe(attempt < 3 ? 401 : 429);
    }
    const login = vi.spyOn(ctx.auth, 'login');
    const blocked = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      remoteAddress: '192.0.2.4',
      payload: { username: 'first-user', password: 'first-test-password' },
    });
    expect(blocked.statusCode).toBe(429);
    expect(blocked.headers['retry-after']).toBe('30');
    expect(login).not.toHaveBeenCalled();
    const accepted = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      remoteAddress: '192.0.2.4',
      payload: { username: 'second-user', password: 'second-test-password' },
    });
    expect(accepted.statusCode).toBe(200);
    expect(ctx.loginThrottle.check('192.0.2.4', 'first-user')?.retryAfterSeconds).toBe(30);
    expect(ctx.loginThrottle.check('192.0.2.4', 'second-user')).toBeNull();
  });

  it('fasst wechselnde unbekannte Namen in einem gemeinsamen Bucket zusammen', async () => {
    for (let attempt = 1; attempt <= 6; attempt++) {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        remoteAddress: `192.0.2.${attempt}`,
        payload: { username: `unknown-${attempt}`, password: 'wrong' },
      });
      expect(response.statusCode).toBe(attempt < 3 ? 401 : 429);
    }
    const buckets = ctx.db.prepare('SELECT bucket FROM login_attempts').all();
    expect(buckets).toHaveLength(4); // One unknown account, three failed client IPs.
    expect(buckets.filter((row) => row['bucket'] === 'unknown-account')).toHaveLength(1);
    const accepted = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      remoteAddress: '192.0.2.7',
      payload: { username: 'first-user', password: 'first-test-password' },
    });
    expect(accepted.statusCode).toBe(200);
  });
});
