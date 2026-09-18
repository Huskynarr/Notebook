import { describe, expect, it } from 'vitest';
import { segmentAnswer, splitInline } from './answer.ts';

describe('splitInline', () => {
  it('trennt Text und Marker', () => {
    expect(splitInline('Die Frist [1] endet.')).toEqual([
      { kind: 'text', text: 'Die Frist ' },
      { kind: 'marker', markers: [1] },
      { kind: 'text', text: ' endet.' },
    ]);
  });

  it('erkennt Mehrfachbelege', () => {
    const parts = splitInline('Aussage [2,5].');
    expect(parts[1]).toEqual({ kind: 'marker', markers: [2, 5] });
  });

  it('lässt markerfreien Text unverändert', () => {
    expect(splitInline('Nur Text')).toEqual([{ kind: 'text', text: 'Nur Text' }]);
  });
});

describe('segmentAnswer', () => {
  it('kennzeichnet einen Aussagesatz ohne Marker als unbelegt', () => {
    const [paragraph] = segmentAnswer(
      'Die Widerspruchsfrist beträgt vierzehn Tage [1]. Danach ist der Bescheid endgueltig bestandskraeftig.',
    );
    const sentences = paragraph?.sentences ?? [];
    expect(sentences).toHaveLength(2);
    expect(sentences[0]?.supported).toBe(true);
    expect(sentences[1]?.supported).toBe(false);
    expect(sentences[1]?.checkable).toBe(true);
  });

  it('kennzeichnet Ueberschriften und kurze Fragmente nicht', () => {
    const paragraphs = segmentAnswer('## Fristen\n\nJa.\n\nAlles belegt [1].');
    expect(paragraphs[0]?.heading).toBe(true);
    expect(paragraphs[0]?.sentences[0]?.checkable).toBe(false);
    expect(paragraphs[1]?.sentences[0]?.checkable).toBe(false);
  });

  it('trennt Absaetze an Leerzeilen', () => {
    expect(segmentAnswer('Erster Absatz [1].\n\nZweiter Absatz [2].')).toHaveLength(2);
  });

  it('kommt mit leerem Text zurecht', () => {
    expect(segmentAnswer('')).toEqual([]);
  });
});
