import { useState, type ReactElement } from 'react';
import type { Citation, Note } from '@notebook/shared';
import { useT } from '../i18n/index.ts';
import { Button } from './ui/Button.tsx';
import { TextAreaField, TextField } from './ui/Field.tsx';
import { EmptyState } from './ui/Status.tsx';

export function NotesPanel({
  notes,
  onSelectCitation,
  onUpdate,
  onDelete,
}: {
  notes: readonly Note[];
  onSelectCitation: (citation: Citation) => void;
  onUpdate: (id: string, patch: { title?: string; body?: string }) => void;
  onDelete: (note: Note) => void;
}): ReactElement {
  const t = useT();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: '', body: '' });

  if (notes.length === 0) {
    return (
      <div className="p-4">
        <EmptyState title={t('notes.empty.title')}>{t('notes.empty.body')}</EmptyState>
      </div>
    );
  }

  return (
    <div className="space-y-3 overflow-y-auto p-4">
      {notes.map((note) => {
        const isEditing = editing === note.id;
        return (
          <article
            key={note.id}
            className="border-border-subtle bg-surface-raised rounded-md border p-4"
          >
            {isEditing ? (
              <div className="flex flex-col gap-3">
                <TextField
                  label={t('notes.fieldTitle')}
                  value={draft.title}
                  onChange={(event) => {
                    setDraft((d) => ({ ...d, title: event.target.value }));
                  }}
                />
                <TextAreaField
                  label={t('notes.fieldBody')}
                  rows={8}
                  value={draft.body}
                  onChange={(event) => {
                    setDraft((d) => ({ ...d, body: event.target.value }));
                  }}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditing(null);
                    }}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      onUpdate(note.id, draft);
                      setEditing(null);
                    }}
                  >
                    {t('common.save')}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-heading text-content-strong">{note.title}</h3>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={t('notes.editTitle')}
                      onClick={() => {
                        setDraft({ title: note.title, body: note.body });
                        setEditing(note.id);
                      }}
                    >
                      {t('common.edit')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={t('notes.deleteTitle')}
                      onClick={() => {
                        onDelete(note);
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
                {note.question !== '' && (
                  <p className="text-meta text-content-muted mt-1">
                    {t('notes.question', { question: note.question })}
                  </p>
                )}
                <p className="max-w-reading font-reading text-reading text-content mt-2 whitespace-pre-wrap">
                  {note.body}
                </p>
                {note.citations.length > 0 && (
                  <ul className="border-border-subtle mt-3 space-y-1 border-t pt-2">
                    {note.citations.map((citation) => (
                      <li key={citation.marker}>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectCitation(citation);
                          }}
                          className="text-meta text-content-muted hover:text-content-strong text-left"
                        >
                          <span className="bg-accent-surface rounded-xs px-1 font-mono">
                            [{citation.marker}]
                          </span>{' '}
                          {citation.sourceTitle} ·{' '}
                          {t('citation.range', {
                            start: citation.startOffset,
                            end: citation.endOffset,
                          })}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </article>
        );
      })}
    </div>
  );
}
