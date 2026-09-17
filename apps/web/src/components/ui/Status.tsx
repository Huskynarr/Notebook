import type { ReactElement, ReactNode } from 'react';
import { Spinner } from './Spinner.tsx';
import { cx } from './cx.ts';

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

/* Design-System 8.8. Farbe steht nie allein: jede Anzeige traegt zusaetzlich
   ein Symbol und Text. */
const BADGE: Record<Tone, string> = {
  neutral: 'bg-surface-inset text-content-muted',
  success: 'bg-success-surface text-success',
  warning: 'bg-warning-surface text-warning',
  danger: 'bg-danger-surface text-danger',
  info: 'bg-info-surface text-info',
};

const SYMBOL: Record<Tone, string> = {
  neutral: '·',
  success: '✓',
  warning: '!',
  danger: '✕',
  info: 'i',
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
        'text-micro inline-flex h-5 items-center gap-1 rounded-full px-2 uppercase',
        BADGE[tone],
      )}
    >
      {loading ? <Spinner className="size-3" /> : <span aria-hidden="true">{SYMBOL[tone]}</span>}
      {children}
    </span>
  );
}

const NOTE: Record<Tone, string> = {
  neutral: 'bg-surface-inset border-l-border-strong text-content',
  success: 'bg-success-surface border-l-success text-content',
  warning: 'bg-warning-surface border-l-warning text-content',
  danger: 'bg-danger-surface border-l-danger text-content',
  info: 'bg-info-surface border-l-info text-content',
};

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
        'text-body flex items-start gap-3 rounded-md border-l-[3px] px-3 py-3',
        NOTE[tone],
      )}
    >
      <span aria-hidden="true" className="mt-0.5 shrink-0 font-semibold">
        {SYMBOL[tone]}
      </span>
      <div className="flex-1">
        {title !== undefined && <p className="text-content-strong font-semibold">{title}</p>}
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
