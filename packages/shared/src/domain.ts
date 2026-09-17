import { z } from 'zod';
import { IdSchema, IsoDateSchema } from './ids.js';

/** Quelltypen. `pdf` ist als optionale Erweiterung vorgesehen (docs/product.md),
 *  in v0.1 nimmt die API sie noch nicht an. */
export const SourceKindSchema = z.enum(['text', 'markdown', 'pdf']);
export type SourceKind = z.infer<typeof SourceKindSchema>;

export const NotebookSchema = z.object({
  id: IdSchema,
  title: z.string().min(1).max(200),
  createdAt: IsoDateSchema,
  updatedAt: IsoDateSchema,
  sourceCount: z.number().int().nonnegative(),
  noteCount: z.number().int().nonnegative(),
});
export type Notebook = z.infer<typeof NotebookSchema>;

export const SourceSchema = z.object({
  id: IdSchema,
  notebookId: IdSchema,
  title: z.string().min(1).max(300),
  kind: SourceKindSchema,
  /** Wortzahl des Originaltexts. Nur zur Anzeige. */
  wordCount: z.number().int().nonnegative(),
  chunkCount: z.number().int().nonnegative(),
  /** Zaehlt diese Quelle fuer die naechste Frage? Wird pro Quelle gespeichert,
   *  damit die Auswahl einen Neuladen ueberlebt. */
  selected: z.boolean(),
  createdAt: IsoDateSchema,
});
export type Source = z.infer<typeof SourceSchema>;

/** Der volle Originaltext einer Quelle. Getrennt vom Listeneintrag, weil er
 *  gross ist und nur beim Oeffnen der Quellenansicht gebraucht wird. */
export const SourceContentSchema = SourceSchema.extend({
  content: z.string(),
});
export type SourceContent = z.infer<typeof SourceContentSchema>;

/** Ein Abschnitt einer Quelle. `startOffset`/`endOffset` sind Zeichenpositionen
 *  in `SourceContent.content` - halboffenes Intervall [start, end).
 *  Sie sind die Grundlage jedes Belegs und duerfen sich nach dem Anlegen
 *  einer Quelle nie aendern. */
export const ChunkSchema = z.object({
  id: IdSchema,
  sourceId: IdSchema,
  ordinal: z.number().int().nonnegative(),
  text: z.string(),
  startOffset: z.number().int().nonnegative(),
  endOffset: z.number().int().nonnegative(),
  /** Ueberschriftenpfad aus dem Markdown, z. B. "3 Fristen > 3.2 Widerspruch". */
  headingPath: z.string(),
});
export type Chunk = z.infer<typeof ChunkSchema>;

/** Ein Beleg. Erzeugt ausschliesslich der Server, nie das Modell:
 *  `excerpt` wird per Offset aus dem gespeicherten Originaltext geschnitten,
 *  damit er nicht vom Modell umformuliert sein kann. */
export const CitationSchema = z.object({
  /** Die Zahl, die im Antworttext als [n] steht. Beginnt bei 1. */
  marker: z.number().int().positive(),
  sourceId: IdSchema,
  sourceTitle: z.string(),
  chunkId: IdSchema,
  headingPath: z.string(),
  startOffset: z.number().int().nonnegative(),
  endOffset: z.number().int().nonnegative(),
  excerpt: z.string(),
  /** Wie genau der Beleg liegt.
   *  `exact`  - das Modell hat woertlich zitiert, die Stelle wurde im Abschnitt
   *             wiedergefunden; die Offsets umfassen genau diese Zeichen.
   *  `chunk`  - das woertliche Zitat war nicht auffindbar; die Offsets umfassen
   *             den ganzen Abschnitt. Das UI kennzeichnet das, damit niemand
   *             eine Genauigkeit annimmt, die nicht besteht. */
  precision: z.enum(['exact', 'chunk']),
});
export type Citation = z.infer<typeof CitationSchema>;

export const NoteSchema = z.object({
  id: IdSchema,
  notebookId: IdSchema,
  title: z.string().min(1).max(300),
  body: z.string(),
  /** Belege werden mit der Notiz eingefroren. Wird die Quelle spaeter geloescht,
   *  bleibt nachvollziehbar, worauf sich die Notiz stuetzte. */
  citations: z.array(CitationSchema),
  /** Frage, aus der die Notiz entstanden ist - leer bei handgeschriebenen Notizen. */
  question: z.string(),
  createdAt: IsoDateSchema,
  updatedAt: IsoDateSchema,
});
export type Note = z.infer<typeof NoteSchema>;
