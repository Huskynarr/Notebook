import { MAX_SOURCE_BYTES, chunkText, countWords, type Source } from '@notebook/shared';
import { z } from 'zod';
import { getSource, id, now, source, sourceSelect, type Database, type SiteEnv } from './db.ts';

const utf8 = new TextEncoder();
const MAX_BULK_QUERIES = 40;
const MAX_JSON_BYTES = 600_000;

/** Split an unpunctuated long paragraph where the shared chunker cannot find a sentence boundary. */
export function sourceChunks(content: string): ReturnType<typeof chunkText> {
  const raw = chunkText(content);
  return raw
    .flatMap((chunk) => {
      if (utf8.encode(chunk.text).byteLength <= 32_000) return [chunk];
      const parts: ReturnType<typeof chunkText> = [];
      for (let offset = 0; offset < chunk.text.length;) {
        let end = Math.min(offset + 2400, chunk.text.length);
        if (end < chunk.text.length) {
          const code = chunk.text.charCodeAt(end - 1);
          if (code >= 0xd800 && code <= 0xdbff) end -= 1;
        }
        parts.push({
          ...chunk,
          text: chunk.text.slice(offset, end),
          startOffset: chunk.startOffset + offset,
          endOffset: chunk.startOffset + end,
        });
        offset = end;
      }
      return parts;
    })
    .map((chunk, ordinal) => ({ ...chunk, ordinal }));
}

function batchedInsert(
  db: Database,
  sourceId: string,
  chunks: ReturnType<typeof chunkText>,
): ReturnType<Database['prepare']>[] {
  const groups: string[] = [];
  let items: string[] = [];
  let bytes = 2;
  for (const chunk of chunks) {
    const entry = JSON.stringify({
      id: id(),
      sid: sourceId,
      ord: chunk.ordinal,
      text: chunk.text,
      start: chunk.startOffset,
      end: chunk.endOffset,
      heading: chunk.headingPath,
    });
    const length = utf8.encode(entry).byteLength + 1;
    if (length > MAX_JSON_BYTES) throw new RangeError('Ein einzelner Abschnitt ist zu lang.');
    if (items.length > 0 && bytes + length > MAX_JSON_BYTES) {
      groups.push(`[${items.join(',')}]`);
      items = [];
      bytes = 2;
    }
    items.push(entry);
    bytes += length;
  }
  if (items.length > 0) groups.push(`[${items.join(',')}]`);
  if (groups.length > MAX_BULK_QUERIES)
    throw new RangeError('Diese Quelle enthält zu viele kurze Abschnitte.');
  return groups.map((group) =>
    db
      .prepare(
        `INSERT INTO chunks
    (id,source_id,ordinal,text,start_offset,end_offset,heading_path)
    SELECT json_extract(value,'$.id'),json_extract(value,'$.sid'),
      json_extract(value,'$.ord'),json_extract(value,'$.text'),
      json_extract(value,'$.start'),json_extract(value,'$.end'),
      json_extract(value,'$.heading') FROM json_each(?)`,
      )
      .bind(group),
  );
}

export async function createSource(
  env: SiteEnv,
  notebookId: string,
  input: { title: string; kind: 'text' | 'markdown'; content: string },
): Promise<Source> {
  const bytes = utf8.encode(input.content).byteLength;
  if (bytes > MAX_SOURCE_BYTES)
    throw new RangeError('Eine Quelle darf höchstens 10 MiB UTF-8-Text enthalten.');
  const chunks = sourceChunks(input.content);
  if (chunks.length === 0)
    throw new RangeError('Aus dieser Quelle ließ sich kein Abschnitt bilden.');
  const sourceId = id(),
    key = `sources/${sourceId}`;
  const sql = batchedInsert(env.DB, sourceId, chunks);
  await env.BUCKET.put(key, input.content);
  try {
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO sources(id,notebook_id,title,kind,origin,r2_key,content_bytes,
        word_count,selected,created_at) VALUES(?,?,?,?,?,?,?,?,1,?)`,
      ).bind(
        sourceId,
        notebookId,
        input.title,
        input.kind,
        null,
        key,
        bytes,
        countWords(input.content),
        now(),
      ),
      ...sql,
      env.DB.prepare('UPDATE notebooks SET updated_at=? WHERE id=?').bind(now(), notebookId),
    ]);
  } catch (error) {
    await env.BUCKET.delete(key).catch(() => undefined);
    throw error;
  }
  const created = await getSourceById(env.DB, sourceId);
  if (created === null) throw new Error('Quelle nach Import nicht verfügbar');
  return created;
}

async function getSourceById(db: Database, sourceId: string): Promise<Source | null> {
  const row = await db.prepare(`${sourceSelect} WHERE s.id=?`).bind(sourceId).first();
  return row === null ? null : source(row);
}

export async function sourceText(
  env: SiteEnv,
  owner: string,
  sourceId: string,
): Promise<string | null> {
  if ((await getSource(env.DB, owner, sourceId)) === null) return null;
  const raw = await env.DB.prepare('SELECT r2_key FROM sources WHERE id=?').bind(sourceId).first();
  const row = raw === null ? null : z.object({ r2_key: z.string() }).parse(raw);
  if (row === null) return null;
  const object = await env.BUCKET.get(row.r2_key);
  if (object === null) throw new Error('Originalquelle fehlt im Objektspeicher');
  return object.text();
}

export async function removeSource(
  env: SiteEnv,
  owner: string,
  sourceId: string,
): Promise<boolean> {
  if ((await getSource(env.DB, owner, sourceId)) === null) return false;
  const raw = await env.DB.prepare('SELECT r2_key FROM sources WHERE id=?').bind(sourceId).first();
  const row = raw === null ? null : z.object({ r2_key: z.string() }).parse(raw);
  const result = await env.DB.prepare('DELETE FROM sources WHERE id=?').bind(sourceId).run();
  if (row) await env.BUCKET.delete(row.r2_key);
  return result.meta.changes > 0;
}

export async function removeNotebookSources(
  env: SiteEnv,
  owner: string,
  notebookId: string,
): Promise<void> {
  const keys = await env.DB.prepare(
    `SELECT s.r2_key FROM sources s JOIN notebooks n ON n.id=s.notebook_id
    WHERE s.notebook_id=? AND n.owner=?`,
  )
    .bind(notebookId, owner)
    .all();
  await env.DB.prepare('DELETE FROM notebooks WHERE id=? AND owner=?')
    .bind(notebookId, owner)
    .run();
  await Promise.all(
    keys.results.map((row) =>
      env.BUCKET.delete(z.object({ r2_key: z.string() }).parse(row).r2_key),
    ),
  );
}
