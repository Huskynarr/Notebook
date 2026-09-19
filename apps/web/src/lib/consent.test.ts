import { describe, expect, it } from 'vitest';
import {
  EINSTELLUNGS_SCHLUESSEL,
  ZUSTIMMUNG_SCHLUESSEL,
  einstellungLesen,
  einstellungSchreiben,
  einstellungsSpeicher,
  zustimmungLesen,
  zustimmungSchreiben,
  type Speicher,
} from './consent.ts';

/** Minimaler Speicher mit der Schnittstelle von localStorage. */
function speicher(): Storage {
  const daten = new Map<string, string>();
  return {
    get length() {
      return daten.size;
    },
    clear: () => {
      daten.clear();
    },
    getItem: (k) => daten.get(k) ?? null,
    key: (i) => [...daten.keys()][i] ?? null,
    removeItem: (k) => {
      daten.delete(k);
    },
    setItem: (k, v) => {
      daten.set(k, v);
    },
  };
}

function paar(): Speicher {
  return { lokal: speicher(), sitzung: speicher() };
}

describe('Einwilligung', () => {
  it('ist zu Beginn nicht entschieden, und Einstellungen leben nur in der Sitzung', () => {
    const s = paar();
    expect(zustimmungLesen(s)).toBeNull();
    expect(einstellungsSpeicher(s)).toBe(s.sitzung);
    einstellungSchreiben('notebook.lang', 'en', s);
    expect(s.lokal?.getItem('notebook.lang')).toBeNull();
    expect(s.sitzung?.getItem('notebook.lang')).toBe('en');
    expect(einstellungLesen('notebook.lang', s)).toBe('en');
  });

  it('traegt Einstellungen bei Zustimmung in den dauerhaften Speicher um', () => {
    const s = paar();
    einstellungSchreiben('notebook.design', 'huskynarr', s);
    const z = zustimmungSchreiben(true, s, new Date('2026-09-19T08:00:00Z'));
    expect(z).toEqual({ einstellungen: true, entschiedenAm: '2026-09-19T08:00:00.000Z' });
    expect(zustimmungLesen(s)).toEqual(z);
    expect(s.lokal?.getItem('notebook.design')).toBe('huskynarr');
    expect(s.sitzung?.getItem('notebook.design')).toBeNull();
    expect(einstellungsSpeicher(s)).toBe(s.lokal);
  });

  it('laesst bei Ablehnung nichts Dauerhaftes zurueck - auch nicht, was schon da war', () => {
    const s = paar();
    for (const k of EINSTELLUNGS_SCHLUESSEL) s.lokal?.setItem(k, 'x');
    zustimmungSchreiben(false, s);
    for (const k of EINSTELLUNGS_SCHLUESSEL) {
      expect(s.lokal?.getItem(k)).toBeNull();
      expect(s.sitzung?.getItem(k)).toBe('x');
    }
    // Die Entscheidung selbst bleibt - sonst fragt das Banner jedes Mal.
    expect(s.lokal?.getItem(ZUSTIMMUNG_SCHLUESSEL)).not.toBeNull();
    expect(einstellungsSpeicher(s)).toBe(s.sitzung);
  });

  it('verwirft eine beschaedigte Entscheidung statt sie zu raten', () => {
    const s = paar();
    s.lokal?.setItem(ZUSTIMMUNG_SCHLUESSEL, '{"einstellungen":"ja"}');
    expect(zustimmungLesen(s)).toBeNull();
    s.lokal?.setItem(ZUSTIMMUNG_SCHLUESSEL, 'kein json');
    expect(zustimmungLesen(s)).toBeNull();
  });

  it('kommt ohne Speicher aus', () => {
    const s: Speicher = { lokal: null, sitzung: null };
    expect(zustimmungLesen(s)).toBeNull();
    expect(() => zustimmungSchreiben(true, s)).not.toThrow();
    expect(einstellungLesen('notebook.lang', s)).toBeNull();
  });
});
