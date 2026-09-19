import { createContext, useContext } from 'react';
import { einstellungLesen, einstellungSchreiben } from '../lib/consent.ts';
import { de, type TextKey } from './de.ts';
import { en } from './en.ts';

export type Sprache = 'de' | 'en';
export const SPRACHEN: ReadonlyArray<{ id: Sprache; label: string }> = [
  { id: 'de', label: 'Deutsch' },
  { id: 'en', label: 'English' },
];

export const SPRACHE_SCHLUESSEL = 'notebook.lang';

const TEXTE = { de, en } as const;

export type Uebersetzer = (key: TextKey, params?: Record<string, string | number>) => string;

/** Fuellt {name}-Platzhalter. Ein fehlender Parameter bleibt sichtbar als
 *  {name} stehen - besser auffindbar als ein stilles "undefined". */
export function uebersetzen(
  sprache: Sprache,
  key: TextKey,
  params?: Record<string, string | number>,
): string {
  const vorlage = TEXTE[sprache][key];
  if (params === undefined) return vorlage;
  return vorlage.replace(/\{(\w+)\}/g, (ganz, name: string) => {
    const wert = params[name];
    return wert === undefined ? ganz : String(wert);
  });
}

export function spracheLesen(): Sprache {
  const gespeichert = einstellungLesen(SPRACHE_SCHLUESSEL);
  if (gespeichert === 'de' || gespeichert === 'en') return gespeichert;
  return typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('de')
    ? 'de'
    : 'en';
}

export function spracheSchreiben(sprache: Sprache): void {
  einstellungSchreiben(SPRACHE_SCHLUESSEL, sprache);
  if (typeof document !== 'undefined') document.documentElement.lang = sprache;
}

export const SpracheContext = createContext<{ sprache: Sprache; t: Uebersetzer }>({
  sprache: 'de',
  t: (key, params) => uebersetzen('de', key, params),
});

export function useT(): Uebersetzer {
  return useContext(SpracheContext).t;
}

export function useSprache(): Sprache {
  return useContext(SpracheContext).sprache;
}

export type { TextKey };
