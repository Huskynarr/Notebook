import type { Notebook, Note, Source, SourceContent, Citation } from '@notebook/shared';
import { CitationSchema } from '@notebook/shared';
import { z } from 'zod';
import { chunkText, countWords } from '../domain/chunking.ts';
import { fromSqliteBool, newId, nowIso, toSqliteBool, type Db } from './database.ts';
import {
  ChunkRowSchema,
  NoteRowSchema,
  NotebookRowSchema,
  SourceContentRowSchema,
  SourceRowSchema,
  parseRow,
} from './rows.ts';

const NOTEBOOK_SELECT = `
  SELECT n.id, n.title, n.created_at, n.updated_at,
         (SELECT COUNT(*) FROM sources s WHERE s.notebook_id = n.id) AS source_count,
         (SELECT COUNT(*) FROM notes t WHERE t.notebook_id = n.id) AS note_count
  FROM notebooks n`;

const SOURCE_SELECT = `
  SELECT s.id, s.notebook_id, s.title, s.kind, s.word_count, s.selected, s.created_at,
         (SELECT COUNT(*) FROM chunks c WHERE c.source_id = s.id) AS chunk_count
  FROM sources s`;

function toNotebook(row: unknown): Notebook {
  const r = parseRow(NotebookRowSchema, row, 'notebook');
  return {
    id: r.id,
    title: r.title,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    sourceCount: r.source_count,
    noteCount: r.note_count,
  };
}

function toSource(row: unknown): Source {
  const r = parseRow(SourceRowSchema, row, 'source');
  return {
    id: r.id,
    notebookId: r.notebook_id,
    title: r.title,
    kind: r.kind,
    wordCount: r.word_count,
    chunkCount: r.chunk_count,
    selected: r.selected,
    createdAt: r.created_at,
  };
}

function toNote(row: unknown): Note {
  const r = parseRow(NoteRowSchema, row, 'note');
  const citations = z
    .array(CitationSchema)
    .catch([])
    .parse(JSON.parse(r.citations_json) as unknown);
  return {
    id: r.id,
    notebookId: r.notebook_id,
    title: r.title,
    body: r.body,
    citations,
    question: r.question,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export class NotebookRepository {
  private readonly db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  list(): Notebook[] {
    return this.db.prepare(`${NOTEBOOK_SELECT} ORDER BY n.updated_at DESC`).all().map(toNotebook);
  }

  get(id: string): Notebook | null {
    const row = this.db.prepare(`${NOTEBOOK_SELECT} WHERE n.id = ?`).get(id);
    return row === undefined ? null : toNotebook(row);
  }

  create(title: string): Notebook {
    const id = newId();
    const now = nowIso();
    this.db
      .prepare('INSERT INTO notebooks (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)')
      .run(id, title, now, now);
    const created = this.get(id);
    if (created === null) throw new Error('Notebook konnte nach dem Anlegen nicht gelesen werden');
    return created;
  }

  rename(id: string, title: string): Notebook | null {
    const result = this.db
      .prepare('UPDATE notebooks SET title = ?, updated_at = ? WHERE id = ?')
      .run(title, nowIso(), id);
    return result.changes === 0 ? null : this.get(id);
  }

  touch(id: string): void {
    this.db.prepare('UPDATE notebooks SET updated_at = ? WHERE id = ?').run(nowIso(), id);
  }

  delete(id: string): boolean {
    return this.db.prepare('DELETE FROM notebooks WHERE id = ?').run(id).changes > 0;
  }
}

export class SourceRepository {
  private readonly db: Db;
  private readonly chunkTargetChars: number;

  constructor(db: Db, chunkTargetChars: number) {
    this.db = db;
    this.chunkTargetChars = chunkTargetChars;
  }

  listByNotebook(notebookId: string): Source[] {
    return this.db
      .prepare(`${SOURCE_SELECT} WHERE s.notebook_id = ? ORDER BY s.created_at ASC`)
      .all(notebookId)
      .map(toSource);
  }

  get(id: string): Source | null {
    const row = this.db.prepare(`${SOURCE_SELECT} WHERE s.id = ?`).get(id);
    return row === undefined ? null : toSource(row);
  }

  getWithContent(id: string): SourceContent | null {
    const row = this.db
      .prepare(`${SOURCE_SELECT.replace('SELECT s.id', 'SELECT s.content, s.id')} WHERE s.id = ?`)
      .get(id);
    if (row === undefined) return null;
    const r = parseRow(SourceContentRowSchema, row, 'source-content');
    return { ...toSource(row), content: r.content };
  }

  /** Legt eine Quelle an und zerlegt sie in einem Zug. Beides in einer
   *  Transaktion: eine Quelle ohne Abschnitte waere unauffindbar, aber sichtbar. */
  create(input: {
    notebookId: string;
    title: string;
    kind: 'text' | 'markdown';
    content: string;
  }): Source {
    const id = newId();
    const now = nowIso();
    const chunks = chunkText(input.content, { targetChars: this.chunkTargetChars });

    this.db.exec('BEGIN');
    try {
      this.db
        .prepare(
          `INSERT INTO sources (id, notebook_id, title, kind, content, word_count, selected, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          id,
          input.notebookId,
          input.title,
          input.kind,
          input.content,
          countWords(input.content),
          toSqliteBool(true),
          now,
        );
      const insertChunk = this.db.prepare(
        `INSERT INTO chunks (id, source_id, ordinal, text, start_offset, end_offset, heading_path)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      );
      for (const chunk of chunks) {
        insertChunk.run(
          newId(),
          id,
          chunk.ordinal,
          chunk.text,
          chunk.startOffset,
          chunk.endOffset,
          chunk.headingPath,
        );
      }
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }

    const created = this.get(id);
    if (created === null) throw new Error('Quelle konnte nach dem Anlegen nicht gelesen werden');
    return created;
  }

  update(
    id: string,
    patch: { selected?: boolean | undefined; title?: string | undefined },
  ): Source | null {
    const current = this.get(id);
    if (current === null) return null;
    this.db
      .prepare('UPDATE sources SET selected = ?, title = ? WHERE id = ?')
      .run(toSqliteBool(patch.selected ?? current.selected), patch.title ?? current.title, id);
    return this.get(id);
  }

  delete(id: string): boolean {
    return this.db.prepare('DELETE FROM sources WHERE id = ?').run(id).changes > 0;
  }

  chunksOf(sourceId: string): Array<z.infer<typeof ChunkRowSchema>> {
    return this.db
      .prepare(
        `SELECT id, source_id, ordinal, text, start_offset, end_offset, heading_path
         FROM chunks WHERE source_id = ? ORDER BY ordinal`,
      )
      .all(sourceId)
      .map((row) => parseRow(ChunkRowSchema, row, 'chunk'));
  }
}

export class NoteRepository {
  private readonly db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  listByNotebook(notebookId: string): Note[] {
    return this.db
      .prepare('SELECT * FROM notes WHERE notebook_id = ? ORDER BY created_at DESC')
      .all(notebookId)
      .map(toNote);
  }

  get(id: string): Note | null {
    const row = this.db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
    return row === undefined ? null : toNote(row);
  }

  create(input: {
    notebookId: string;
    title: string;
    body: string;
    citations: Citation[];
    question: string;
  }): Note {
    const id = newId();
    const now = nowIso();
    this.db
      .prepare(
        `INSERT INTO notes (id, notebook_id, title, body, citations_json, question, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.notebookId,
        input.title,
        input.body,
        JSON.stringify(input.citations),
        input.question,
        now,
        now,
      );
    const created = this.get(id);
    if (created === null) throw new Error('Notiz konnte nach dem Anlegen nicht gelesen werden');
    return created;
  }

  update(
    id: string,
    patch: { title?: string | undefined; body?: string | undefined },
  ): Note | null {
    const current = this.get(id);
    if (current === null) return null;
    this.db
      .prepare('UPDATE notes SET title = ?, body = ?, updated_at = ? WHERE id = ?')
      .run(patch.title ?? current.title, patch.body ?? current.body, nowIso(), id);
    return this.get(id);
  }

  delete(id: string): boolean {
    return this.db.prepare('DELETE FROM notes WHERE id = ?').run(id).changes > 0;
  }
}

export { fromSqliteBool };
