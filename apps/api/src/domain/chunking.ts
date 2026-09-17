/**
 * Zerlegung einer Quelle in belegfaehige Abschnitte.
 *
 * Die eine Eigenschaft, auf die es ankommt: fuer jeden erzeugten Abschnitt gilt
 *   originalText.slice(chunk.startOffset, chunk.endOffset) === chunk.text
 * Ohne diese Zusage ist jeder Beleg wertlos, denn das UI markiert die Stelle
 * anhand der Offsets im Originaltext. `chunking.test.ts` prueft sie fuer jede
 * Beispieleingabe.
 */

export interface RawChunk {
  readonly ordinal: number;
  readonly text: string;
  readonly startOffset: number;
  readonly endOffset: number;
  readonly headingPath: string;
}

export interface ChunkOptions {
  /** Zielgroesse in Zeichen. Bloecke werden bis zu dieser Groesse zusammengefasst. */
  readonly targetChars: number;
  /** Ab dieser Groesse wird ein einzelner Block an Satzgrenzen geteilt. */
  readonly maxChars: number;
}

const DEFAULT_OPTIONS: ChunkOptions = { targetChars: 1200, maxChars: 2400 };

interface Block {
  readonly start: number;
  readonly end: number;
  readonly headingPath: string;
  readonly isHeading: boolean;
}

const HEADING_RE = /^(#{1,6})\s+(.*)$/;

/** Zerlegt in Bloecke: Absaetze, getrennt durch Leerzeilen. Ueberschriften sind
 *  eigene Bloecke und setzen den Pfad fuer die folgenden. */
function splitIntoBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  const headings: string[] = [];

  let cursor = 0;
  let blockStart: number | null = null;

  const lines = text.split('\n');
  let lineStart = 0;

  const flush = (endExclusive: number): void => {
    if (blockStart === null) return;
    const trimmedEnd = trimEnd(text, blockStart, endExclusive);
    if (trimmedEnd > blockStart) {
      blocks.push({
        start: blockStart,
        end: trimmedEnd,
        headingPath: headings.join(' > '),
        isHeading: false,
      });
    }
    blockStart = null;
  };

  for (const line of lines) {
    const lineEnd = lineStart + line.length;
    const headingMatch = HEADING_RE.exec(line);

    if (headingMatch) {
      flush(lineStart);
      const level = (headingMatch[1] ?? '').length;
      const title = (headingMatch[2] ?? '').trim();
      headings.length = Math.min(headings.length, level - 1);
      while (headings.length < level - 1) headings.push('');
      headings[level - 1] = title;
      headings.length = level;
      blocks.push({
        start: lineStart,
        end: lineEnd,
        headingPath: headings.join(' > '),
        isHeading: true,
      });
    } else if (line.trim() === '') {
      flush(lineStart);
    } else if (blockStart === null) {
      blockStart = lineStart;
    }

    lineStart = lineEnd + 1; // +1 fuer das entfernte '\n'
    cursor = lineEnd;
  }
  flush(Math.min(lineStart, text.length) === 0 ? cursor : text.length);

  return blocks;
}

function trimEnd(text: string, start: number, end: number): number {
  let e = end;
  while (e > start) {
    const ch = text[e - 1];
    if (ch === undefined || !/\s/.test(ch)) break;
    e -= 1;
  }
  return e;
}

/** Teilt einen zu grossen Block an Satzgrenzen, ohne Offsets zu verlieren. */
function splitLongBlock(
  text: string,
  start: number,
  end: number,
  maxChars: number,
): Array<{ start: number; end: number }> {
  if (end - start <= maxChars) return [{ start, end }];

  const pieces: Array<{ start: number; end: number }> = [];
  const sentenceEnd = /[.!?:;]\s|\n/g;
  let pieceStart = start;
  let lastBreak = start;

  sentenceEnd.lastIndex = 0;
  const slice = text.slice(start, end);
  let match: RegExpExecArray | null;
  while ((match = sentenceEnd.exec(slice)) !== null) {
    const absolute = start + match.index + match[0].length;
    if (absolute - pieceStart >= maxChars) {
      const cut = lastBreak > pieceStart ? lastBreak : absolute;
      pieces.push({ start: pieceStart, end: trimEnd(text, pieceStart, cut) });
      pieceStart = skipLeadingSpace(text, cut, end);
    }
    lastBreak = absolute;
  }
  if (pieceStart < end) pieces.push({ start: pieceStart, end });
  return pieces.filter((p) => p.end > p.start);
}

function skipLeadingSpace(text: string, from: number, limit: number): number {
  let i = from;
  while (i < limit) {
    const ch = text[i];
    if (ch === undefined || !/\s/.test(ch)) break;
    i += 1;
  }
  return i;
}

export function chunkText(text: string, options: Partial<ChunkOptions> = {}): RawChunk[] {
  const opts: ChunkOptions = { ...DEFAULT_OPTIONS, ...options };
  const blocks = splitIntoBlocks(text).filter((b) => !b.isHeading);

  const chunks: RawChunk[] = [];
  let pending: { start: number; end: number; headingPath: string } | null = null;

  const emit = (start: number, end: number, headingPath: string): void => {
    for (const piece of splitLongBlock(text, start, end, opts.maxChars)) {
      chunks.push({
        ordinal: chunks.length,
        text: text.slice(piece.start, piece.end),
        startOffset: piece.start,
        endOffset: piece.end,
        headingPath,
      });
    }
  };

  for (const block of blocks) {
    if (pending === null) {
      pending = { start: block.start, end: block.end, headingPath: block.headingPath };
      continue;
    }
    const wouldBe = block.end - pending.start;
    const sameSection = block.headingPath === pending.headingPath;
    if (sameSection && wouldBe <= opts.targetChars) {
      // Zusammenfassen: der Zwischenraum bleibt Teil des Abschnitts, damit die
      // Offsets zusammenhaengend bleiben.
      pending = { ...pending, end: block.end };
    } else {
      emit(pending.start, pending.end, pending.headingPath);
      pending = { start: block.start, end: block.end, headingPath: block.headingPath };
    }
  }
  if (pending !== null) emit(pending.start, pending.end, pending.headingPath);

  return chunks;
}

export function countWords(text: string): number {
  const matches = text.match(/\S+/g);
  return matches === null ? 0 : matches.length;
}
