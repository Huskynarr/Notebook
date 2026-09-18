import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Breiten der linken und rechten Spalte, per Trenner ziehbar, mit Tastatur
 * verstellbar, im localStorage gemerkt. Grenzen aus docs/design-system.md 6.
 */

export interface Spalten {
  readonly links: number;
  readonly rechts: number;
}

const GRENZEN = { links: [240, 420], rechts: [280, 480] } as const;
const VORGABE: Spalten = { links: 300, rechts: 340 };
const SCHLUESSEL = 'notebook.columns';

function begrenzen(wert: number, [min, max]: readonly [number, number]): number {
  return Math.min(max, Math.max(min, Math.round(wert)));
}

function lesen(): Spalten {
  try {
    const roh = window.localStorage.getItem(SCHLUESSEL);
    if (roh === null) return VORGABE;
    const p = JSON.parse(roh) as Partial<Spalten>;
    return {
      links: begrenzen(typeof p.links === 'number' ? p.links : VORGABE.links, GRENZEN.links),
      rechts: begrenzen(typeof p.rechts === 'number' ? p.rechts : VORGABE.rechts, GRENZEN.rechts),
    };
  } catch {
    return VORGABE;
  }
}

export function useResizableColumns(): {
  spalten: Spalten;
  ziehenStarten: (seite: keyof Spalten) => (e: React.PointerEvent) => void;
  perTaste: (seite: keyof Spalten, delta: number) => void;
  grenzen: typeof GRENZEN;
} {
  const [spalten, setSpalten] = useState<Spalten>(() => lesen());
  const aktiv = useRef<{ seite: keyof Spalten; startX: number; startBreite: number } | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(SCHLUESSEL, JSON.stringify(spalten));
    } catch {
      // ohne Speicher gilt die Breite bis zum Neuladen
    }
  }, [spalten]);

  useEffect(() => {
    const move = (e: PointerEvent): void => {
      const a = aktiv.current;
      if (a === null) return;
      // Die rechte Spalte waechst nach links, also gegen die Zeigerrichtung.
      const richtung = a.seite === 'links' ? 1 : -1;
      const neu = begrenzen(a.startBreite + richtung * (e.clientX - a.startX), GRENZEN[a.seite]);
      setSpalten((s) => (s[a.seite] === neu ? s : { ...s, [a.seite]: neu }));
    };
    const up = (): void => {
      if (aktiv.current === null) return;
      aktiv.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, []);

  const ziehenStarten = useCallback(
    (seite: keyof Spalten) => (e: React.PointerEvent) => {
      e.preventDefault();
      aktiv.current = { seite, startX: e.clientX, startBreite: spalten[seite] };
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [spalten],
  );

  const perTaste = useCallback((seite: keyof Spalten, delta: number) => {
    setSpalten((s) => ({ ...s, [seite]: begrenzen(s[seite] + delta, GRENZEN[seite]) }));
  }, []);

  return { spalten, ziehenStarten, perTaste, grenzen: GRENZEN };
}
