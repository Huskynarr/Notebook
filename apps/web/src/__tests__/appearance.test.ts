import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DESIGNS, DESIGN_SCHLUESSEL, MODI, MODUS_SCHLUESSEL } from '../lib/appearance.ts';

/**
 * Das Bootstrap-Skript in appearance.js setzt Design und Erscheinungsbild, bevor der
 * Browser zeichnet - sonst blitzt beim Laden das Vorgabedesign auf. Es kann die
 * Konstanten aus dem Modul nicht importieren, weil es vor dem Bundle laeuft.
 * Diese Verdopplung ist unvermeidlich; dass sie nicht auseinanderlaeuft, ist es
 * nicht.
 */
const BOOTSTRAP = readFileSync(new URL('../../public/appearance.js', import.meta.url), 'utf8');

describe('Erscheinungsbild', () => {
  it('appearance.js verwendet dieselben Speicherschluessel wie das Modul', () => {
    expect(BOOTSTRAP).toContain(DESIGN_SCHLUESSEL);
    expect(BOOTSTRAP).toContain(MODUS_SCHLUESSEL);
  });

  it('appearance.js liest wie das Modul beide Speicher (Einwilligung, lib/consent.ts)', () => {
    expect(BOOTSTRAP).toContain('localStorage.getItem');
    expect(BOOTSTRAP).toContain('sessionStorage.getItem');
  });

  it('appearance.js kennt jedes Design und jeden Modus', () => {
    for (const design of DESIGNS) expect(BOOTSTRAP).toContain(design.id);
    for (const modus of MODI) {
      if (modus.id === 'system') continue;
      expect(BOOTSTRAP).toContain(modus.id);
    }
  });

  it('jedes Design trägt einen Hinweis, was es ist', () => {
    for (const design of DESIGNS) {
      expect(design.label.length).toBeGreaterThan(2);
      expect(design.hinweis.length).toBeGreaterThan(20);
    }
  });
});
