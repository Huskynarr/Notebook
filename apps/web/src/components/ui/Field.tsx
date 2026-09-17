import type { InputHTMLAttributes, ReactElement, TextareaHTMLAttributes } from 'react';
import { useId } from 'react';
import { cx } from './cx.ts';

const BASE =
  'w-full rounded-sm bg-surface-raised px-3 py-2 text-body text-content placeholder:text-content-subtle ' +
  'border border-border hover:border-border-strong focus:border-action ' +
  'disabled:bg-surface-inset disabled:text-content-subtle disabled:cursor-not-allowed ' +
  'read-only:bg-surface-inset transition-colors duration-[80ms]';

const INVALID = 'border-danger hover:border-danger focus:border-danger';

interface Common {
  label: string;
  /** Beschriftung nur fuer Hilfstechnik sichtbar lassen. Sie entfaellt nie ganz. */
  labelHidden?: boolean | undefined;
  hint?: string | undefined;
  error?: string | undefined;
}

export function TextField({
  label,
  labelHidden = false,
  hint,
  error,
  className,
  ...rest
}: Common & InputHTMLAttributes<HTMLInputElement>): ReactElement {
  const id = useId();
  const describedBy = error !== undefined ? `${id}-error` : hint !== undefined ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={cx('text-label text-content', labelHidden && 'sr-only')}>
        {label}
      </label>
      <input
        id={id}
        {...rest}
        aria-invalid={error !== undefined}
        aria-describedby={describedBy}
        className={cx(BASE, error !== undefined && INVALID, className)}
      />
      <FieldMessage id={id} hint={hint} error={error} />
    </div>
  );
}

export function TextAreaField({
  label,
  labelHidden = false,
  hint,
  error,
  className,
  ...rest
}: Common & TextareaHTMLAttributes<HTMLTextAreaElement>): ReactElement {
  const id = useId();
  const describedBy = error !== undefined ? `${id}-error` : hint !== undefined ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={cx('text-label text-content', labelHidden && 'sr-only')}>
        {label}
      </label>
      <textarea
        id={id}
        {...rest}
        aria-invalid={error !== undefined}
        aria-describedby={describedBy}
        className={cx(BASE, 'resize-y', error !== undefined && INVALID, className)}
      />
      <FieldMessage id={id} hint={hint} error={error} />
    </div>
  );
}

function FieldMessage({
  id,
  hint,
  error,
}: {
  id: string;
  hint?: string | undefined;
  error?: string | undefined;
}): ReactElement | null {
  if (error !== undefined) {
    return (
      <p id={`${id}-error`} className="flex items-center gap-1 text-meta text-danger">
        <span aria-hidden="true">⚠</span>
        {error}
      </p>
    );
  }
  if (hint !== undefined) {
    return (
      <p id={`${id}-hint`} className="text-meta text-content-muted">
        {hint}
      </p>
    );
  }
  return null;
}
