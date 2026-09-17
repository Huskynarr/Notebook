/**
 * Zerlegung des Antworttexts fuer die Darstellung.
 *
 * Reine Funktion ohne React, damit die Regel "ein Satz ohne Marker wird als
 * unbelegt gekennzeichnet" pruefbar ist, statt in der Komponente zu verschwinden.
 */

const MARKER_RE = /\[(\d+(?:\s*,\s*\d+)*)\]/g;

export type InlinePart =
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'marker'; readonly markers: readonly number[] };

export interface Sentence {
  readonly parts: readonly InlinePart[];
  /** false = kein Marker im Satz. Das UI unterstreicht solche Saetze gepunktet. */
  readonly supported: boolean;
  /** Sehr kurze Fragmente und Ueberschriften tragen keine belegpflichtige
   *  Aussage und werden nicht gekennzeichnet. */
  readonly checkable: boolean;
}

export interface Paragraph {
  readonly heading: boolean;
  readonly sentences: readonly Sentence[];
}

export function splitInline(text: string): InlinePart[] {
  const parts: InlinePart[] = [];
  let cursor = 0;
  MARKER_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = MARKER_RE.exec(text)) !== null) {
    if (match.index > cursor) {
      parts.push({ kind: 'text', text: text.slice(cursor, match.index) });
    }
    const markers = (match[1] ?? '')
      .split(',')
      .map((p) => Number.parseInt(p.trim(), 10))
      .filter((n) => Number.isInteger(n));
    parts.push({ kind: 'marker', markers });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) parts.push({ kind: 'text', text: text.slice(cursor) });
  return parts;
}

export function segmentAnswer(answer: string): Paragraph[] {
  return answer
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block !== '')
    .map((block) => {
      const heading = block.startsWith('#');
      const sentences = block
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter((s) => s !== '')
        .map((sentence): Sentence => {
          const bare = sentence.replace(/^[-*\d.)\s#]+/, '').trim();
          const supported = /\[\d/.test(sentence);
          return {
            parts: splitInline(sentence),
            supported,
            checkable: !heading && bare.length >= 25 && !bare.endsWith(':'),
          };
        });
      return { heading, sentences };
    });
}
