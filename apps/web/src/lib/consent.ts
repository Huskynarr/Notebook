/**
 * Einwilligung zur Speicherung auf diesem Geraet (CMP).
 *
 * Die Anwendung setzt keine Cookies und kein Tracking. Es gibt zwei Klassen
 * von Daten im Browser:
 *
 * - notwendig: die Anmeldesitzung (sessionStorage) und in der Demo die
 *   Notebooks, Quellen und Notizen (localStorage). Ohne sie tut die Anwendung
 *   nichts; sie brauchen keine Einwilligung.
 * - Einstellungen: Sprache, Design, Erscheinungsbild, Spaltenbreiten und ob
 *   die Einfuehrung gesehen wurde. Ohne Einwilligung leben sie nur im
 *   sessionStorage, also bis der Tab geschlossen wird.
 *
 * Die Entscheidung selbst liegt im localStorage - sie gehoert zur ersten
 * Klasse, sonst muesste das Banner bei jedem Start erneut fragen.
 */

export const ZUSTIMMUNG_SCHLUESSEL = 'notebook.consent.v1';

/** Schluessel, die der Einwilligung "Einstellungen" unterliegen. */
export const EINSTELLUNGS_SCHLUESSEL = [
  'notebook.lang',
  'notebook.design',
  'notebook.mode',
  'notebook.columns',
  'notebook.tour.v1',
] as const;

export interface Zustimmung {
  readonly einstellungen: boolean;
  /** ISO-Zeitpunkt der Entscheidung. */
  readonly entschiedenAm: string;
}

export interface Speicher {
  readonly lokal: Storage | null;
  readonly sitzung: Storage | null;
}

function fensterSpeicher(): Speicher {
  if (typeof window === 'undefined') return { lokal: null, sitzung: null };
  let lokal: Storage | null = null;
  let sitzung: Storage | null = null;
  try {
    lokal = window.localStorage;
  } catch {
    // privater Modus oder gesperrt
  }
  try {
    sitzung = window.sessionStorage;
  } catch {
    // dito
  }
  return { lokal, sitzung };
}

export function zustimmungLesen(speicher: Speicher = fensterSpeicher()): Zustimmung | null {
  try {
    const roh = speicher.lokal?.getItem(ZUSTIMMUNG_SCHLUESSEL);
    if (roh === null || roh === undefined) return null;
    const p = JSON.parse(roh) as Partial<Zustimmung>;
    if (typeof p.einstellungen !== 'boolean' || typeof p.entschiedenAm !== 'string') return null;
    return { einstellungen: p.einstellungen, entschiedenAm: p.entschiedenAm };
  } catch {
    return null;
  }
}

/** Speichert die Entscheidung und traegt die betroffenen Schluessel in den
 *  Speicher um, der ab jetzt gilt - eine abgelehnte Einwilligung laesst
 *  nichts im localStorage zurueck. */
export function zustimmungSchreiben(
  einstellungen: boolean,
  speicher: Speicher = fensterSpeicher(),
  jetzt: Date = new Date(),
): Zustimmung {
  const wert: Zustimmung = { einstellungen, entschiedenAm: jetzt.toISOString() };
  try {
    speicher.lokal?.setItem(ZUSTIMMUNG_SCHLUESSEL, JSON.stringify(wert));
  } catch {
    // ohne localStorage fragt das Banner beim naechsten Start erneut
  }
  const von = einstellungen ? speicher.sitzung : speicher.lokal;
  const nach = einstellungen ? speicher.lokal : speicher.sitzung;
  for (const schluessel of EINSTELLUNGS_SCHLUESSEL) {
    try {
      const vorhanden = von?.getItem(schluessel);
      if (vorhanden !== null && vorhanden !== undefined) {
        nach?.setItem(schluessel, vorhanden);
        von?.removeItem(schluessel);
      }
    } catch {
      // ein einzelner Schluessel darf die Umtragung nicht abbrechen
    }
  }
  return wert;
}

/** Der Speicher fuer Einstellungen nach aktueller Einwilligung: localStorage
 *  nur mit Zustimmung, sonst sessionStorage. Vor einer Entscheidung gilt
 *  ebenfalls nur die Sitzung. */
export function einstellungsSpeicher(speicher: Speicher = fensterSpeicher()): Storage | null {
  const zustimmung = zustimmungLesen(speicher);
  return zustimmung?.einstellungen === true ? speicher.lokal : speicher.sitzung;
}

/** Liest einen Einstellungsschluessel aus beiden Speichern - nach einem
 *  Wechsel der Einwilligung liegt der Wert genau in einem davon. */
export function einstellungLesen(
  schluessel: (typeof EINSTELLUNGS_SCHLUESSEL)[number],
  speicher: Speicher = fensterSpeicher(),
): string | null {
  try {
    return speicher.lokal?.getItem(schluessel) ?? speicher.sitzung?.getItem(schluessel) ?? null;
  } catch {
    return null;
  }
}

export function einstellungSchreiben(
  schluessel: (typeof EINSTELLUNGS_SCHLUESSEL)[number],
  wert: string,
  speicher: Speicher = fensterSpeicher(),
): void {
  try {
    einstellungsSpeicher(speicher)?.setItem(schluessel, wert);
  } catch {
    // dann gilt der Wert bis zum Neuladen
  }
}
