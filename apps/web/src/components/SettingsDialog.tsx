import type { ReactElement } from 'react';
import { DESIGNS, MODI, type Erscheinungsbild } from '../lib/appearance.ts';
import { Button } from './ui/Button.tsx';
import { Dialog } from './ui/Dialog.tsx';
import { InlineNote } from './ui/Status.tsx';
import { cx } from './ui/cx.ts';

/**
 * Einstellungen. Jede Aenderung wirkt sofort - der Dialog ist damit zugleich
 * die Vorschau, und es braucht keinen Speichern-Knopf, dessen Wirkung man
 * erst nach dem Schliessen sieht.
 */
export function SettingsDialog({
  open,
  wert,
  apiBaseUrl,
  vorschau,
  onChange,
  onClose,
}: {
  open: boolean;
  wert: Erscheinungsbild;
  apiBaseUrl: string;
  vorschau: boolean;
  onChange: (wert: Erscheinungsbild) => void;
  onClose: () => void;
}): ReactElement {
  return (
    <Dialog
      open={open}
      title="Einstellungen"
      description="Änderungen wirken sofort und bleiben auf diesem Gerät gespeichert."
      onClose={onClose}
      footer={
        <Button variant="primary" onClick={onClose}>
          Fertig
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-2">
          <legend className="text-label text-content mb-2">Design</legend>
          {DESIGNS.map((design) => (
            <label
              key={design.id}
              className={cx(
                'flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors duration-[80ms]',
                design.id === wert.design
                  ? 'border-border-strong bg-surface-inset'
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
                <span className="text-heading text-content-strong block">{design.label}</span>
                <span className="text-meta text-content-muted block">{design.hinweis}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend className="text-label text-content mb-2">Erscheinungsbild</legend>
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
                {modus.label}
              </Button>
            ))}
          </div>
        </fieldset>

        {vorschau ? (
          <InlineNote tone="warning" title="Vorschau ohne Backend">
            Diese Ausgabe läuft ohne Server. Alle Inhalte sind Beispieldaten im Browser, und es
            werden keine KI-Antworten erzeugt.
          </InlineNote>
        ) : (
          <div>
            <p className="text-label text-content">Backend</p>
            <p className="text-meta text-content-muted break-all font-mono">{apiBaseUrl}</p>
            <p className="text-meta text-content-muted mt-1">
              Wird beim Bauen über <span className="font-mono">VITE_API_BASE_URL</span> gesetzt.
            </p>
          </div>
        )}
      </div>
    </Dialog>
  );
}
