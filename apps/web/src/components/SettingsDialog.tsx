import type { ReactElement } from 'react';
import { DESIGNS, MODI, type Erscheinungsbild } from '../lib/appearance.ts';
import { SPRACHEN, useT, type Sprache } from '../i18n/index.ts';
import { Button } from './ui/Button.tsx';
import { Dialog } from './ui/Dialog.tsx';
import { cx } from './ui/cx.ts';

/**
 * Einstellungen. Jede Änderung wirkt sofort - der Dialog zeigt sie damit
 * selbst, und es braucht keinen Speichern-Knopf, dessen Wirkung man erst
 * nach dem Schließen sieht.
 */
export function SettingsDialog({
  open,
  wert,
  sprache,
  apiBaseUrl,
  demo,
  onChange,
  onSprache,
  onShowTour,
  onClose,
}: {
  open: boolean;
  wert: Erscheinungsbild;
  sprache: Sprache;
  apiBaseUrl: string;
  demo: boolean;
  onChange: (wert: Erscheinungsbild) => void;
  onSprache: (s: Sprache) => void;
  onShowTour: () => void;
  onClose: () => void;
}): ReactElement {
  const t = useT();
  return (
    <Dialog
      open={open}
      title={t('settings.title')}
      description={t('settings.description')}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onShowTour}>
            {t('settings.showTour')}
          </Button>
          <Button variant="primary" onClick={onClose}>
            {t('common.done')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <fieldset>
          <legend className="text-label text-content mb-2">{t('settings.language')}</legend>
          <div className="flex gap-2">
            {SPRACHEN.map((s) => (
              <Button
                key={s.id}
                variant={s.id === sprache ? 'primary' : 'secondary'}
                aria-pressed={s.id === sprache}
                onClick={() => {
                  onSprache(s.id);
                }}
              >
                {s.label}
              </Button>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-label text-content mb-2">{t('settings.design')}</legend>
          {DESIGNS.map((design) => (
            <label
              key={design.id}
              className={cx(
                'flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors duration-[80ms]',
                design.id === wert.design
                  ? 'border-action bg-action-surface'
                  : 'border-border-subtle hover:border-border',
              )}
            >
              <input
                type="radio"
                name="design"
                value={design.id}
                checked={design.id === wert.design}
                onChange={() => {
                  onChange({ ...wert, design: design.id });
                }}
                className="mt-1"
              />
              <span>
                <span className="text-heading text-content-strong block">
                  {t(`design.${design.id}.label`)}
                </span>
                <span className="text-meta text-content-muted block">
                  {t(`design.${design.id}.hint`)}
                </span>
              </span>
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend className="text-label text-content mb-2">{t('settings.appearance')}</legend>
          <div className="flex gap-2">
            {MODI.map((modus) => (
              <Button
                key={modus.id}
                variant={modus.id === wert.modus ? 'primary' : 'secondary'}
                aria-pressed={modus.id === wert.modus}
                onClick={() => {
                  onChange({ ...wert, modus: modus.id });
                }}
              >
                {t(`settings.mode.${modus.id}`)}
              </Button>
            ))}
          </div>
        </fieldset>

        <div>
          <p className="text-label text-content">
            {demo ? t('settings.data') : t('settings.backend')}
          </p>
          {demo ? (
            <p className="text-meta text-content-muted mt-1">{t('settings.demoData')}</p>
          ) : (
            <>
              <p className="text-meta text-content-muted mt-1 break-all font-mono">{apiBaseUrl}</p>
              <p className="text-meta text-content-muted mt-1">
                {t('settings.backendHint', { variable: 'VITE_API_BASE_URL' })}
              </p>
            </>
          )}
        </div>
      </div>
    </Dialog>
  );
}
