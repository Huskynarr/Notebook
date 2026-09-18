import type { ReactElement, ReactNode } from 'react';
import { Spinner } from './Spinner.tsx';
import { cx } from './cx.ts';

/* Umsetzung von docs/design-system.md 8.8.
   Gruen fehlt in dieser Liste mit Absicht: die Belegfarbe ist der Belegmechanik
   vorbehalten. Eine Bestaetigung ist blau, damit ein Zitat die einzige gruene
   Stelle im Bild bleibt.

   Der Text ist immer content-strong, nie die Statusfarbe: CD-Gelb traegt als
   Schrift keinen ausreichenden Kontrast. Die Farbe liegt auf Flaeche, Balken
   und Symbol - und nie allein, jede Anzeige traegt zusaetzlich Text. */
export type Tone = 'neutral' | 'info' | 'warning' | 'danger';

const SURFACE: Record<Tone, string> = {
  neutral: 'bg-surface-inset',
  info: 'bg-info-surface',
  warning: 'bg-warning-surface',
  danger: 'bg-danger-surface',
};

const BAR: Record<Tone, string> = {
  neutral: 'border-l-border-strong',
  info: 'border-l-info',
  warning: 'border-l-warning-mark',
  danger: 'border-l-danger',
};

const SYMBOL: Record<Tone, string> = {
  neutral: '·',
  info: 'i',
  warning: '!',
  danger: '✕',
};

export function Badge({
  tone = 'neutral',
  loading = false,
  children,
}: {
  tone?: Tone;
  loading?: boolean;
  children: ReactNode;
}): ReactElement {
  return (
    <span
      className={cx(
        'text-micro text-content-strong rounded-xs inline-flex h-5 items-center gap-1 px-2 uppercase',
        SURFACE[tone],
      )}
    >
      {loading ? <Spinner className="size-3" /> : <span aria-hidden="true">{SYMBOL[tone]}</span>}
      {children}
    </span>
  );
}

export function InlineNote({
  tone = 'info',
  title,
  action,
  children,
}: {
  tone?: Tone;
  title?: string;
  action?: ReactNode;
  children: ReactNode;
}): ReactElement {
  return (
    <div
      className={cx(
        'text-body text-content flex items-start gap-3 rounded-md border-l-[3px] px-3 py-3',
        SURFACE[tone],
        BAR[tone],
      )}
    >
      <span aria-hidden="true" className="text-content-strong mt-0.5 shrink-0 font-bold">
        {SYMBOL[tone]}
      </span>
      <div className="flex-1">
        {title !== undefined && <p className="text-content-strong font-bold">{title}</p>}
        <div>{children}</div>
      </div>
      {action}
    </div>
  );
}

/** Leerer Zustand. Nennt immer den naechsten Schritt statt nur "keine Daten". */
export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}): ReactElement {
  return (
    <div className="border-border flex flex-col items-start gap-2 rounded-md border border-dashed px-4 py-5">
      <p className="text-heading text-content-strong">{title}</p>
      <p className="text-body text-content-muted">{children}</p>
      {action}
    </div>
  );
}
