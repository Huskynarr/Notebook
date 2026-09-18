import { useState, type ReactElement } from 'react';
import type { CreateSourceRequest, Source } from '@notebook/shared';
import { useT } from '../i18n/index.ts';
import { Button } from './ui/Button.tsx';
import { Dialog } from './ui/Dialog.tsx';
import { TextAreaField, TextField } from './ui/Field.tsx';
import { Badge, EmptyState } from './ui/Status.tsx';
import { Tabs } from './ui/Tabs.tsx';
import { cx } from './ui/cx.ts';

const KIND_GLYPH: Record<Source['kind'], string> = {
  text: '¶',
  markdown: 'M↓',
  url: '⌁',
  pdf: 'PDF',
};

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
  onAdd: (input: CreateSourceRequest) => Promise<void>;
  onDelete: (source: Source) => void;
}): ReactElement {
  const t = useT();
  const [adding, setAdding] = useState(false);
  const liste = sources ?? [];
  const selectedCount = liste.filter((s) => s.selected).length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div>
          <h2 className="text-heading text-content-strong">{t('sources.title')}</h2>
          <p className="text-meta text-content-muted">
            {loading
              ? t('common.loading')
              : t('sources.selectedOf', { selected: selectedCount, total: liste.length })}
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
          {t('sources.add')}
        </Button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 pb-4">
        {loading ? (
          <p className="text-meta text-content-muted px-1 py-2" aria-live="polite">
            {t('sources.loading')}
          </p>
        ) : liste.length === 0 ? (
          <EmptyState
            title={t('sources.empty.title')}
            action={
              <Button
                size="sm"
                onClick={() => {
                  setAdding(true);
                }}
              >
                {t('sources.add')}
              </Button>
            }
          >
            {t('sources.empty.body')}
          </EmptyState>
        ) : (
          liste.map((source) => {
            const open = source.id === openSourceId;
            const hits = hitCounts.get(source.id) ?? 0;
            return (
              <div
                key={source.id}
                className={cx(
                  'group relative rounded-md border p-3 transition-colors duration-[80ms]',
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
                    aria-label={t('sources.considerForQuestions', { title: source.title })}
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
                          'text-heading line-clamp-2 break-words',
                          source.selected ? 'text-content-strong' : 'text-content-muted',
                        )}
                      >
                        {source.title}
                      </span>
                      <span className="text-meta text-content-muted mt-1 flex flex-wrap items-center gap-x-2">
                        <span
                          className="bg-surface-inset rounded-xs px-1 font-mono"
                          aria-hidden="true"
                        >
                          {KIND_GLYPH[source.kind]}
                        </span>
                        <span>{t(`sources.kind.${source.kind}`)}</span>
                        <span>
                          · {source.wordCount} {t('common.words')}
                        </span>
                        <span>
                          · {source.chunkCount} {t('common.sections')}
                        </span>
                      </span>
                    </button>
                    {source.origin !== null && (
                      <a
                        href={source.origin}
                        target="_blank"
                        rel="noreferrer"
                        className="text-meta text-action mt-1 block truncate underline-offset-2 hover:underline"
                        title={source.origin}
                      >
                        {source.origin.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                    {(!source.selected || hits > 0) && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {!source.selected && (
                          <Badge tone="neutral">{t('sources.deselected')}</Badge>
                        )}
                        {hits > 0 && (
                          <span className="bg-accent-surface-strong text-micro text-accent-contrast rounded-xs px-2 uppercase">
                            {t('sources.hits', { count: hits })}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={t('sources.deleteTitle', { title: source.title })}
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

type Art = 'text' | 'file' | 'url';

function AddSourceDialog({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (input: CreateSourceRequest) => Promise<void>;
}): ReactElement {
  const t = useT();
  const [art, setArt] = useState<Art>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const reset = (): void => {
    setTitle('');
    setContent('');
    setUrl('');
    setError(undefined);
  };
  const schliessen = (): void => {
    reset();
    onClose();
  };

  const submit = async (): Promise<void> => {
    setError(undefined);
    let eingabe: CreateSourceRequest;
    if (art === 'url') {
      if (!/^https?:\/\/\S+\.\S+/i.test(url.trim())) {
        setError(t('addSource.urlError'));
        return;
      }
      eingabe = {
        kind: 'url',
        url: url.trim(),
        ...(title.trim() === '' ? {} : { title: title.trim() }),
      };
    } else {
      if (content.trim() === '') {
        setError(t('addSource.emptyError'));
        return;
      }
      eingabe = {
        kind: title.trim().endsWith('.md') ? 'markdown' : 'text',
        title: title.trim() === '' ? t('common.untitled') : title.trim(),
        content,
      };
    }
    setSaving(true);
    try {
      await onAdd(eingabe);
      schliessen();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('addSource.genericError'));
    } finally {
      setSaving(false);
    }
  };

  const schmutzig = title !== '' || content !== '' || url !== '';

  return (
    <Dialog
      open={open}
      wide
      title={t('addSource.title')}
      description={t('addSource.description')}
      dismissable={!schmutzig}
      onClose={schliessen}
      footer={
        <>
          <Button variant="ghost" onClick={schliessen}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            loading={saving}
            onClick={() => {
              void submit();
            }}
          >
            {saving && art === 'url' ? t('addSource.fetching') : t('addSource.submit')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Tabs<Art>
          label={t('addSource.title')}
          value={art}
          onChange={(neu) => {
            setArt(neu);
            setError(undefined);
          }}
          items={[
            { id: 'text', label: t('addSource.tab.text') },
            { id: 'file', label: t('addSource.tab.file') },
            { id: 'url', label: t('addSource.tab.url') },
          ]}
        />

        <TextField
          label={t('addSource.titleLabel')}
          value={title}
          placeholder={t('addSource.titlePlaceholder')}
          onChange={(event) => {
            setTitle(event.target.value);
          }}
          hint={art === 'url' ? undefined : t('addSource.titleHint')}
        />

        {art === 'url' ? (
          <TextField
            label={t('addSource.urlLabel')}
            type="url"
            inputMode="url"
            value={url}
            error={error}
            placeholder={t('addSource.urlPlaceholder')}
            hint={error === undefined ? t('addSource.urlHint') : undefined}
            onChange={(event) => {
              setUrl(event.target.value);
              setError(undefined);
            }}
          />
        ) : (
          <>
            {art === 'file' && (
              <label className="flex flex-col gap-1">
                <span className="text-label text-content">{t('addSource.fileLabel')}</span>
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
            )}
            <TextAreaField
              label={t('addSource.textLabel')}
              rows={art === 'file' ? 6 : 12}
              value={content}
              error={error}
              placeholder={t('addSource.textPlaceholder')}
              onChange={(event) => {
                setContent(event.target.value);
                setError(undefined);
              }}
              hint={`${content.length} ${t('common.characters')}`}
            />
          </>
        )}
      </div>
    </Dialog>
  );
}
