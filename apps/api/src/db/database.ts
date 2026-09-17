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
  db.exec(readFileSync(join(here, 'schema.sql'), 'utf8'));
  db.prepare('INSERT OR REPLACE INTO schema_meta(key, value) VALUES (?, ?)').run(
    'version',
    SCHEMA_VERSION,
  );
  return db;
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
