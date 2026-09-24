import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Button, type ButtonProps } from './Button.tsx';
import { cx } from './cx.ts';

export interface MenuItem {
  readonly id: string;
  readonly label: string;
  readonly hint?: string;
  readonly danger?: boolean;
  readonly onSelect: () => void;
}

export interface MenuGroup {
  readonly title?: string;
  readonly items: readonly MenuItem[];
}

/**
 * Aufklappmenü. Ohne Bibliothek: ein Auslöser, eine Liste, Tastatur nach dem
 * WAI-ARIA-Muster (Pfeile, Pos1/Ende, Esc), Klick außerhalb schließt.
 */
export function Menu({
  label,
  groups,
  buttonProps,
  align = 'end',
  children,
}: {
  label: string;
  groups: readonly MenuGroup[];
  buttonProps?: Omit<ButtonProps, 'onClick' | 'children'>;
  align?: 'start' | 'end';
  children?: ReactNode;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const [lage, setLage] = useState<CSSProperties>({});
  const wurzel = useRef<HTMLDivElement>(null);
  const liste = useRef<HTMLDivElement>(null);
  const id = useId();
  const items = groups.flatMap((g) => g.items);

  // Die Liste haengt am document.body, damit kein Scrollbereich sie
  // abschneidet; sie klappt nach oben, wenn unten der Platz fehlt.
  useLayoutEffect(() => {
    if (!open) return undefined;
    const ausrichten = (): void => {
      const knopf = wurzel.current?.getBoundingClientRect();
      if (knopf === undefined) return;
      const hoehe = liste.current?.offsetHeight ?? 320;
      const untenFrei = window.innerHeight - knopf.bottom;
      const nachOben = untenFrei < hoehe + 8 && knopf.top > untenFrei;
      setLage({
        position: 'fixed',
        ...(nachOben ? { bottom: window.innerHeight - knopf.top + 4 } : { top: knopf.bottom + 4 }),
        ...(align === 'end'
          ? { right: Math.max(8, window.innerWidth - knopf.right) }
          : { left: Math.max(8, knopf.left) }),
        maxHeight: Math.max(160, (nachOben ? knopf.top : untenFrei) - 12),
      });
    };
    ausrichten();
    window.addEventListener('resize', ausrichten);
    return () => {
      window.removeEventListener('resize', ausrichten);
    };
  }, [open, align]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: MouseEvent): void => {
      const ziel = e.target as Node;
      if (!wurzel.current?.contains(ziel) && !liste.current?.contains(ziel)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    const erster = liste.current?.querySelector<HTMLElement>('[role="menuitem"]');
    erster?.focus();
    return () => {
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  const bewegen = (delta: number | 'first' | 'last'): void => {
    const knoepfe = [...(liste.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    if (knoepfe.length === 0) return;
    const aktuell = knoepfe.findIndex((k) => k === document.activeElement);
    let ziel: number;
    if (delta === 'first') ziel = 0;
    else if (delta === 'last') ziel = knoepfe.length - 1;
    else ziel = (aktuell + delta + knoepfe.length) % knoepfe.length;
    knoepfe[ziel]?.focus();
  };

  return (
    <div ref={wurzel} className="relative inline-block">
      <Button
        {...buttonProps}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          setOpen((o) => !o);
        }}
      >
        {children ?? label}
      </Button>
      {open &&
        createPortal(
          <div
            ref={liste}
            id={id}
            role="menu"
            aria-label={label}
            style={lage}
            className="bg-surface-overlay border-border-subtle z-40 min-w-56 overflow-y-auto rounded-lg border py-1 shadow-md"

            onKeyDown={(e) => {
              const aktionen: Record<string, () => void> = {
                ArrowDown: () => {
                  bewegen(1);
                },
                ArrowUp: () => {
                  bewegen(-1);
                },
                Home: () => {
                  bewegen('first');
                },
                End: () => {
                  bewegen('last');
                },
                Escape: () => {
                  setOpen(false);
                  wurzel.current?.querySelector('button')?.focus();
                },
              };
              const a = aktionen[e.key];
              if (a !== undefined) {
                e.preventDefault();
                a();
              }
            }}
          >
            {groups.map((gruppe, gi) => (
              <div key={gi} className={cx(gi > 0 && 'border-border-subtle mt-1 border-t pt-1')}>
                {gruppe.title !== undefined && (
                  <p className="text-micro text-content-muted px-3 pt-1.5 pb-1 uppercase">
                    {gruppe.title}
                  </p>
                )}
                {gruppe.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      item.onSelect();
                    }}
                    className={cx(
                      'text-body flex w-full flex-col items-start px-3 py-1.5 text-left',
                      'hover:bg-surface-sunken focus-visible:bg-surface-sunken outline-none',
                      item.danger ? 'text-danger' : 'text-content',
                    )}
                  >
                    <span>{item.label}</span>
                    {item.hint !== undefined && (
                      <span className="text-meta text-content-muted">{item.hint}</span>
                    )}
                  </button>
                ))}
              </div>
            ))}
            {items.length === 0 && <p className="text-meta text-content-muted px-3 py-2">–</p>}
          </div>,
          document.body,
        )}
    </div>
  );
}
