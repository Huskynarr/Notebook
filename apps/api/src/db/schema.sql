-- Schema Version 1
-- Absichtlich schmal: nur was der Pflichtumfang P1-P10 braucht.

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS notebooks (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sources (
  id          TEXT PRIMARY KEY,
  notebook_id TEXT NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('text', 'markdown', 'pdf')),
  -- Der unveraenderte Originaltext. Alle Beleg-Offsets zeigen hierauf; er darf
  -- nach dem Anlegen nie mehr veraendert werden.
  content     TEXT NOT NULL,
  word_count  INTEGER NOT NULL,
  selected    INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sources_notebook ON sources(notebook_id);

CREATE TABLE IF NOT EXISTS chunks (
  rowid        INTEGER PRIMARY KEY,
  id           TEXT NOT NULL UNIQUE,
  source_id    TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  ordinal      INTEGER NOT NULL,
  text         TEXT NOT NULL,
  start_offset INTEGER NOT NULL,
  end_offset   INTEGER NOT NULL,
  heading_path TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_chunks_source ON chunks(source_id);

-- Lexikalischer Index (D-005). `content=` bindet ihn an die Tabelle chunks,
-- damit der Text nicht doppelt gespeichert wird.
CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
  text,
  heading_path,
  content='chunks',
  content_rowid='rowid',
  tokenize="unicode61 remove_diacritics 2",
  prefix='2 3 4'
);

CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN
  INSERT INTO chunks_fts(rowid, text, heading_path)
  VALUES (new.rowid, new.text, new.heading_path);
END;
CREATE TRIGGER IF NOT EXISTS chunks_ad AFTER DELETE ON chunks BEGIN
  INSERT INTO chunks_fts(chunks_fts, rowid, text, heading_path)
  VALUES ('delete', old.rowid, old.text, old.heading_path);
END;
CREATE TRIGGER IF NOT EXISTS chunks_au AFTER UPDATE ON chunks BEGIN
  INSERT INTO chunks_fts(chunks_fts, rowid, text, heading_path)
  VALUES ('delete', old.rowid, old.text, old.heading_path);
  INSERT INTO chunks_fts(rowid, text, heading_path)
  VALUES (new.rowid, new.text, new.heading_path);
END;

CREATE TABLE IF NOT EXISTS notes (
  id             TEXT PRIMARY KEY,
  notebook_id    TEXT NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  body           TEXT NOT NULL,
  -- Belege werden mit der Notiz eingefroren, damit sie nachvollziehbar bleibt,
  -- auch wenn die Quelle spaeter geloescht wird.
  citations_json TEXT NOT NULL DEFAULT '[]',
  question       TEXT NOT NULL DEFAULT '',
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notes_notebook ON notes(notebook_id);

CREATE TABLE IF NOT EXISTS schema_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
