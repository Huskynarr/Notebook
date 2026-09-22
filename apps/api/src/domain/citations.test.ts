import { describe, expect, it } from 'vitest';
import type { RetrievedChunk } from '@notebook/shared';
import {
  countUnsupportedSentences,
  locateQuote,
  parseMarkers,
  validateCitations,
} from './citations.ts';

const SOURCE_TEXT =
  'Vorbemerkung.\n\nDie Widerspruchsfrist beträgt vierzehn Tage ab Bekanntgabe des Bescheids. ' +
  'Der Widerspruch ist schriftlich einzureichen.';

function chunk(overrides: Partial<RetrievedChunk> = {}): RetrievedChunk {
  const start = SOURCE_TEXT.indexOf('Die Widerspruchsfrist');
  const text = SOURCE_TEXT.slice(start);
  return {
    id: 'chunk-1',
    sourceId: 'source-1',
    sourceTitle: 'prüfungsordnung.md',
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
  it('findet ein wörtliches Zitat zeichengenau im Originaltext', () => {
    const c = chunk();
    const located = locateQuote(c, 'beträgt vierzehn Tage');
    expect(located.precision).toBe('exact');
    expect(SOURCE_TEXT.slice(located.startOffset, located.endOffset)).toBe('beträgt vierzehn Tage');
  });

  it('findet ein Zitat auch bei abweichendem Leerraum', () => {
    const c = chunk();
    const located = locateQuote(c, 'beträgt   vierzehn\n  Tage');
    expect(located.precision).toBe('exact');
    expect(SOURCE_TEXT.slice(located.startOffset, located.endOffset)).toBe('beträgt vierzehn Tage');
  });

  it('faellt auf den ganzen Abschnitt zurück und weist das aus', () => {
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
    const result = validateCitations('Die Frist beträgt vierzehn Tage [1].', retrieved, {
      '1': 'beträgt vierzehn Tage',
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
    const result = validateCitations('Aussage [1,4].', retrieved, { '1': 'vierzehn Tage' });
    expect(result.answer).toContain('[1]');
    expect(result.answer).not.toContain('4');
    expect(result.droppedMarkers).toEqual([4]);
  });

  it('liefert niemals einen Beleg, der nicht auf einen abgerufenen Abschnitt zeigt', () => {
    const result = validateCitations('A [1]. B [2]. C [99].', retrieved, { '1': 'vierzehn Tage' });
    expect(result.citations).toHaveLength(1);
    const ids = new Set(retrieved.map((c) => c.id));
    for (const citation of result.citations) {
      expect(ids.has(citation.chunkId)).toBe(true);
    }
  });

  it('raeumt den Leerraum auf, der durch entfernte Marker entsteht', () => {
    const result = validateCitations('Ein Satz [7].', retrieved);
    expect(result.answer).toBe('Ein Satz.');
  });

  it.each([undefined, 'Die Frist beträgt hundert Jahre.'])(
    'verwirft fehlende oder erfundene Zitate (%s)',
    (quote) => {
      const result = validateCitations(
        'Die Frist beträgt hundert Jahre [1].',
        retrieved,
        quote === undefined ? {} : { '1': quote },
      );
      expect(result.citations).toEqual([]);
      expect(result.droppedMarkers).toEqual([1]);
      expect(result.hasInvalidCitations).toBe(true);
    },
  );

  it('markiert numerisch überlaufende Belege ebenfalls als ungültig', () => {
    const result = validateCitations(`Aussage [${'9'.repeat(400)}].`, retrieved);
    expect(result.hasInvalidCitations).toBe(true);
    expect(result.droppedMarkers).toEqual([]);
  });
});

describe('countUnsupportedSentences', () => {
  it('zählt belegfreie Aussagesaetze', () => {
    const text =
      'Die Frist beträgt vierzehn Tage [1]. Danach ist der Bescheid unanfechtbar geworden.';
    expect(countUnsupportedSentences(text)).toBe(1);
  });
  it('prüft auch kurze Aussagen und Überschriften', () => {
    expect(countUnsupportedSentences('## Fristen\n\nJa.\n\nAlles belegt [1].')).toBe(2);
  });
  it('lässt einen Marker vor einer späteren Behauptung nicht gelten', () => {
    expect(countUnsupportedSentences('Die Frist gilt [1], danach verfällt jeder Anspruch.')).toBe(
      1,
    );
  });
  it('trennt Dezimalzahlen nicht als eigene Aussage', () => {
    expect(countUnsupportedSentences('Die Quote beträgt 10.5 Prozent [1].')).toBe(0);
  });
});
