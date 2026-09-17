import { useState, type ReactElement } from 'react';
import type { Citation, Note } from '@notebook/shared';
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
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: '', body: '' });

  if (notes.length === 0) {
    return (
      <div className="p-4">
        <EmptyState title="Noch keine Notiz">
          Speichere eine Antwort als Notiz. Die Belege werden dabei eingefroren und bleiben
          prüfbar, auch wenn der Chat weiterläuft.
        </EmptyState>
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
            className="rounded-md border border-border-subtle bg-surface-raised p-4"
          >
            {isEditing ? (
              <div className="flex flex-col gap-3">
                <TextField
                  label="Titel"
                  value={draft.title}
                  onChange={(event) => {
                    setDraft((d) => ({ ...d, title: event.target.value }));
                  }}
                />
                <TextAreaField
                  label="Text"
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
                    Abbrechen
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      onUpdate(note.id, draft);
                      setEditing(null);
                    }}
                  >
                    Speichern
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
                      aria-label="Notiz bearbeiten"
                      onClick={() => {
                        setDraft({ title: note.title, body: note.body });
                        setEditing(note.id);
                      }}
                    >
                      Bearbeiten
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="Notiz löschen"
                      onClick={() => {
                        onDelete(note);
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
                {note.question !== '' && (
                  <p className="mt-1 text-meta text-content-muted">Frage: {note.question}</p>
                )}
                <p className="mt-2 max-w-reading font-reading text-reading whitespace-pre-wrap text-content">
                  {note.body}
                </p>
                {note.citations.length > 0 && (
                  <ul className="mt-3 space-y-1 border-t border-border-subtle pt-2">
                    {note.citations.map((citation) => (
                      <li key={citation.marker}>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectCitation(citation);
                          }}
                          className="text-left text-meta text-content-muted hover:text-accent"
                        >
                          <span className="font-mono text-accent">[{citation.marker}]</span>{' '}
                          {citation.sourceTitle} · Zeichen {citation.startOffset}–
                          {citation.endOffset}
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
