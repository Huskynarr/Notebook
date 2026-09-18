import { useState, type ReactElement } from 'react';
import type { Source } from '@notebook/shared';
import { Button } from './ui/Button.tsx';
import { Dialog } from './ui/Dialog.tsx';
import { TextAreaField, TextField } from './ui/Field.tsx';
import { Badge, EmptyState } from './ui/Status.tsx';
import { cx } from './ui/cx.ts';

export function SourcesPanel({
  sources,
  loading,
  openSourceId,
  hitCounts,
  onToggle,
  onOpen,
  onAdd,
  onDelete,
}: {
  sources: readonly Source[] | null;
  loading: boolean;
  openSourceId: string | null;
  hitCounts: ReadonlyMap<string, number>;
  onToggle: (source: Source, selected: boolean) => void;
  onOpen: (source: Source) => void;
  onAdd: (input: { title: string; kind: 'text' | 'markdown'; content: string }) => Promise<void>;
  onDelete: (source: Source) => void;
}): ReactElement {
  const [adding, setAdding] = useState(false);

  const liste = sources ?? [];
  const selectedCount = liste.filter((s) => s.selected).length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div>
          <h2 className="text-heading text-content-strong">Quellen</h2>
          <p className="text-meta text-content-muted">
            {loading ? 'wird geladen …' : `${selectedCount} von ${liste.length} ausgewählt`}
          </p>
        </div>
        <Button
          size="sm"
          variant="primary"
          disabled={loading}
          onClick={() => {
            setAdding(true);
          }}
        >
          Hinzufügen
        </Button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 pb-4">
        {loading ? (
          <p className="text-meta text-content-muted px-1 py-2" aria-live="polite">
            Quellen werden geladen …
          </p>
        ) : liste.length === 0 ? (
          <EmptyState title="Noch keine Quelle">
            Text einfügen oder eine .txt- bzw. .md-Datei wählen. Ohne Quelle beantwortet dieses
            Notebook keine Frage.
          </EmptyState>
        ) : (
          liste.map((source) => {
            const open = source.id === openSourceId;
            const hits = hitCounts.get(source.id) ?? 0;
            return (
              <div
                key={source.id}
                className={cx(
                  'group relative rounded-md border p-4 transition-colors duration-[80ms]',
                  open
                    ? 'border-accent-border bg-accent-surface/40'
                    : 'border-border-subtle bg-surface-raised hover:border-border hover:shadow-sm',
                  !source.selected && 'opacity-60',
                )}
              >
                {open && (
                  <span
                    aria-hidden="true"
                    className="bg-accent absolute inset-y-0 left-0 w-[3px] rounded-l-md"
                  />
                )}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={source.selected}
                    onChange={(event) => {
                      onToggle(source, event.target.checked);
                    }}
                    aria-label={`${source.title} für Fragen berücksichtigen`}
                    className="mt-1 size-4 accent-[var(--t-action)]"
                  />
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => {
                        onOpen(source);
                      }}
                      className="block w-full text-left"
                    >
                      <span
                        className={cx(
                          'text-heading line-clamp-2',
                          source.selected ? 'text-content-strong' : 'text-content-muted',
                        )}
                      >
                        {source.title}
                      </span>
                      <span className="text-meta text-content-muted mt-1 block">
                        {source.kind} · {source.wordCount} Wörter · {source.chunkCount} Abschnitte
                      </span>
                    </button>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {/* Ausgewaehlt ist der Normalfall und braucht keine
                          Plakette. Nur die Abweichung wird ausgezeichnet. */}
                      {!source.selected && <Badge tone="neutral">Abgewählt</Badge>}
                      {hits > 0 && (
                        <span className="bg-accent-surface-strong text-micro text-accent-contrast rounded-xs px-2 uppercase">
                          {hits} Treffer
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`${source.title} löschen`}
                    className="opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                    onClick={() => {
                      onDelete(source);
                    }}
                  >
                    ✕
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <AddSourceDialog
        open={adding}
        onClose={() => {
          setAdding(false);
        }}
        onAdd={onAdd}
      />
    </div>
  );
}

function AddSourceDialog({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (input: { title: string; kind: 'text' | 'markdown'; content: string }) => Promise<void>;
}): ReactElement {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const reset = (): void => {
    setTitle('');
    setContent('');
    setError(undefined);
  };

  const submit = async (): Promise<void> => {
    if (content.trim() === '') {
      setError('Ohne Text lässt sich keine Quelle anlegen.');
      return;
    }
    setSaving(true);
    try {
      await onAdd({
        title: title.trim() === '' ? 'Ohne Titel' : title.trim(),
        kind: title.trim().endsWith('.md') ? 'markdown' : 'text',
        content,
      });
      reset();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Die Quelle konnte nicht angelegt werden.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      wide
      title="Quelle hinzufügen"
      description="Text einfügen oder eine Datei wählen. Der Originaltext wird unverändert gespeichert — alle Belege verweisen später auf Zeichenpositionen in genau diesem Text."
      dismissable={title === '' && content === ''}
      onClose={() => {
        reset();
        onClose();
      }}
      footer={
        <>
          <Button
            variant="ghost"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Abbrechen
          </Button>
          <Button
            variant="primary"
            loading={saving}
            onClick={() => {
              void submit();
            }}
          >
            Quelle anlegen
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <TextField
          label="Titel"
          value={title}
          placeholder="z. B. prüfungsordnung.md"
          onChange={(event) => {
            setTitle(event.target.value);
          }}
          hint="Endet der Titel auf .md, wird der Text als Markdown zerlegt."
        />
        <label className="flex flex-col gap-1">
          <span className="text-label text-content">Datei wählen (.txt oder .md)</span>
          <input
            type="file"
            accept=".txt,.md,text/plain,text/markdown"
            className="text-body text-content-muted file:border-border file:bg-surface-raised file:text-label file:text-content file:mr-3 file:rounded-sm file:border file:px-3 file:py-1.5"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file === undefined) return;
              void file.text().then((text) => {
                setContent(text);
                if (title === '') setTitle(file.name);
              });
            }}
          />
        </label>
        <TextAreaField
          label="Text"
          rows={12}
          value={content}
          error={error}
          placeholder="Text hier einfügen …"
          onChange={(event) => {
            setContent(event.target.value);
            setError(undefined);
          }}
          hint={`${content.length} Zeichen`}
        />
      </div>
    </Dialog>
  );
}
