import type { Db } from './db/database.ts';

/** Shared demo account: persistent spend ceiling, process-local concurrency.
 * Run a single API process per SQLite database (see deployment guide). */
export class AskBudget {
  private readonly db: Db;
  private active = 0;

  constructor(db: Db) {
    this.db = db;
    db.exec(`CREATE TABLE IF NOT EXISTS ask_budget (
      period TEXT PRIMARY KEY, used INTEGER NOT NULL, expires INTEGER NOT NULL
    )`);
  }

  acquire(now = Date.now()): { retryAfterSeconds: number } | { release: () => void } {
    if (this.active >= 2) return { retryAfterSeconds: 5 };
    const windows = [
      { key: 'minute', duration: 60_000, limit: 10 },
      { key: 'day', duration: 86_400_000, limit: 100 },
    ];
    this.db.prepare('DELETE FROM ask_budget WHERE expires <= ?').run(now);
    for (const window of windows) {
      const entry = this.db
        .prepare('SELECT used, expires FROM ask_budget WHERE period = ?')
        .get(window.key);
      if (Number(entry?.['used'] ?? 0) >= window.limit) {
        return {
          retryAfterSeconds: Math.max(1, Math.ceil((Number(entry?.['expires']) - now) / 1000)),
        };
      }
    }
    for (const window of windows) {
      this.db
        .prepare(
          `INSERT INTO ask_budget(period, used, expires) VALUES (?, 1, ?)
        ON CONFLICT(period) DO UPDATE SET used = used + 1`,
        )
        .run(window.key, now + window.duration);
    }
    this.active += 1;
    let released = false;
    return {
      release: () => {
        if (!released) {
          this.active -= 1;
          released = true;
        }
      },
    };
  }
}
