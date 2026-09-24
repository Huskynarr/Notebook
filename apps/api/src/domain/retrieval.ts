import type { RetrievedChunk } from '@notebook/shared';
import type { Db } from '../db/database.ts';
import { RetrievedRowSchema } from '../db/rows.ts';
import { parseRow } from '../db/rows.ts';

/**
 * Lexikalischer Abruf ueber FTS5/BM25 (D-005).
 *
 * Bewusst nachvollziehbar: man kann an der erzeugten MATCH-Abfrage ablesen,
 * warum ein Abschnitt gefunden wurde. Das stuetzt den Qualitaetsfokus mehr als
 * ein Aehnlichkeitswert, den niemand nachrechnen kann. Gewichte und
 * Fehlertoleranz sind in docs/indexing.md begruendet, nicht als Optimum gemessen.
 */

/** Sehr haeufige deutsche und englische Woerter, die als Suchbegriff nur Rauschen
 *  erzeugen. Bewusst kurz gehalten - eine grosse Stoppwortliste entfernt auch
 *  Begriffe, die in Fachtexten bedeutungstragend sind. */
const STOPWORDS = new Set([
  'aber',
  'alle',
  'als',
  'also',
  'am',
  'an',
  'auch',
  'auf',
  'aus',
  'bei',
  'bin',
  'bis',
  'da',
  'dass',
  'dem',
  'den',
  'der',
  'des',
  'die',
  'dies',
  'diese',
  'diesem',
  'diesen',
  'dieser',
  'doch',
  'dort',
  'du',
  'ein',
  'eine',
  'einem',
  'einen',
  'einer',
  'eines',
  'er',
  'es',
  'für',
  'für',
  'hat',
  'hatte',
  'ich',
  'ihr',
  'im',
  'in',
  'ist',
  'ja',
  'kann',
  'man',
  'mit',
  'nach',
  'nicht',
  'noch',
  'nun',
  'nur',
  'ob',
  'oder',
  'ohne',
  'sich',
  'sie',
  'sind',
  'so',
  'über',
  'über',
  'um',
  'und',
  'uns',
  'vom',
  'von',
  'vor',
  'war',
  'was',
  'wenn',
  'wer',
  'wie',
  'wir',
  'wird',
  'wo',
  'zu',
  'zum',
  'zur',
  'and',
  'are',
  'for',
  'from',
  'the',
  'was',
  'were',
  'what',
  'when',
  'which',
  'with',
]);

/** Kuerzeste Zeichenkette, die als Suchbegriff zugelassen wird. */
const MIN_TERM_LENGTH = 4;

/** Ab dieser Laenge wird ein Begriff als Praefix gesucht. Deutsche Fachtexte
 *  flektieren ("Frist" soll "Fristen" finden), aber ein kurzes Praefix trifft
 *  zu viel: "hoch" fand ueber "hoch*" das Wort "Hochschule" und machte damit
 *  eine voellig fachfremde Frage scheinbar beantwortbar. Geprueft durch
 *  retrieval.test.ts ("findet zu einer fachfremden Frage nichts"). */
const MIN_PREFIX_LENGTH = 5;

/** Baut eine FTS5-MATCH-Abfrage. Alle Sonderzeichen entfallen. */
export function buildMatchQuery(question: string): string | null {
  const terms = question
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length >= MIN_TERM_LENGTH && !STOPWORDS.has(t))
    .slice(0, 24);
  if (terms.length === 0) return null;
  const unique = [...new Set(terms)];
  return unique.map((t) => (t.length >= MIN_PREFIX_LENGTH ? `"${t}"*` : `"${t}"`)).join(' OR ');
}

export interface RetrieveOptions {
  readonly sourceIds: readonly string[];
  readonly topK: number;
}

export function retrieve(db: Db, question: string, options: RetrieveOptions): RetrievedChunk[] {
  if (options.sourceIds.length === 0) return [];
  const match = buildMatchQuery(question);
  if (match === null) return [];

  const placeholders = options.sourceIds.map(() => '?').join(',');
  const sql = `
    SELECT c.id, c.source_id, c.ordinal, c.text, c.start_offset, c.end_offset, c.heading_path,
           s.title AS source_title,
           -bm25(chunks_fts, 1.0, 0.4) AS score
    FROM chunks_fts
    JOIN chunks c ON c.rowid = chunks_fts.rowid
    JOIN sources s ON s.id = c.source_id
    WHERE chunks_fts MATCH ?
      AND c.source_id IN (${placeholders})
    ORDER BY score DESC
    LIMIT ?`;

  const rows = db.prepare(sql).all(match, ...options.sourceIds, options.topK);
  return rows.map((row) => {
    const r = parseRow(RetrievedRowSchema, row, 'retrieved-chunk');
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
  });
}
