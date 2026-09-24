import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cx } from './cx.ts';
import type { Tone } from './Status.tsx';

interface ToastItem {
  id: number;
  tone: Tone;
  message: string;
}

const ToastContext = createContext<((tone: Tone, message: string) => void) | null>(null);

export function useToast(): (tone: Tone, message: string) => void {
  const push = useContext(ToastContext);
  if (push === null) throw new Error('useToast ausserhalb von ToastProvider verwendet');
  return push;
}

const TONE: Record<Tone, string> = {
  neutral: 'bg-surface-inset',
  info: 'bg-info-surface',
  warning: 'bg-warning-surface',
  danger: 'bg-danger-surface',
};

export function ToastProvider({ children }: { children: ReactNode }): ReactElement {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((tone: Tone, message: string) => {
    const id = Date.now() + Math.random();
    // Hoechstens drei gleichzeitig - danach verdecken sie den Inhalt.
    setItems((current) => [...current.slice(-2), { id, tone, message }]);
    // Fehler bleiben stehen, bis sie geschlossen werden.
    if (tone !== 'danger') {
      window.setTimeout(() => {
        setItems((current) => current.filter((item) => item.id !== id));
      }, 5000);
    }
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-60 flex flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            aria-live={item.tone === 'danger' ? 'assertive' : 'polite'}
            className="bg-surface-overlay text-body pointer-events-auto flex max-w-sm items-start gap-3 rounded-md px-3 py-2 shadow-md"
          >
            <span className={cx('flex-1', TONE[item.tone])}>{item.message}</span>
            <button
              type="button"
              aria-label="Meldung schließen"
              onClick={() => {
                setItems((current) => current.filter((i) => i.id !== item.id));
              }}
              className="text-content-subtle hover:text-content"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
