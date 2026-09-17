import { useEffect, useRef, type ReactElement, type ReactNode } from 'react';
import { cx } from './cx.ts';

export interface DialogProps {
  open: boolean;
  title: string;
  description?: string;
  /** Breit fuer Formulare mit Textbereich. */
  wide?: boolean;
  /** Bei ungespeicherten Eingaben schliesst Esc nicht von selbst. */
  dismissable?: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Dialog({
  open,
  title,
  description,
  wide = false,
  dismissable = true,
  onClose,
  children,
  footer,
}: DialogProps): ReactElement | null {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const focusable = panelRef.current?.querySelector<HTMLElement>(
      'input, textarea, select, button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && dismissable) {
        event.preventDefault();
        onClose();
        return;
      }
      // Fokusfalle: der Tabulator verlaesst den Dialog nicht.
      if (event.key !== 'Tab' || panelRef.current === null) return;
      const items = [
        ...panelRef.current.querySelectorAll<HTMLElement>(
          'input, textarea, select, button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (first === undefined || last === undefined) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [open, dismissable, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="scrim absolute inset-0"
        onClick={dismissable ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={cx(
          'bg-surface-overlay relative flex max-h-[85vh] w-full flex-col rounded-lg shadow-lg',
          wide ? 'max-w-[720px]' : 'max-w-[480px]',
        )}
      >
        <div className="flex flex-col gap-1 px-5 pt-5">
          <h2 id="dialog-title" className="text-title text-content-strong">
            {title}
          </h2>
          {description !== undefined && (
            <p className="text-body text-content-muted">{description}</p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer !== undefined && (
          <div className="border-border-subtle flex items-center justify-end gap-2 border-t px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
