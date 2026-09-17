import { describe, expect, it } from 'vitest';
import type { RetrievedChunk } from '@notebook/shared';
import { countUnsupportedSentences, locateQuote, parseMarkers, validateCitations } from './citations.ts';

const SOURCE_TEXT =
  'Vorbemerkung.\n\nDie Widerspruchsfrist betraegt vierzehn Tage ab Bekanntgabe des Bescheids. ' +
  'Der Widerspruch ist schriftlich einzureichen.';

function chunk(overrides: Partial<RetrievedChunk> = {}): RetrievedChunk {
  const start = SOURCE_TEXT.indexOf('Die Widerspruchsfrist');
  const text = SOURCE_TEXT.slice(start);
  return {
    id: 'chunk-1',
    sourceId: 'source-1',
    sourceTitle: 'pruefungsordnung.md',
    ordinal: 1,
    text,
    startOffset: start,
    endOffset: start + text.length,
    headingPath: '3 Fristen',
    score: 1,
    ...overrides,
  };
}

describe('parseMarkers', () => {
  it('erkennt einfache und zusammengesetzte Marker', () => {
    expect(parseMarkers('Aussage [1]. Weitere [2,5] und [3, 7].')).toEqual([1, 2, 3, 5, 7]);
  });
  it('findet in markerfreiem Text nichts', () => {
    expect(parseMarkers('Reiner Text ohne Belege.')).toEqual([]);
  });
});

describe('locateQuote', () => {
  it('findet ein woertliches Zitat zeichengenau im Originaltext', () => {
    const c = chunk();
    const located = locateQuote(c, 'betraegt vierzehn Tage');
    expect(located.precision).toBe('exact');
    expect(SOURCE_TEXT.slice(located.startOffset, located.endOffset)).toBe(
      'betraegt vierzehn Tage',
    );
  });

  it('findet ein Zitat auch bei abweichendem Leerraum', () => {
    const c = chunk();
    const located = locateQuote(c, 'betraegt   vierzehn\n  Tage');
    expect(located.precision).toBe('exact');
    expect(SOURCE_TEXT.slice(located.startOffset, located.endOffset)).toBe(
      'betraegt vierzehn Tage',
    );
  });

  it('faellt auf den ganzen Abschnitt zurueck und weist das aus', () => {
    const c = chunk();
    const located = locateQuote(c, 'Ein Satz, der so nirgends steht.');
    expect(located.precision).toBe('chunk');
    expect(located.startOffset).toBe(c.startOffset);
    expect(located.endOffset).toBe(c.endOffset);
  });

  it('behandelt ein fehlendes Zitat als Abschnittsbeleg', () => {
    expect(locateQuote(chunk(), undefined).precision).toBe('chunk');
  });
});

describe('validateCitations', () => {
  const retrieved = [chunk()];

  it('loest einen gueltigen Marker zu einem Beleg mit Offsets auf', () => {
    const result = validateCitations('Die Frist betraegt vierzehn Tage [1].', retrieved, {
      '1': 'betraegt vierzehn Tage',
    });
    expect(result.citations).toHaveLength(1);
    expect(result.droppedMarkers).toEqual([]);
    const citation = result.citations[0]!;
    expect(citation.precision).toBe('exact');
    expect(SOURCE_TEXT.slice(citation.startOffset, citation.endOffset)).toBe(citation.excerpt);
  });

  it('entfernt einen erfundenen Marker aus dem Antworttext und meldet ihn', () => {
    const result = validateCitations('Behauptung ohne Grundlage [9].', retrieved);
    expect(result.answer).not.toContain('[9]');
    expect(result.droppedMarkers).toEqual([9]);
    expect(result.citations).toHaveLength(0);
  });

  it('behaelt bei gemischten Markern nur den gueltigen Teil', () => {
    const result = validateCitations('Aussage [1,4].', retrieved);
    expect(result.answer).toContain('[1]');
    expect(result.answer).not.toContain('4');
    expect(result.droppedMarkers).toEqual([4]);
  });

  it('liefert niemals einen Beleg, der nicht auf einen abgerufenen Abschnitt zeigt', () => {
    const result = validateCitations('A [1]. B [2]. C [99].', retrieved);
    const ids = new Set(retrieved.map((c) => c.id));
    for (const citation of result.citations) {
      expect(ids.has(citation.chunkId)).toBe(true);
    }
  });

  it('raeumt den Leerraum auf, der durch entfernte Marker entsteht', () => {
    const result = validateCitations('Ein Satz [7].', retrieved);
    expect(result.answer).toBe('Ein Satz.');
  });
});

describe('countUnsupportedSentences', () => {
  it('zaehlt belegfreie Aussagesaetze', () => {
    const text =
      'Die Frist betraegt vierzehn Tage [1]. Danach ist der Bescheid unanfechtbar geworden.';
    expect(countUnsupportedSentences(text)).toBe(1);
  });
  it('zaehlt Ueberschriften und kurze Fragmente nicht mit', () => {
    expect(countUnsupportedSentences('## Fristen\n\nJa.\n\nAlles belegt [1].')).toBe(0);
  });
});
