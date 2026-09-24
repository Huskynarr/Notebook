CREATE TABLE notebooks (
  id TEXT PRIMARY KEY, owner TEXT NOT NULL, title TEXT NOT NULL,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX idx_notebooks_owner_updated ON notebooks(owner, updated_at);

CREATE TABLE sources (
  id TEXT PRIMARY KEY,
  notebook_id TEXT NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
  title TEXT NOT NULL, kind TEXT NOT NULL CHECK (kind IN ('text', 'markdown')),
  origin TEXT, r2_key TEXT NOT NULL UNIQUE, content_bytes INTEGER NOT NULL,
  word_count INTEGER NOT NULL, selected INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_sources_notebook ON sources(notebook_id);

CREATE TABLE chunks (
  rowid INTEGER PRIMARY KEY, id TEXT NOT NULL UNIQUE,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL, text TEXT NOT NULL,
  start_offset INTEGER NOT NULL, end_offset INTEGER NOT NULL,
  heading_path TEXT NOT NULL DEFAULT ''
);
CREATE INDEX idx_chunks_source ON chunks(source_id);
CREATE VIRTUAL TABLE chunks_fts USING fts5(
  text, heading_path, content='chunks', content_rowid='rowid',
  tokenize='unicode61 remove_diacritics 2', prefix='2 3 4'
);
CREATE TRIGGER chunks_ai AFTER INSERT ON chunks BEGIN
  INSERT INTO chunks_fts(rowid, text, heading_path)
  VALUES (new.rowid, new.text, new.heading_path);
END;
CREATE TRIGGER chunks_ad AFTER DELETE ON chunks BEGIN
  INSERT INTO chunks_fts(chunks_fts, rowid, text, heading_path)
  VALUES ('delete', old.rowid, old.text, old.heading_path);
END;

CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  notebook_id TEXT NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
  title TEXT NOT NULL, body TEXT NOT NULL, citations_json TEXT NOT NULL DEFAULT '[]',
  question TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX idx_notes_notebook ON notes(notebook_id);

CREATE TABLE login_attempts (
  bucket TEXT PRIMARY KEY, failures INTEGER NOT NULL,
  blocked_until INTEGER NOT NULL, last_failure INTEGER NOT NULL
);
CREATE TABLE api_quota (
  bucket TEXT PRIMARY KEY, used INTEGER NOT NULL, expires INTEGER NOT NULL
);
