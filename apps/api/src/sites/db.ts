import { z } from 'zod';
import {
  ChunkRowSchema,
  NoteRowSchema,
  NotebookRowSchema,
  RetrievedRowSchema,
  SourceRowSchema,
  parseRow,
} from '../db/rows.ts';
import type { Citation, Note, Notebook, RetrievedChunk, Source } from '@notebook/shared';
import { CitationSchema } from '@notebook/shared';

type D1Value = string | number | null;

export interface Statement {
  bind(...values: D1Value[]): Statement;
  first(): Promise<Record<string, unknown> | null>;
  all(): Promise<{ results: Record<string, unknown>[] }>;
  run(): Promise<{ meta: { changes: number } }>;
}

export interface Database {
  prepare(sql: string): Statement;
  batch(statements: Statement[]): Promise<unknown[]>;
}

export interface Bucket {
  put(key: string, value: string): Promise<unknown>;
  get(key: string): Promise<{ text(): Promise<string> } | null>;
  delete(key: string): Promise<void>;
}

export interface SiteEnv {
  DB: Database;
  BUCKET: Bucket;
  ASSETS?: { fetch(request: Request): Promise<Response> };
  AUTH_USERNAME?: string;
  AUTH_PASSWORD?: string;
  AUTH_ADDITIONAL_USERS?: string;
  AUTH_SECRET?: string;
  LLM_PROVIDER?: string;
  LLM_BASE_URL?: string;
  LLM_API_KEY?: string;
  LLM_MODEL?: string;
  /** Operator-confirmed provider restriction; prevents repeated external calls. */
  LLM_ACCESS_STATUS?: string;
}

export const notebookSelect = `SELECT n.id,n.title,n.created_at,n.updated_at,
  (SELECT COUNT(*) FROM sources s WHERE s.notebook_id=n.id) AS source_count,
  (SELECT COUNT(*) FROM notes t WHERE t.notebook_id=n.id) AS note_count FROM notebooks n`;
export const sourceSelect = `SELECT s.id,s.notebook_id,s.title,s.kind,s.origin,s.word_count,s.selected,
  s.created_at,(SELECT COUNT(*) FROM chunks c WHERE c.source_id=s.id) AS chunk_count FROM sources s`;

export function notebook(row: unknown): Notebook {
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

export function source(row: unknown): Source {
  const r = parseRow(SourceRowSchema, row, 'source');
  return {
    id: r.id,
    notebookId: r.notebook_id,
    title: r.title,
    kind: r.kind,
    origin: r.origin,
    wordCount: r.word_count,
    selected: r.selected,
    chunkCount: r.chunk_count,
    createdAt: r.created_at,
  };
}

export function note(row: unknown): Note {
  const r = parseRow(NoteRowSchema, row, 'note');
  return {
    id: r.id,
    notebookId: r.notebook_id,
    title: r.title,
    body: r.body,
    citations: z.array(CitationSchema).parse(JSON.parse(r.citations_json) as unknown),
    question: r.question,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function retrieved(row: unknown): RetrievedChunk {
  const r = parseRow(RetrievedRowSchema, row, 'retrieved');
  return {
    id: r.id,
    sourceId: r.source_id,
    ordinal: r.ordinal,
    text: r.text,
    startOffset: r.start_offset,
    endOffset: r.end_offset,
    headingPath: r.heading_path,
    sourceTitle: r.source_title,
    score: r.score,
  };
}

export async function getNotebook(
  db: Database,
  owner: string,
  id: string,
): Promise<Notebook | null> {
  const row = await db
    .prepare(`${notebookSelect} WHERE n.id=? AND n.owner=?`)
    .bind(id, owner)
    .first();
  return row === null ? null : notebook(row);
}

export async function getSource(db: Database, owner: string, id: string): Promise<Source | null> {
  const row = await db
    .prepare(
      `${sourceSelect} JOIN notebooks n ON n.id=s.notebook_id
    WHERE s.id=? AND n.owner=?`,
    )
    .bind(id, owner)
    .first();
  return row === null ? null : source(row);
}

export async function getNote(db: Database, owner: string, id: string): Promise<Note | null> {
  const row = await db
    .prepare(
      `SELECT t.* FROM notes t JOIN notebooks n ON n.id=t.notebook_id
    WHERE t.id=? AND n.owner=?`,
    )
    .bind(id, owner)
    .first();
  return row === null ? null : note(row);
}

export async function sourceList(
  db: Database,
  owner: string,
  notebookId: string,
): Promise<Source[]> {
  const rows = await db
    .prepare(
      `${sourceSelect} JOIN notebooks n ON n.id=s.notebook_id
    WHERE s.notebook_id=? AND n.owner=? ORDER BY s.created_at ASC`,
    )
    .bind(notebookId, owner)
    .all();
  return rows.results.map(source);
}

export async function notesList(db: Database, owner: string, notebookId: string): Promise<Note[]> {
  const rows = await db
    .prepare(
      `SELECT t.* FROM notes t JOIN notebooks n ON n.id=t.notebook_id
    WHERE t.notebook_id=? AND n.owner=? ORDER BY t.created_at DESC`,
    )
    .bind(notebookId, owner)
    .all();
  return rows.results.map(note);
}

export async function canonicalCitations(
  db: Database,
  owner: string,
  notebookId: string,
  citations: Citation[],
): Promise<Citation[] | null> {
  const markers = new Set<number>();
  const verified: Citation[] = [];
  if (citations.length === 0) return verified;
  const rows = await db
    .prepare(
      `SELECT c.*,s.title AS source_title FROM chunks c
    JOIN sources s ON s.id=c.source_id JOIN notebooks n ON n.id=s.notebook_id
    WHERE n.id=? AND n.owner=? AND c.id IN (SELECT value FROM json_each(?))`,
    )
    .bind(notebookId, owner, JSON.stringify(citations.map((citation) => citation.chunkId)))
    .all();
  const lookup = new Map(rows.results.map((row) => [String(row['id']), row]));
  for (const citation of citations) {
    if (markers.has(citation.marker)) return null;
    markers.add(citation.marker);
    const row = lookup.get(citation.chunkId);
    if (row === undefined || row['source_id'] !== citation.sourceId) return null;
    const chunk = parseRow(ChunkRowSchema.extend({ source_title: z.string() }), row, 'citation');
    const start = citation.startOffset - chunk.start_offset;
    const end = citation.endOffset - chunk.start_offset;
    if (
      start < 0 ||
      end <= start ||
      citation.endOffset > chunk.end_offset ||
      citation.excerpt !== chunk.text.slice(start, end) ||
      (citation.precision === 'chunk' && (start !== 0 || end !== chunk.text.length))
    )
      return null;
    verified.push({
      ...citation,
      sourceTitle: chunk.source_title,
      headingPath: chunk.heading_path,
    });
  }
  return verified;
}

export const now = (): string => new Date().toISOString();
export const id = (): string => crypto.randomUUID();
