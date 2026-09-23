import { z } from 'zod';
import {
  AskRequestSchema,
  CreateNotebookRequestSchema,
  CreateNoteRequestSchema,
  CreateSourceRequestSchema,
  EXAMPLE_NOTEBOOK_TITLE,
  EXAMPLE_SOURCES,
  LoginRequestSchema,
  MAX_SOURCE_BYTES,
  UpdateNotebookRequestSchema,
  UpdateNoteRequestSchema,
  UpdateSourceRequestSchema,
  type CreateNoteRequest,
} from '@notebook/shared';
import {
  accounts,
  checkLogin,
  clearLogin,
  failedLogin,
  login,
  loginBuckets,
  quota,
  verify,
} from './auth.ts';
import { askSites, LlmUnavailableError } from './ask.ts';
import { isOpenCodeConsole } from '../llm/bigPickle.ts';
import {
  canonicalCitations,
  getNote,
  getNotebook,
  getSource,
  id,
  note,
  notebook,
  notebookSelect,
  notesList,
  now,
  sourceList,
  type Database,
  type SiteEnv,
} from './db.ts';
import { exportNotebook } from './export.ts';
import { createSource, removeNotebookSources, removeSource, sourceText } from './sources.ts';
import { ApiFailure, body, errorResponse, json, limited, missing } from './http.ts';

const encoder = new TextEncoder();

function count(row: Record<string, unknown> | null): number {
  return z.number().int().nonnegative().parse(row?.['count']);
}

/** An example is created once per account, isolated from other account data. */
async function seedExample(env: SiteEnv, owner: string): Promise<void> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(owner)));
  const key = Array.from(digest.slice(0, 12))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  const bookId = `example_${key}`;
  const time = now();
  const result = await env.DB.prepare(
    `INSERT OR IGNORE INTO notebooks(id,owner,title,created_at,updated_at)
    VALUES(?,?,?,?,?)`,
  )
    .bind(bookId, owner, EXAMPLE_NOTEBOOK_TITLE, time, time)
    .run();
  if (result.meta.changes === 0) return;
  for (const sample of EXAMPLE_SOURCES) await createSource(env, bookId, sample);
}

function clientIp(request: Request): string {
  // On the hosted Worker, the edge overwrites CF-Connecting-IP. No X-Forwarded-For trust.
  return request.headers.get('CF-Connecting-IP') ?? 'unknown';
}

/** Preserve existing notebook IDs and their sources when a configured account
 * is renamed. Only the authenticated successor may trigger this data update;
 * an old account that is still configured retains its own notebooks. */
async function adoptPreviousOwner(env: SiteEnv, owner: string): Promise<void> {
  const previous = owner === 'Huskynarr' ? 'Huskynar' : owner === 'Everlast' ? 'everlabs' : null;
  if (previous === null || accounts(env).some((account) => account.username === previous)) return;
  await env.DB.prepare('UPDATE notebooks SET owner=? WHERE owner=?').bind(owner, previous).run();
}

export async function handleApi(request: Request, env: SiteEnv): Promise<Response> {
  try {
    return await dispatch(request, env);
  } catch (error) {
    if (error instanceof ApiFailure) return errorResponse(error);
    if (error instanceof LlmUnavailableError)
      return errorResponse(new ApiFailure(503, 'llm_unavailable', error.message));
    if (error instanceof RangeError)
      return errorResponse(new ApiFailure(413, 'payload_too_large', error.message));
    // Keep failing storage or runtime values out of public responses.
    console.error('Sites API operation failed', error instanceof Error ? error.name : 'unknown');
    return errorResponse(new ApiFailure(503, 'internal', 'Backend vorübergehend nicht verfügbar.'));
  }
}

async function dispatch(request: Request, env: SiteEnv): Promise<Response> {
  const method = request.method.toUpperCase();
  const parts = new URL(request.url).pathname.split('/').filter(Boolean);
  const [version, entity, key, action] = parts;
  if (version !== 'v1') missing('API-Pfad');
  if (entity === 'health' && parts.length === 2 && method === 'GET') {
    return json({
      status: 'ok',
      version: '0.1.0',
      llm: {
        configured:
          env.LLM_PROVIDER === 'openai' &&
          !!env.LLM_BASE_URL &&
          !!env.LLM_MODEL &&
          (isOpenCodeConsole(env.LLM_BASE_URL)
            ? env.LLM_MODEL === 'big-pickle'
            : !!env.LLM_API_KEY),
        provider: env.LLM_PROVIDER === 'openai' ? 'openai' : 'stub',
        model: env.LLM_PROVIDER === 'openai' ? (env.LLM_MODEL ?? '') : 'kein Modell verbunden',
      },
    });
  }
  if (entity === 'auth' && key === 'login' && parts.length === 3 && method === 'POST') {
    const input = await body(request, LoginRequestSchema, 8192);
    const known = accounts(env).some((a) => a.username === input.username) ? input.username : null;
    const buckets = await loginBuckets(clientIp(request), known);
    const waiting = await checkLogin(env.DB, buckets);
    if (waiting) limited(waiting);
    const session = await login(env, input.username, input.password);
    if (!session) {
      const cooldown = await failedLogin(env.DB, buckets);
      if (cooldown) limited(cooldown);
      throw new ApiFailure(401, 'unauthorized', 'Benutzername oder Passwort stimmt nicht.');
    }
    await clearLogin(env.DB, buckets);
    return json(session);
  }
  // Every data route is guarded here, including export and original source text.
  const owner = await verify(env, request.headers.get('authorization'));
  if (owner === null) throw new ApiFailure(401, 'unauthorized', 'Anmeldung erforderlich.');
  const ip = clientIp(request);
  const ipWindow = await quota(env.DB, `api:ip:${ip}`, 60_000, 120);
  if (ipWindow) limited(ipWindow);
  const globalWindow = await quota(env.DB, 'api:global', 60_000, 300);
  if (globalWindow) limited(globalWindow);
  await adoptPreviousOwner(env, owner);
  const db = env.DB;

  if (entity === 'notebooks' && parts.length === 2) {
    if (method === 'GET') {
      let rows = await db
        .prepare(`${notebookSelect} WHERE n.owner=? ORDER BY n.updated_at DESC`)
        .bind(owner)
        .all();
      if (rows.results.length === 0) {
        await seedExample(env, owner);
        rows = await db
          .prepare(`${notebookSelect} WHERE n.owner=? ORDER BY n.updated_at DESC`)
          .bind(owner)
          .all();
      }
      return json({ notebooks: rows.results.map(notebook) });
    }
    if (method === 'POST') {
      const input = await body(request, CreateNotebookRequestSchema);
      const total = count(
        await db
          .prepare('SELECT COUNT(*) AS count FROM notebooks WHERE owner=?')
          .bind(owner)
          .first(),
      );
      if (total >= 100)
        throw new ApiFailure(409, 'conflict', 'Die Demo erlaubt höchstens 100 Notebooks.');
      const newId = id(),
        time = now();
      await db
        .prepare('INSERT INTO notebooks(id,owner,title,created_at,updated_at) VALUES(?,?,?,?,?)')
        .bind(newId, owner, input.title, time, time)
        .run();
      return json(await getNotebook(db, owner, newId), 201);
    }
  }
  if (entity === 'notebooks' && key && parts.length >= 3) {
    const book = await getNotebook(db, owner, key);
    if (!book) missing('Notebook');
    if (parts.length === 3) {
      if (method === 'GET') return json(book);
      if (method === 'PATCH') {
        const input = await body(request, UpdateNotebookRequestSchema);
        await db
          .prepare('UPDATE notebooks SET title=?,updated_at=? WHERE id=? AND owner=?')
          .bind(input.title, now(), key, owner)
          .run();
        return json(await getNotebook(db, owner, key));
      }
      if (method === 'DELETE') {
        await removeNotebookSources(env, owner, key);
        return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
      }
    }
    if (action === 'export' && parts.length === 4 && method === 'GET')
      return exportNotebook(env, owner, book);
    if (action === 'sources' && parts.length === 4) {
      if (method === 'GET') return json({ sources: await sourceList(db, owner, key) });
      if (method === 'POST') {
        if (book.sourceCount >= 100)
          throw new ApiFailure(409, 'conflict', 'Ein Notebook erlaubt höchstens 100 Quellen.');
        const input = await body(request, CreateSourceRequestSchema, 2 * MAX_SOURCE_BYTES + 8192);
        if (input.kind === 'url')
          throw new ApiFailure(
            422,
            'not_supported',
            'Website-Import ist deaktiviert. Text oder Markdown als Datei importieren.',
          );
        if (!input.content.trim())
          throw new ApiFailure(400, 'validation_failed', 'Die Quelle enthält keinen Text.');
        for (const char of input.content) {
          const code = char.charCodeAt(0);
          if ((code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127)
            throw new ApiFailure(400, 'validation_failed', 'Binärdaten sind keine Textquelle.');
        }
        const bytes = encoder.encode(input.content).byteLength;
        const total = count(
          await db
            .prepare(
              `SELECT COALESCE(SUM(s.content_bytes),0) AS count
          FROM sources s JOIN notebooks n ON n.id=s.notebook_id WHERE n.owner=?`,
            )
            .bind(owner)
            .first(),
        );
        if (total + bytes > 200 * 1024 * 1024)
          throw new ApiFailure(
            413,
            'storage_limit',
            'Die Demo erlaubt höchstens 200 MiB Quellentext.',
          );
        return json(await createSource(env, key, input), 201);
      }
    }
    if (action === 'notes' && parts.length === 4) {
      if (method === 'GET') return json({ notes: await notesList(db, owner, key) });
      if (method === 'POST') return createNote(request, db, owner, key, book.noteCount);
    }
    if (action === 'ask' && parts.length === 4 && method === 'POST') {
      const input = await body(request, AskRequestSchema);
      const allowed = new Set((await sourceList(db, owner, key)).map((s) => s.id));
      const sources = input.sourceIds.filter((sourceId) => allowed.has(sourceId));
      const minute = await quota(db, `ask:minute:${owner}`, 60_000, 10);
      if (minute) limited(minute);
      const day = await quota(db, `ask:day:${owner}`, 86_400_000, 100);
      if (day) limited(day);
      return json(
        await askSites(env, {
          question: input.question,
          sourceIds: sources,
          language: input.language,
        }),
      );
    }
  }

  if (entity === 'sources' && key && parts.length === 3) {
    const item = await getSource(db, owner, key);
    if (!item) missing('Quelle');
    if (method === 'GET') {
      const content = await sourceText(env, owner, key);
      if (content === null) missing('Quelle');
      return json({ ...item, content });
    }
    if (method === 'PATCH') {
      const input = await body(request, UpdateSourceRequestSchema);
      await db
        .prepare('UPDATE sources SET title=?,selected=? WHERE id=?')
        .bind(input.title ?? item.title, (input.selected ?? item.selected) ? 1 : 0, key)
        .run();
      return json(await getSource(db, owner, key));
    }
    if (method === 'DELETE') {
      await removeSource(env, owner, key);
      return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
    }
  }
  if (entity === 'notes' && key && parts.length === 3) {
    const current = await getNote(db, owner, key);
    if (!current) missing('Notiz');
    if (method === 'PATCH') {
      const input = await body(request, UpdateNoteRequestSchema);
      const changed = {
        ...current,
        title: input.title ?? current.title,
        body: input.body ?? current.body,
      };
      if ((await noteBytes(db, owner)) - noteSize(current) + noteSize(changed) > 50 * 1024 * 1024)
        throw new ApiFailure(413, 'storage_limit', 'Die Demo erlaubt höchstens 50 MiB Notiztext.');
      await db
        .prepare('UPDATE notes SET title=?,body=?,updated_at=? WHERE id=?')
        .bind(changed.title, changed.body, now(), key)
        .run();
      return json(await getNote(db, owner, key));
    }
    if (method === 'DELETE') {
      await db.prepare('DELETE FROM notes WHERE id=?').bind(key).run();
      return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
    }
  }
  missing('API-Pfad');
}

function noteSize(input: CreateNoteRequest): number {
  return encoder.encode(input.title + input.body + input.question + JSON.stringify(input.citations))
    .byteLength;
}

async function noteBytes(db: Database, owner: string): Promise<number> {
  return count(
    await db
      .prepare(
        `SELECT COALESCE(SUM(length(CAST(t.title AS BLOB))+
    length(CAST(t.body AS BLOB))+length(CAST(t.citations_json AS BLOB))+
    length(CAST(t.question AS BLOB))),0) AS count FROM notes t
    JOIN notebooks n ON n.id=t.notebook_id WHERE n.owner=?`,
      )
      .bind(owner)
      .first(),
  );
}

async function createNote(
  request: Request,
  db: Database,
  owner: string,
  bookId: string,
  currentCount: number,
): Promise<Response> {
  if (currentCount >= 100)
    throw new ApiFailure(409, 'conflict', 'Die Demo erlaubt höchstens 100 Notizen.');
  const input = await body(request, CreateNoteRequestSchema);
  const citations = await canonicalCitations(db, owner, bookId, input.citations);
  if (citations === null)
    throw new ApiFailure(
      400,
      'validation_failed',
      'Ein Beleg passt nicht zum Originaltext dieses Notebooks.',
    );
  const checked = { ...input, citations };
  if ((await noteBytes(db, owner)) + noteSize(checked) > 50 * 1024 * 1024)
    throw new ApiFailure(413, 'storage_limit', 'Die Demo erlaubt höchstens 50 MiB Notiztext.');
  const noteId = id(),
    time = now();
  await db.batch([
    db
      .prepare(
        `INSERT INTO notes(id,notebook_id,title,body,citations_json,question,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?)`,
      )
      .bind(
        noteId,
        bookId,
        checked.title,
        checked.body,
        JSON.stringify(citations),
        checked.question,
        time,
        time,
      ),
    db.prepare('UPDATE notebooks SET updated_at=? WHERE id=?').bind(time, bookId),
  ]);
  const row = await db.prepare('SELECT * FROM notes WHERE id=?').bind(noteId).first();
  return json(note(row), 201);
}
