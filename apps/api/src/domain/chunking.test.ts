import { describe, expect, it } from 'vitest';
import { chunkText, countWords } from './chunking.ts';

const MARKDOWN = `# Pruefungsordnung

## 3 Fristen

Die Widerspruchsfrist betraegt vierzehn Tage ab Bekanntgabe des Bescheids.

Der Widerspruch ist schriftlich beim Pruefungsamt einzureichen.

## 4 Wiederholung

Eine Pruefung kann zweimal wiederholt werden.
`;

describe('chunkText', () => {
  it('haelt die Offset-Zusage ein: slice(start,end) ist exakt der Abschnittstext', () => {
    const chunks = chunkText(MARKDOWN, { targetChars: 200, maxChars: 400 });
    expect(chunks.length).toBeGreaterThan(0);
    for (const chunk of chunks) {
      expect(MARKDOWN.slice(chunk.startOffset, chunk.endOffset)).toBe(chunk.text);
    }
  });

  it('erzeugt ueberlappungsfreie, aufsteigende Abschnitte', () => {
    const chunks = chunkText(MARKDOWN, { targetChars: 200, maxChars: 400 });
    for (let i = 1; i < chunks.length; i += 1) {
      const prev = chunks[i - 1]!;
      const curr = chunks[i]!;
      expect(curr.startOffset).toBeGreaterThanOrEqual(prev.endOffset);
      expect(curr.ordinal).toBe(prev.ordinal + 1);
    }
  });

  it('fuehrt den Ueberschriftenpfad mit', () => {
    const chunks = chunkText(MARKDOWN, { targetChars: 200, maxChars: 400 });
    const fristen = chunks.find((c) => c.text.includes('Widerspruchsfrist'));
    expect(fristen?.headingPath).toBe('Pruefungsordnung > 3 Fristen');
    const wiederholung = chunks.find((c) => c.text.includes('zweimal wiederholt'));
    expect(wiederholung?.headingPath).toBe('Pruefungsordnung > 4 Wiederholung');
  });

  it('fasst nicht ueber eine Abschnittsgrenze hinweg zusammen', () => {
    const chunks = chunkText(MARKDOWN, { targetChars: 10_000, maxChars: 20_000 });
    const paths = new Set(chunks.map((c) => c.headingPath));
    expect(paths.size).toBe(2);
  });

  it('nimmt weder fuehrende noch abschliessende Leerzeichen in einen Abschnitt auf', () => {
    for (const chunk of chunkText(MARKDOWN)) {
      expect(chunk.text).toBe(chunk.text.trim());
    }
  });

  it('teilt einen ueberlangen Absatz und behaelt die Offsets', () => {
    const long = `Satz eins ist hier. `.repeat(400);
    const chunks = chunkText(long, { targetChars: 1000, maxChars: 1500 });
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(long.slice(chunk.startOffset, chunk.endOffset)).toBe(chunk.text);
      expect(chunk.text.length).toBeLessThanOrEqual(1600);
    }
  });

  it('kommt mit reinem Text ohne Markdown zurecht', () => {
    const plain = 'Erster Absatz.\n\nZweiter Absatz.';
    const chunks = chunkText(plain, { targetChars: 10, maxChars: 20 });
    expect(chunks).toHaveLength(2);
    expect(chunks[0]!.text).toBe('Erster Absatz.');
    expect(chunks[1]!.text).toBe('Zweiter Absatz.');
    expect(chunks[1]!.headingPath).toBe('');
  });

  it('gibt fuer leeren Text keine Abschnitte zurueck', () => {
    expect(chunkText('')).toEqual([]);
    expect(chunkText('   \n\n  ')).toEqual([]);
  });
});

describe('countWords', () => {
  it('zaehlt durch Leerraum getrennte Folgen', () => {
    expect(countWords('eins zwei  drei\nvier')).toBe(4);
    expect(countWords('   ')).toBe(0);
  });
});
