import { z } from 'zod';

/** Alle IDs sind zufaellige, URL-sichere Zeichenketten. Keine laufenden Nummern:
 *  eine ID darf nichts ueber Reihenfolge oder Menge verraten. */
export const IdSchema = z.string().min(8).max(64);
export type Id = z.infer<typeof IdSchema>;

export const IsoDateSchema = z.string().datetime();
