import { useState, type ReactElement } from 'react';
import { einstellungLesen, einstellungSchreiben } from '../lib/consent.ts';
import { DESIGNS, MODI, type Erscheinungsbild } from '../lib/appearance.ts';
import { SPRACHEN, useT, type Sprache } from '../i18n/index.ts';
import { Button } from './ui/Button.tsx';
import { Dialog } from './ui/Dialog.tsx';
import { InlineNote } from './ui/Status.tsx';
import { cx } from './ui/cx.ts';

export const TOUR_SCHLUESSEL = 'notebook.tour.v1';

/**
 * Begrüßung beim ersten Start: Sprache, Design, kurzer Ablauf. Jede Wahl wirkt
 * sofort auf die Seite dahinter - der Dialog ist damit seine eigene Vorschau.
 * Kann jederzeit übersprungen und aus den Einstellungen erneut geöffnet werden.
 */
export function Tour({
  open,
  demo,
  sprache,
  erscheinungsbild,
  onSprache,
  onErscheinungsbild,
  onClose,
}: {
  open: boolean;
  demo: boolean;
  sprache: Sprache;
  erscheinungsbild: Erscheinungsbild;
  onSprache: (s: Sprache) => void;
  onErscheinungsbild: (e: Erscheinungsbild) => void;
  onClose: () => void;
}): ReactElement {
  const t = useT();
  const [schritt, setSchritt] = useState(0);
  const gesamt = 3;

  const beenden = (): void => {
    einstellungSchreiben(TOUR_SCHLUESSEL, 'gesehen');
    setSchritt(0);
    onClose();
  };

  const titel =
    [t('tour.language.title'), t('tour.design.title'), t('tour.how.title')][schritt] ?? '';

  return (
    <Dialog
      open={open}
      title={titel}
      description={t('tour.step', { index: schritt + 1, total: gesamt })}
      onClose={beenden}
      footer={
        <>
          <Button variant="ghost" onClick={beenden}>
            {t('tour.skip')}
          </Button>
          {schritt > 0 && (
            <Button
              onClick={() => {
                setSchritt((s) => s - 1);
              }}
            >
              {t('common.back')}
            </Button>
          )}
          {schritt < gesamt - 1 ? (
            <Button
              variant="primary"
              onClick={() => {
                setSchritt((s) => s + 1);
              }}
            >
              {t('common.next')}
            </Button>
          ) : (
            <Button variant="primary" onClick={beenden}>
              {t('tour.start')}
            </Button>
          )}
        </>
      }
    >
      {schritt === 0 && (
        <div className="flex flex-col gap-4">
          <p className="text-body text-content">{t('tour.language.body')}</p>
          <div className="grid grid-cols-2 gap-2">
            {SPRACHEN.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={s.id === sprache}
                onClick={() => {
                  onSprache(s.id);
                }}
                className={cx(
                  'text-heading rounded-md border px-4 py-5 text-left transition-colors duration-[80ms]',
                  s.id === sprache
                    ? 'border-action bg-action-surface text-content-strong'
                    : 'border-border-subtle hover:border-border text-content',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
          {demo && <InlineNote tone="info">{t('tour.demoNote')}</InlineNote>}
        </div>
      )}

      {schritt === 1 && (
        <div className="flex flex-col gap-4">
          <p className="text-body text-content">{t('tour.design.body')}</p>
          <div className="flex flex-col gap-2">
            {DESIGNS.map((d) => (
              <label
                key={d.id}
                className={cx(
                  'flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors duration-[80ms]',
                  d.id === erscheinungsbild.design
                    ? 'border-action bg-action-surface'
                    : 'border-border-subtle hover:border-border',
                )}
              >
                <input
                  type="radio"
                  name="tour-design"
                  checked={d.id === erscheinungsbild.design}
                  onChange={() => {
                    onErscheinungsbild({ ...erscheinungsbild, design: d.id });
                  }}
                  className="mt-1"
                />
                <span>
                  <span className="text-heading text-content-strong block">
                    {t(`design.${d.id}.label`)}
                  </span>
                  <span className="text-meta text-content-muted block">
                    {t(`design.${d.id}.hint`)}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            {MODI.map((m) => (
              <Button
                key={m.id}
                size="sm"
                variant={m.id === erscheinungsbild.modus ? 'primary' : 'secondary'}
                aria-pressed={m.id === erscheinungsbild.modus}
                onClick={() => {
                  onErscheinungsbild({ ...erscheinungsbild, modus: m.id });
                }}
              >
                {t(`settings.mode.${m.id}`)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {schritt === 2 && (
        <ol className="flex flex-col gap-3">
          {(['tour.how.1', 'tour.how.2', 'tour.how.3', 'tour.how.4'] as const).map((key, i) => (
            <li key={key} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="bg-action text-action-contrast text-label mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full"
              >
                {i + 1}
              </span>
              <span className="text-body text-content">{t(key)}</span>
            </li>
          ))}
        </ol>
      )}
    </Dialog>
  );
}

export function tourGesehen(): boolean {
  return einstellungLesen(TOUR_SCHLUESSEL) === 'gesehen';
}
