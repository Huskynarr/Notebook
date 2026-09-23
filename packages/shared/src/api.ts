import { z } from 'zod';
import { IdSchema } from './ids.js';
import { CitationSchema, ChunkSchema, NotebookSchema, NoteSchema, SourceSchema } from './domain.js';

/* ---------- Auth ---------- */

export const LoginRequestSchema = z.object({
  username: z.string().min(1).max(200),
  password: z.string().min(1).max(1024),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const LoginResponseSchema = z.object({
  token: z.string(),
  expiresAt: z.iso.datetime(),
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

/* ---------- Notebooks ---------- */

export const CreateNotebookRequestSchema = z.object({ title: z.string().min(1).max(200) });
export type CreateNotebookRequest = z.infer<typeof CreateNotebookRequestSchema>;

export const UpdateNotebookRequestSchema = z.object({ title: z.string().min(1).max(200) });
export type UpdateNotebookRequest = z.infer<typeof UpdateNotebookRequestSchema>;

export const NotebookListResponseSchema = z.object({ notebooks: z.array(NotebookSchema) });
export type NotebookListResponse = z.infer<typeof NotebookListResponseSchema>;

/* ---------- Quellen ---------- */

export const MAX_SOURCE_BYTES = 10 * 1024 * 1024;

export const CreateSourceRequestSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.enum(['text', 'markdown']),
    title: z.string().min(1).max(300),
    content: z
      .string()
      .min(1)
      .max(MAX_SOURCE_BYTES)
      .refine(
        (text) => new TextEncoder().encode(text).byteLength <= MAX_SOURCE_BYTES,
        'Eine Quelle darf höchstens 10 MiB UTF-8-Text enthalten.',
      ),
  }),
  /** Legacy-Vertrag: URL-Import wird ausdrücklich mit not_supported abgewiesen. */
  z.object({
    kind: z.literal('url'),
    url: z.url().max(2000),
    title: z.string().min(1).max(300).optional(),
  }),
]);
export type CreateSourceRequest = z.infer<typeof CreateSourceRequestSchema>;

export const UpdateSourceRequestSchema = z.object({
  selected: z.boolean().optional(),
  title: z.string().min(1).max(300).optional(),
});
export type UpdateSourceRequest = z.infer<typeof UpdateSourceRequestSchema>;

export const SourceListResponseSchema = z.object({ sources: z.array(SourceSchema) });
export type SourceListResponse = z.infer<typeof SourceListResponseSchema>;

/* ---------- Fragen ---------- */

export const LanguageSchema = z.enum(['de', 'en']);
export type Language = z.infer<typeof LanguageSchema>;

export const AskRequestSchema = z.object({
  question: z.string().min(1).max(4000),
  /** Sprache der Oberflaeche: bestimmt die Sprache der Antwort und der
   *  Systemauskuenfte ("keine Quelle ausgewaehlt"). Vorgabe Deutsch. */
  language: LanguageSchema.default('de'),
  /** Leere Liste bedeutet: keine Quelle ausgewaehlt. Der Server antwortet dann
   *  mit `grounded: false` statt aus Modellwissen zu antworten. */
  sourceIds: z.array(IdSchema).max(100),
});
export type AskRequest = z.infer<typeof AskRequestSchema>;

/** Ein Abschnitt, wie er dem Modell vorgelegt wurde. Wird mit ausgeliefert,
 *  damit im UI nachvollziehbar ist, worauf das Modell ueberhaupt Zugriff hatte -
 *  auch auf Abschnitte, die es dann nicht zitiert hat. */
export const RetrievedChunkSchema = ChunkSchema.extend({
  sourceTitle: z.string(),
  score: z.number(),
});
export type RetrievedChunk = z.infer<typeof RetrievedChunkSchema>;

export const AskResponseSchema = z.object({
  /** Antworttext mit Markern der Form [1] bzw. [1,3]. Enthaelt ausschliesslich
   *  Marker, die gegen `citations` aufloesbar sind. */
  answer: z.string(),
  citations: z.array(CitationSchema),
  retrieved: z.array(RetrievedChunkSchema),
  /** false = die ausgewaehlten Quellen decken die Frage nicht ab. `answer`
   *  enthaelt dann die Auskunft darueber, keine inhaltliche Antwort. */
  grounded: z.boolean(),
  /** Saetze ohne Beleg - im UI gekennzeichnet (docs/design-system.md 8.5). */
  unsupportedSentenceCount: z.number().int().nonnegative(),
  /** Marker, die das Modell erfunden hat und die der Server entfernt hat.
   *  Wird ausgeliefert, weil ein stillschweigendes Entfernen eine unmarkierte
   *  Korrektur waere (AGENTS.md Regel 5). */
  droppedMarkers: z.array(z.number().int()),
  /** true = die Antwort stammt nicht von einem Modell, sondern aus dem
   *  Offline-Modus. Das UI zeigt dafuer ein dauerhaftes Banner. */
  simulated: z.boolean(),
  model: z.string(),
  elapsedMs: z.number().int().nonnegative(),
});
export type AskResponse = z.infer<typeof AskResponseSchema>;

/* ---------- Notizen ---------- */

export const CreateNoteRequestSchema = z.object({
  title: z.string().min(1).max(300),
  body: z.string().max(500_000),
  citations: z.array(CitationSchema).max(100).default([]),
  question: z.string().max(4000).default(''),
});
export type CreateNoteRequest = z.infer<typeof CreateNoteRequestSchema>;

export const UpdateNoteRequestSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  body: z.string().max(500_000).optional(),
});
export type UpdateNoteRequest = z.infer<typeof UpdateNoteRequestSchema>;

export const NoteListResponseSchema = z.object({ notes: z.array(NoteSchema) });
export type NoteListResponse = z.infer<typeof NoteListResponseSchema>;

/* ---------- Fehler ---------- */

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.enum([
      'unauthorized',
      'rate_limited',
      'payload_too_large',
      'storage_limit',
      'not_supported',
      'not_found',
      'validation_failed',
      'llm_unavailable',
      'fetch_failed',
      'conflict',
      'internal',
    ]),
    message: z.string(),
    retryAfterSeconds: z.number().int().positive().optional(),
    retryAt: z.iso.datetime().optional(),
  }),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  version: z.string(),
  llm: z.object({
    configured: z.boolean(),
    provider: z.string(),
    model: z.string(),
    /** Externer Anbieter hat die Modellanfragen in diesem Betrieb abgewiesen. */
    accessBlocked: z.boolean().optional(),
  }),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
