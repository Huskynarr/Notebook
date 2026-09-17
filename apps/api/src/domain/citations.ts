import type { Citation, RetrievedChunk } from '@notebook/shared';

/**
 * Validierung der Belege.
 *
 * Der Kern des Produkts steckt in `validateCitations`: Marker, die sich nicht
 * gegen einen tatsaechlich abgerufenen Abschnitt aufloesen lassen, werden aus
 * dem Antworttext entfernt, bevor die Antwort das Backend verlaesst. Ein Marker,
 * der ins Leere zeigt, darf das UI nie erreichen (AGENTS.md Regel 8).
 */

/** Erfasst [1] ebenso wie [2,5] und [3, 7]. */
const MARKER_RE = /\[(\d+(?:\s*,\s*\d+)*)\]/g;

export function parseMarkers(text: string): number[] {
  const found = new Set<number>();
  for (const match of text.matchAll(MARKER_RE)) {
    for (const part of (match[1] ?? '').split(',')) {
      const n = Number.parseInt(part.trim(), 10);
      if (Number.isInteger(n)) found.add(n);
    }
  }
  return [...found].sort((a, b) => a - b);
}

/** Normalisiert fuer den Zitatvergleich: Leerraum vereinheitlichen, typografische
 *  Anfuehrungszeichen und Bindestriche angleichen. Modelle veraendern beim
 *  Abschreiben regelmaessig genau diese Zeichen. */
function normalize(text: string): string {
  return text
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[‐-―−]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Sucht ein woertliches Zitat im Abschnitt und gibt die Offsets im Originaltext
 *  zurueck. Erst exakt, dann normalisiert. Findet sich nichts, gilt der ganze
 *  Abschnitt als Beleg - das wird als `precision: 'chunk'` ausgewiesen (D-009). */
export function locateQuote(
  chunk: RetrievedChunk,
  quote: string | undefined,
): { startOffset: number; endOffset: number; excerpt: string; precision: 'exact' | 'chunk' } {
  const fallback = {
    startOffset: chunk.startOffset,
    endOffset: chunk.endOffset,
    excerpt: chunk.text,
    precision: 'chunk' as const,
  };
  if (quote === undefined) return fallback;
  const trimmed = quote.trim();
  if (trimmed.length < 8) return fallback;

  const direct = chunk.text.indexOf(trimmed);
  if (direct >= 0) {
    return {
      startOffset: chunk.startOffset + direct,
      endOffset: chunk.startOffset + direct + trimmed.length,
      excerpt: chunk.text.slice(direct, direct + trimmed.length),
      precision: 'exact',
    };
  }

  // Normalisierter Vergleich: Position im Originaltext ueber eine Abbildung von
  // normalisierten auf urspruengliche Indizes zurueckrechnen.
  const map: number[] = [];
  let normalized = '';
  let lastWasSpace = false;
  for (let i = 0; i < chunk.text.length; i += 1) {
    const raw = chunk.text[i] ?? '';
    const isSpace = /\s/.test(raw);
    if (isSpace) {
      if (lastWasSpace || normalized.length === 0) continue;
      normalized += ' ';
      map.push(i);
      lastWasSpace = true;
      continue;
    }
    lastWasSpace = false;
    normalized += normalize(raw);
    map.push(i);
  }
  const needle = normalize(trimmed);
  const at = normalized.indexOf(needle);
  if (at < 0 || needle.length === 0) return fallback;

  const startIndex = map[at];
  const endIndex = map[Math.min(at + needle.length - 1, map.length - 1)];
  if (startIndex === undefined || endIndex === undefined) return fallback;

  return {
    startOffset: chunk.startOffset + startIndex,
    endOffset: chunk.startOffset + endIndex + 1,
    excerpt: chunk.text.slice(startIndex, endIndex + 1),
    precision: 'exact',
  };
}

export interface ValidationResult {
  readonly answer: string;
  readonly citations: Citation[];
  readonly droppedMarkers: number[];
  readonly unsupportedSentenceCount: number;
}

/**
 * Prueft alle Marker des Antworttexts gegen die abgerufenen Abschnitte.
 * Marker ausserhalb des Bereichs 1..retrieved.length werden aus dem Text
 * entfernt und in `droppedMarkers` berichtet.
 */
export function validateCitations(
  rawAnswer: string,
  retrieved: readonly RetrievedChunk[],
  quotes: Readonly<Record<string, string>> = {},
): ValidationResult {
  const dropped = new Set<number>();
  const used = new Map<number, Citation>();

  const answer = rawAnswer.replace(MARKER_RE, (_whole: string, group: string) => {
    const numbers = group.split(',').map((p) => Number.parseInt(p.trim(), 10));
    const valid: number[] = [];
    for (const n of numbers) {
      const chunk = retrieved[n - 1];
      if (!Number.isInteger(n) || n < 1 || chunk === undefined) {
        if (Number.isInteger(n)) dropped.add(n);
        continue;
      }
      valid.push(n);
      if (!used.has(n)) {
        const located = locateQuote(chunk, quotes[String(n)]);
        used.set(n, {
          marker: n,
          sourceId: chunk.sourceId,
          sourceTitle: chunk.sourceTitle,
          chunkId: chunk.id,
          headingPath: chunk.headingPath,
          startOffset: located.startOffset,
          endOffset: located.endOffset,
          excerpt: located.excerpt,
          precision: located.precision,
        });
      }
    }
    if (valid.length === 0) return '';
    return `[${valid.join(',')}]`;
  });

  const cleaned = answer.replace(/[ \t]+([.,;:!?])/g, '$1').replace(/[ \t]{2,}/g, ' ');

  return {
    answer: cleaned,
    citations: [...used.values()].sort((a, b) => a.marker - b.marker),
    droppedMarkers: [...dropped].sort((a, b) => a - b),
    unsupportedSentenceCount: countUnsupportedSentences(cleaned),
  };
}

/** Zaehlt Saetze ohne Marker. Sehr kurze Fragmente, Aufzaehlungszeichen und
 *  Ueberschriften zaehlen nicht mit - sie tragen keine belegpflichtige Aussage. */
export function countUnsupportedSentences(answer: string): number {
  const sentences = answer
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  let count = 0;
  for (const sentence of sentences) {
    const withoutMarkup = sentence.replace(/^[-*\d.)\s#]+/, '').trim();
    if (withoutMarkup.length < 25) continue;
    if (withoutMarkup.endsWith(':')) continue;
    if (!MARKER_RE.test(sentence)) count += 1;
    MARKER_RE.lastIndex = 0;
  }
  return count;
}
