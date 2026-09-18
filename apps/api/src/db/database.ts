import { DatabaseSync } from 'node:sqlite';
import { randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Gekapselter Zugriff auf `node:sqlite`. Die Schnittstelle ist in Node 22 als
 *  experimentell gekennzeichnet (D-008); Aenderungen daran sollen nur diese
 *  Datei betreffen. */
export type Db = DatabaseSync;

const SCHEMA_VERSION = '1';

export function openDatabase(path: string): Db {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  const here = dirname(fileURLToPath(import.meta.url));
  migrieren(db);
  db.exec(readFileSync(join(here, 'schema.sql'), 'utf8'));
  db.prepare('INSERT OR REPLACE INTO schema_meta(key, value) VALUES (?, ?)').run(
    'version',
    SCHEMA_VERSION,
  );
  return db;
}

/** Bestehende Datenbanken auf den aktuellen Stand heben. CREATE TABLE IF NOT
 *  EXISTS greift bei vorhandenen Tabellen nicht mehr; Spalten und Constraints
 *  muessen einzeln nachgezogen werden. */
function migrieren(db: DatabaseSync): void {
  const tabellen = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'sources'")
    .all();
  if (tabellen.length === 0) return;
  const spalten = db.prepare('PRAGMA table_info(sources)').all() as Array<{ name: unknown }>;
  if (!spalten.some((s) => s.name === 'origin')) {
    db.exec('ALTER TABLE sources ADD COLUMN origin TEXT');
  }
  // Der CHECK auf kind kennt in alten Datenbanken kein 'url'. SQLite kann
  // Constraints nicht aendern; die Tabelle wird kopiert.
  const ddl = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'sources'")
    .get() as { sql: unknown } | undefined;
  if (typeof ddl?.sql === 'string' && !ddl.sql.includes("'url'")) {
    db.exec(`
      PRAGMA foreign_keys = OFF;
      BEGIN;
      CREATE TABLE sources_neu (
        id TEXT PRIMARY KEY, notebook_id TEXT NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
        title TEXT NOT NULL, kind TEXT NOT NULL CHECK (kind IN ('text','markdown','url','pdf')),
        origin TEXT, content TEXT NOT NULL, word_count INTEGER NOT NULL,
        selected INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL
      );
      INSERT INTO sources_neu SELECT id, notebook_id, title, kind, origin, content, word_count, selected, created_at FROM sources;
      DROP TABLE sources;
      ALTER TABLE sources_neu RENAME TO sources;
      CREATE INDEX IF NOT EXISTS idx_sources_notebook ON sources(notebook_id);
      COMMIT;
      PRAGMA foreign_keys = ON;
    `);
  }
}

export function newId(): string {
  return randomBytes(12).toString('base64url');
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** SQLite kennt kein Boolean. Diese beiden Helfer halten die Umrechnung an einer
 *  Stelle, damit sie nicht in jeder Abfrage neu erfunden wird. */
export function toSqliteBool(value: boolean): number {
  return value ? 1 : 0;
}
export function fromSqliteBool(value: unknown): boolean {
  return value === 1 || value === 1n || value === true;
}
