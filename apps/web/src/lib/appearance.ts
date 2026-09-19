/**
 * Design- und Erscheinungsbildwahl.
 *
 * Die Werte landen als `data-design` und `data-theme` am <html>-Element; welche
 * Tokens daraus folgen, steht in `styles/theme.css` (erzeugt aus
 * `tools/build-theme.py`).
 *
 * Die Speicherschluessel stehen zusaetzlich im Inline-Skript in `index.html`,
 * das die Auswahl vor dem ersten Zeichnen setzt - sonst blitzt beim Laden kurz
 * das Vorgabedesign auf. Dass beide Stellen dieselben Schluessel verwenden,
 * prueft `__tests__/appearance.test.ts`.
 */

import { einstellungLesen, einstellungSchreiben } from './consent.ts';

export const DESIGN_SCHLUESSEL = 'notebook.design';
export const MODUS_SCHLUESSEL = 'notebook.mode';

export const DESIGNS = [
  {
    id: 'eigen',
    label: 'Papier und Tinte',
    hinweis: 'Eigenes Design: warme Flächen, Serife für Lesetext, Braun für Belege.',
  },
  {
    id: 'uni-freiburg',
    label: 'Universität Freiburg',
    hinweis: 'Corporate Design der Universität. Hausschrift nur mit Lizenz, sonst Arial.',
  },
  {
    id: 'huskynarr',
    label: 'huskynarr',
    hinweis: 'Angenähert an huskynarr.de — belegt ist nur die Grundfarbe #0c0a09.',
  },
] as const;

export type DesignId = (typeof DESIGNS)[number]['id'];

export const MODI = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Hell' },
  { id: 'dark', label: 'Dunkel' },
] as const;

export type ModusId = (typeof MODI)[number]['id'];

export interface Erscheinungsbild {
  readonly design: DesignId;
  readonly modus: ModusId;
}

export const VORGABE: Erscheinungsbild = { design: 'eigen', modus: 'system' };

function istDesign(wert: unknown): wert is DesignId {
  return DESIGNS.some((d) => d.id === wert);
}

function istModus(wert: unknown): wert is ModusId {
  return MODI.some((m) => m.id === wert);
}

// Gespeichert wird nach Einwilligung (lib/consent.ts): dauerhaft nur mit
// Zustimmung, sonst fuer die Sitzung.
export function lesen(): Erscheinungsbild {
  const design = einstellungLesen(DESIGN_SCHLUESSEL);
  const modus = einstellungLesen(MODUS_SCHLUESSEL);
  return {
    design: istDesign(design) ? design : VORGABE.design,
    modus: istModus(modus) ? modus : VORGABE.modus,
  };
}

export function schreiben(wert: Erscheinungsbild): void {
  einstellungSchreiben(DESIGN_SCHLUESSEL, wert.design);
  einstellungSchreiben(MODUS_SCHLUESSEL, wert.modus);
}

export function anwenden(wert: Erscheinungsbild): void {
  const wurzel = document.documentElement;
  wurzel.dataset['design'] = wert.design;
  if (wert.modus === 'system') delete wurzel.dataset['theme'];
  else wurzel.dataset['theme'] = wert.modus;
}
