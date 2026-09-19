import { useId, useState, type ReactElement } from 'react';
import { useT } from '../i18n/index.ts';
import { Button } from './ui/Button.tsx';

/**
 * Einwilligungsbanner (CMP) mit zwei Klassen: "Notwendig" (immer aktiv) und
 * "Einstellungen merken" (wählbar). Kein Cookie, kein Tracking - das Banner
 * sagt genau das und verlangt nichts, was es nicht einlöst.
 *
 * Nicht modal: die Anwendung bleibt bedienbar, das Banner liegt unten und
 * bleibt, bis entschieden ist. "Alle akzeptieren" und "Nur notwendige" sind
 * gleich groß und gleich erreichbar - kein dunkles Muster.
 */
export function ConsentBanner({
  onDecide,
}: {
  onDecide: (einstellungen: boolean) => void;
}): ReactElement {
  const t = useT();
  const id = useId();
  const [offen, setOffen] = useState(false);
  const [einstellungen, setEinstellungen] = useState(true);

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby={`${id}-titel`}
      aria-describedby={`${id}-text`}
      data-testid="consent-banner"
      className="bg-surface-overlay border-border-subtle no-print fixed inset-x-0 bottom-0 z-50 border-t shadow-md"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-4">
        <div>
          <h2 id={`${id}-titel`} className="text-heading text-content-strong">
            {t('consent.title')}
          </h2>
          <p id={`${id}-text`} className="text-body text-content mt-1">
            {t('consent.body')}
          </p>
        </div>

        {offen && (
          <ul className="flex flex-col gap-2">
            <li className="border-border-subtle flex items-start gap-3 rounded-md border p-3">
              <input
                type="checkbox"
                checked
                disabled
                aria-label={t('consent.necessary.title')}
                className="mt-1 size-4"
              />
              <span>
                <span className="text-label text-content-strong block">
                  {t('consent.necessary.title')}{' '}
                  <span className="text-meta text-content-muted font-normal">
                    · {t('consent.always')}
                  </span>
                </span>
                <span className="text-meta text-content-muted block">
                  {t('consent.necessary.body')}
                </span>
              </span>
            </li>
            <li className="border-border-subtle flex items-start gap-3 rounded-md border p-3">
              <input
                type="checkbox"
                checked={einstellungen}
                onChange={(e) => {
                  setEinstellungen(e.target.checked);
                }}
                aria-label={t('consent.settings.title')}
                className="mt-1 size-4 accent-[var(--t-action)]"
              />
              <span>
                <span className="text-label text-content-strong block">
                  {t('consent.settings.title')}
                </span>
                <span className="text-meta text-content-muted block">
                  {t('consent.settings.body')}
                </span>
              </span>
            </li>
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            onClick={() => {
              onDecide(true);
            }}
          >
            {t('consent.acceptAll')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              onDecide(false);
            }}
          >
            {t('consent.necessaryOnly')}
          </Button>
          {offen && (
            <Button
              variant="secondary"
              onClick={() => {
                onDecide(einstellungen);
              }}
            >
              {t('consent.save')}
            </Button>
          )}
          <Button
            variant="ghost"
            aria-expanded={offen}
            onClick={() => {
              setOffen((o) => !o);
            }}
          >
            {offen ? t('consent.less') : t('consent.customize')}
          </Button>
        </div>
      </div>
    </section>
  );
}
