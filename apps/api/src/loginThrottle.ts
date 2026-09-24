import { createHash } from 'node:crypto';
import type { Db } from './db/database.ts';

const RESET_AFTER_MS = 24 * 60 * 60 * 1000;
const MAX_DELAY_SECONDS = 15 * 60;

export interface LoginCooldown {
  retryAfterSeconds: number;
  retryAt: string;
}

/** SQLite preserves the delay across restarts. Per-account and IP buckets
 * prevent rotating usernames or client addresses. Callers pass only a configured
 * username, or null for all unknown names. Only hashes are stored. */
export class LoginThrottle {
  private readonly db: Db;

  constructor(db: Db) {
    this.db = db;
    db.exec(`CREATE TABLE IF NOT EXISTS login_attempts (
      bucket TEXT PRIMARY KEY,
      failures INTEGER NOT NULL,
      blocked_until INTEGER NOT NULL,
      last_failure INTEGER NOT NULL
    )`);
  }

  check(ip: string, username: string | null, now = Date.now()): LoginCooldown | null {
    this.prune(now);
    let blockedUntil = 0;
    for (const bucket of this.buckets(ip, username)) {
      const row = this.db
        .prepare('SELECT blocked_until FROM login_attempts WHERE bucket = ?')
        .get(bucket);
      const until = Number(row?.['blocked_until'] ?? 0);
      blockedUntil = Math.max(blockedUntil, until);
    }
    return blockedUntil > now
      ? {
          retryAfterSeconds: Math.ceil((blockedUntil - now) / 1000),
          retryAt: new Date(blockedUntil).toISOString(),
        }
      : null;
  }

  failure(ip: string, username: string | null, now = Date.now()): LoginCooldown | null {
    this.prune(now);
    for (const bucket of this.buckets(ip, username)) {
      const row = this.db
        .prepare('SELECT failures FROM login_attempts WHERE bucket = ?')
        .get(bucket);
      const failures = Math.min(Number(row?.['failures'] ?? 0) + 1, 32);
      const delay = failures < 3 ? 0 : Math.min(30 * 2 ** (failures - 3), MAX_DELAY_SECONDS);
      this.db
        .prepare(
          `INSERT INTO login_attempts(bucket, failures, blocked_until, last_failure)
        VALUES (?, ?, ?, ?) ON CONFLICT(bucket) DO UPDATE SET failures=excluded.failures,
        blocked_until=excluded.blocked_until, last_failure=excluded.last_failure`,
        )
        .run(bucket, failures, now + delay * 1000, now);
    }
    return this.check(ip, username, now);
  }

  success(ip: string, username: string): void {
    for (const bucket of this.buckets(ip, username)) {
      this.db.prepare('DELETE FROM login_attempts WHERE bucket = ?').run(bucket);
    }
  }

  private buckets(ip: string, username: string | null): string[] {
    return [
      username === null
        ? 'unknown-account'
        : `account:${createHash('sha256').update(username).digest('hex')}`,
      `ip:${createHash('sha256').update(ip).digest('hex')}`,
    ];
  }

  private prune(now: number): void {
    this.db.prepare('DELETE FROM login_attempts WHERE last_failure < ?').run(now - RESET_AFTER_MS);
  }
}
