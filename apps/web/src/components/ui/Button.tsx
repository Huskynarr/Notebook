import type { ButtonHTMLAttributes, ReactElement, ReactNode } from 'react';
import { Spinner } from './Spinner.tsx';
import { cx } from './cx.ts';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

/* Umsetzung von docs/design-system.md 8.1.
   Keine Variante traegt accent - die Akzentfarbe gehoert dem Beleg. */
const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-action text-content-inverted hover:bg-action-hover disabled:bg-surface-inset disabled:text-content-subtle',
  secondary:
    'bg-surface-raised text-content border border-border hover:border-border-strong disabled:bg-surface-inset disabled:text-content-subtle disabled:border-border-subtle',
  ghost:
    'bg-transparent text-content-muted hover:bg-surface-sunken hover:text-content disabled:text-content-subtle disabled:hover:bg-transparent',
  danger:
    'bg-danger text-content-inverted hover:brightness-110 focus-visible:outline-danger disabled:bg-surface-inset disabled:text-content-subtle',
};

const SIZES: Record<Size, string> = {
  sm: 'h-7 px-2 text-meta gap-1',
  md: 'h-9 px-3 text-body gap-2',
  lg: 'h-11 px-4 text-body gap-2',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...rest
}: ButtonProps): ReactElement {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled === true || loading}
      aria-busy={loading}
      className={cx(
        'inline-flex items-center justify-center rounded-sm font-medium',
        'transition-colors duration-[80ms] active:scale-[0.96] motion-reduce:active:scale-100',
        'disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {/* Der Spinner ersetzt das Symbol; die Beschriftung bleibt stehen, damit
          die Breite sich beim Laden nicht aendert (Design-System 8.1). */}
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
}
