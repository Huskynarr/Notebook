import { z } from 'zod';

/** Die Datenbank ist eine Systemgrenze: `node:sqlite` liefert `unknown`-Werte
 *  zurueck. Sie werden hier validiert, statt sie mit einer Typzusicherung in die
 *  Domaene durchzureichen (AGENTS.md Regel 3). */

const sqliteBool = z.union([z.literal(0), z.literal(1)]).transform((v) => v === 1);

export const NotebookRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  source_count: z.number().int(),
  note_count: z.number().int(),
});
export type NotebookRow = z.infer<typeof NotebookRowSchema>;

export const SourceRowSchema = z.object({
  id: z.string(),
  notebook_id: z.string(),
  title: z.string(),
  kind: z.enum(['text', 'markdown', 'pdf']),
  word_count: z.number().int(),
  selected: sqliteBool,
  created_at: z.string(),
  chunk_count: z.number().int(),
});
export type SourceRow = z.infer<typeof SourceRowSchema>;

export const SourceContentRowSchema = SourceRowSchema.extend({ content: z.string() });

export const ChunkRowSchema = z.object({
  id: z.string(),
  source_id: z.string(),
  ordinal: z.number().int(),
  text: z.string(),
  start_offset: z.number().int(),
  end_offset: z.number().int(),
  heading_path: z.string(),
});
export type ChunkRow = z.infer<typeof ChunkRowSchema>;

export const RetrievedRowSchema = ChunkRowSchema.extend({
  source_title: z.string(),
  score: z.number(),
});

export const NoteRowSchema = z.object({
  id: z.string(),
  notebook_id: z.string(),
  title: z.string(),
  body: z.string(),
  citations_json: z.string(),
  question: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type NoteRow = z.infer<typeof NoteRowSchema>;

/** Wirft mit einer Meldung, die den Feldnamen nennt - eine stille Abweichung
 *  zwischen Schema und Abfrage waere sonst schwer zu finden. */
export function parseRow<T>(schema: z.ZodType<T>, row: unknown, context: string): T {
  const parsed = schema.safeParse(row);
  if (!parsed.success) {
    throw new Error(
      `Datenbankzeile entspricht nicht dem Schema (${context}): ${parsed.error.issues
        .map((i) => `${i.path.join('.')} ${i.message}`)
        .join('; ')}`,
    );
  }
  return parsed.data;
}
