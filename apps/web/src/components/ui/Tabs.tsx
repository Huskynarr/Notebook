import { useRef, type ReactElement } from 'react';
import { cx } from './cx.ts';

export interface TabItem<T extends string> {
  id: T;
  label: string;
  count?: number;
  disabled?: boolean;
}

/** Design-System 8.7. Pfeiltasten wechseln, Pos1/Ende springen an den Rand. */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  className,
}: {
  items: ReadonlyArray<TabItem<T>>;
  value: T;
  onChange: (id: T) => void;
  label: string;
  className?: string;
}): ReactElement {
  const refs = useRef(new Map<T, HTMLButtonElement>());

  const move = (delta: number | 'first' | 'last'): void => {
    const usable = items.filter((i) => i.disabled !== true);
    if (usable.length === 0) return;
    const current = usable.findIndex((i) => i.id === value);
    let next: number;
    if (delta === 'first') next = 0;
    else if (delta === 'last') next = usable.length - 1;
    else next = (current + delta + usable.length) % usable.length;
    const target = usable[next];
    if (target === undefined) return;
    onChange(target.id);
    refs.current.get(target.id)?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cx('border-border-subtle flex border-b', className)}
      onKeyDown={(event) => {
        const actions: Record<string, () => void> = {
          ArrowRight: () => {
            move(1);
          },
          ArrowLeft: () => {
            move(-1);
          },
          Home: () => {
            move('first');
          },
          End: () => {
            move('last');
          },
        };
        const action = actions[event.key];
        if (action !== undefined) {
          event.preventDefault();
          action();
        }
      }}
    >
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            ref={(el) => {
              if (el !== null) refs.current.set(item.id, el);
            }}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={selected}
            aria-controls={`panel-${item.id}`}
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled === true}
            onClick={() => {
              onChange(item.id);
            }}
            className={cx(
              'text-label relative flex items-center gap-2 rounded-t-sm px-3 py-2',
              'disabled:text-content-subtle transition-colors duration-[140ms] disabled:cursor-not-allowed',
              selected
                ? 'bg-action-surface text-content-strong'
                : 'text-content-muted hover:bg-surface-sunken hover:text-content',
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className={cx(
                  'text-meta rounded-full px-1.5 tabular-nums',
                  selected
                    ? 'bg-surface-raised text-content'
                    : 'bg-surface-inset text-content-muted',
                )}
              >
                {item.count}
              </span>
            )}
            {selected && (
              <span aria-hidden="true" className="bg-action absolute inset-x-0 -bottom-px h-0.5" />
            )}
          </button>
        );
      })}
    </div>
  );
}
