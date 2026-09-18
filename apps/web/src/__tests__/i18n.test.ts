import { describe, expect, it } from 'vitest';
import { de } from '../i18n/de.ts';
import { en } from '../i18n/en.ts';
import { uebersetzen } from '../i18n/index.ts';

/* Beide Sprachen muessen dieselben Platzhalter tragen - sonst bleibt in einer
 * Sprache ein `{name}` im Text stehen oder ein Wert wird verschluckt. */
function platzhalter(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1] ?? '').sort();
}

describe('Uebersetzungen', () => {
  it('haben in beiden Sprachen dieselben Platzhalter', () => {
    for (const key of Object.keys(de) as Array<keyof typeof de>) {
      expect(platzhalter(en[key]), key).toEqual(platzhalter(de[key]));
    }
  });

  it('lassen keinen Text leer', () => {
    for (const [key, text] of [...Object.entries(de), ...Object.entries(en)]) {
      expect(text.trim(), key).not.toBe('');
    }
  });

  it('setzen Werte ein und lassen unbekannte Platzhalter sichtbar', () => {
    expect(uebersetzen('de', 'error.status', { status: 503 })).toContain('503');
    expect(uebersetzen('en', 'error.status', { status: 503 })).toContain('503');
  });
});
