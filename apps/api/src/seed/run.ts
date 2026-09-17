import type { AppContext } from '../context.ts';
import { EXAMPLE_NOTEBOOK_TITLE, EXAMPLE_SOURCES } from './example.ts';

/** Legt das Beispiel-Notebook an, wenn die Datenbank leer ist (P9).
 *  Laeuft nur bei leerer Datenbank - bestehende Daten werden nie angefasst. */
export function seedIfEmpty(ctx: AppContext): boolean {
  if (ctx.notebooks.list().length > 0) return false;
  const notebook = ctx.notebooks.create(EXAMPLE_NOTEBOOK_TITLE);
  for (const source of EXAMPLE_SOURCES) {
    ctx.sources.create({ notebookId: notebook.id, ...source });
  }
  return true;
}
