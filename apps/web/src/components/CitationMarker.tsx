import { useRef, useState, type ReactElement } from 'react';
import type { Citation } from '@notebook/shared';
import { cx } from './ui/cx.ts';

/**
 * Design-System 8.6. Ein echtes <button>: anklickbar, mit Tabulator erreichbar,
 * mit sprechender Beschriftung fuer Hilfstechnik.
 *
 * Diese Komponente wird nur fuer Marker gerendert, die das Backend gegen einen
 * tatsaechlich abgerufenen Abschnitt aufloesen konnte. Gibt es zu einer Nummer
 * keinen Beleg, erscheint gar nichts - ein Marker ins Leere ist ein Fehler,
 * kein Darstellungsfall.
 */
export function CitationMarker({
  markers,
  citations,
  activeMarker,
  onSelect,
}: {
  markers: readonly number[];
  citations: readonly Citation[];
  activeMarker: number | null;
  onSelect: (citation: Citation) => void;
}): ReactElement | null {
  const [preview, setPreview] = useState<Citation | null>(null);
  const timer = useRef<number | null>(null);

  const resolved = markers
    .map((n) => citations.find((c) => c.marker === n))
    .filter((c): c is Citation => c !== undefined);

  if (resolved.length === 0) return null;

  const first = resolved[0];
  if (first === undefined) return null;
  const isActive = resolved.some((c) => c.marker === activeMarker);

  const show = (citation: Citation, delayMs: number): void => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setPreview(citation);
    }, delayMs);
  };
  const hide = (): void => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setPreview(null);
    }, 150);
  };

  const label = resolved
    .map(
      (c) =>
        `Beleg ${c.marker}: ${c.sourceTitle}${c.headingPath === '' ? '' : `, ${c.headingPath}`}`,
    )
    .join('; ');

  return (
    <span className="relative inline-block">
      <button
        type="button"
        aria-label={label}
        onClick={() => {
          onSelect(first);
        }}
        onMouseEnter={() => {
          show(first, 400);
        }}
        onMouseLeave={hide}
        onFocus={() => {
          show(first, 0);
        }}
        onBlur={hide}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setPreview(null);
        }}
        className={cx(
          'rounded-xs text-micro mx-0.5 px-1 align-super font-mono transition-colors duration-[80ms]',
          // Die Belegfarbe liegt auf der Flaeche, nie auf der Schrift: CD-Gruen
          // haelt als Textfarbe auf hellem Grund nur rund 3,3:1.
          //
          // Die Textfarbe steht ausschliesslich in den beiden Zweigen. Stuende
          // zusaetzlich eine im gemeinsamen Teil, konkurrierten zwei
          // gleichrangige Utilities, und welche gewinnt, entscheidet die
          // Reihenfolge im erzeugten CSS - nicht die im Klassenstring. Genau so
          // fiel der Marker im dunklen Thema auf 2,65:1.
          'focus-visible:outline-accent',
          isActive
            ? 'bg-accent text-accent-contrast'
            : 'bg-accent-surface text-content-strong hover:bg-accent-surface-strong hover:underline',
        )}
      >
        [{resolved.map((c) => c.marker).join(',')}]
      </button>

      {preview !== null && (
        <span
          role="tooltip"
          className="bg-surface-overlay absolute bottom-full left-0 z-40 mb-1 block w-[380px] max-w-[80vw] rounded-lg p-3 text-left shadow-md"
          onMouseEnter={() => {
            if (timer.current !== null) window.clearTimeout(timer.current);
          }}
          onMouseLeave={hide}
        >
          <span className="text-label text-content-strong block">{preview.sourceTitle}</span>
          {preview.headingPath !== '' && (
            <span className="text-meta text-content-muted block">{preview.headingPath}</span>
          )}
          <span className="bg-accent-surface font-reading text-reading text-content mt-2 block max-h-40 overflow-y-auto px-2 py-1">
            {preview.excerpt}
          </span>
          <span className="text-meta text-content-muted mt-2 block font-mono">
            Zeichen {preview.startOffset}–{preview.endOffset}
            {preview.precision === 'chunk' && ' · ganzer Abschnitt'}
          </span>
        </span>
      )}
    </span>
  );
}
