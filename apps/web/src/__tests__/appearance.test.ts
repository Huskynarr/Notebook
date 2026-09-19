import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DESIGNS, DESIGN_SCHLUESSEL, MODI, MODUS_SCHLUESSEL } from '../lib/appearance.ts';

/**
 * Das Inline-Skript in index.html setzt Design und Erscheinungsbild, bevor der
 * Browser zeichnet - sonst blitzt beim Laden das Vorgabedesign auf. Es kann die
 * Konstanten aus dem Modul nicht importieren, weil es vor dem Bundle laeuft.
 * Diese Verdopplung ist unvermeidlich; dass sie nicht auseinanderlaeuft, ist es
 * nicht.
 */
const INDEX_HTML = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

describe('Erscheinungsbild', () => {
  it('index.html verwendet dieselben Speicherschluessel wie das Modul', () => {
    expect(INDEX_HTML).toContain(DESIGN_SCHLUESSEL);
    expect(INDEX_HTML).toContain(MODUS_SCHLUESSEL);
  });

  it('index.html liest wie das Modul beide Speicher (Einwilligung, lib/consent.ts)', () => {
    expect(INDEX_HTML).toContain('localStorage.getItem');
    expect(INDEX_HTML).toContain('sessionStorage.getItem');
  });

  it('index.html kennt jedes Design und jeden Modus', () => {
    for (const design of DESIGNS) expect(INDEX_HTML).toContain(design.id);
    for (const modus of MODI) {
      if (modus.id === 'system') continue;
      expect(INDEX_HTML).toContain(modus.id);
    }
  });

  it('jedes Design trägt einen Hinweis, was es ist', () => {
    for (const design of DESIGNS) {
      expect(design.label.length).toBeGreaterThan(2);
      expect(design.hinweis.length).toBeGreaterThan(20);
    }
  });
});
