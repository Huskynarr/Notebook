import { cx } from './cx.ts';

/** Ladeanzeige. `aria-hidden`, weil der umgebende Baustein den Zustand ansagt -
 *  sonst liest die Hilfstechnik zweimal dasselbe vor. */
export function Spinner({ className }: { className?: string }): React.ReactElement {
  return (
    <svg
      className={cx('animate-spin', className)}
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M14 8a6 6 0 0 0-6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
