import { useEffect, useRef, useState, type ReactElement } from 'react';
import type { AskResponse, Citation } from '@notebook/shared';
import { AnswerBody } from './AnswerBody.tsx';
import { Button } from './ui/Button.tsx';
import { InlineNote } from './ui/Status.tsx';
import { cx } from './ui/cx.ts';

export interface Exchange {
  readonly id: string;
  readonly question: string;
  readonly selectedCount: number;
  readonly response: AskResponse | null;
  readonly error: string | null;
}

export function ChatPanel({
  exchanges,
  pending,
  selectedCount,
  activeMarker,
  onAsk,
  onSelectCitation,
  onSaveNote,
}: {
  exchanges: readonly Exchange[];
  pending: boolean;
  selectedCount: number;
  activeMarker: number | null;
  onAsk: (question: string) => void;
  onSelectCitation: (citation: Citation) => void;
  onSaveNote: (exchange: Exchange) => void;
}): ReactElement {
  const [question, setQuestion] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [exchanges.length, pending]);

  const submit = (): void => {
    const trimmed = question.trim();
    if (trimmed === '' || pending) return;
    onAsk(trimmed);
    setQuestion('');
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        {exchanges.length === 0 && !pending && (
          <div className="max-w-reading mx-auto">
            <p className="text-title text-content-strong">Frage stellen</p>
            <p className="text-body text-content-muted mt-2">
              Antworten entstehen ausschließlich aus den links ausgewählten Quellen. Jede Aussage
              trägt einen Beleg, der auf die Stelle im Original zeigt.
            </p>
          </div>
        )}

        {exchanges.map((exchange) => (
          <article key={exchange.id} className="space-y-3">
            <div className="flex justify-end">
              <div className="border-border-subtle bg-surface-raised max-w-[80%] rounded-md border px-4 py-2">
                <p className="text-body text-content">{exchange.question}</p>
                <p className="text-meta text-content-muted mt-1 text-right">
                  {exchange.selectedCount} Quellen berücksichtigt
                </p>
              </div>
            </div>

            {exchange.error !== null && (
              <InlineNote tone="danger" title="Die Frage konnte nicht beantwortet werden">
                {exchange.error}
              </InlineNote>
            )}

            {exchange.response !== null && (
              <AnswerSection
                response={exchange.response}
                activeMarker={activeMarker}
                onSelectCitation={onSelectCitation}
                onSaveNote={() => {
                  onSaveNote(exchange);
                }}
              />
            )}
          </article>
        ))}

        {pending && (
          <p className="text-meta text-content-muted flex items-center gap-2">
            <span className="bg-action size-2 animate-pulse rounded-full" aria-hidden="true" />
            Durchsuche {selectedCount} {selectedCount === 1 ? 'Quelle' : 'Quellen'} …
          </p>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-border-subtle bg-surface border-t px-6 py-3">
        {selectedCount === 0 && (
          <div className="mb-3">
            <InlineNote tone="warning" title="Keine Quelle ausgewählt">
              Wähle links mindestens eine Quelle aus. Ohne Quelle wird nicht geantwortet.
            </InlineNote>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={Math.min(8, Math.max(1, question.split('\n').length))}
            value={question}
            aria-label="Frage an die ausgewählten Quellen"
            placeholder="Frage an die ausgewählten Quellen …"
            onChange={(event) => {
              setQuestion(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
            className={cx(
              'border-border bg-surface-raised max-h-48 min-h-[42px] flex-1 resize-none rounded-sm border px-3 py-2',
              'text-body text-content placeholder:text-content-subtle hover:border-border-strong focus:border-action',
            )}
          />
          <Button variant="primary" size="lg" loading={pending} onClick={submit}>
            Fragen
          </Button>
        </div>
        <p className="text-meta text-content-muted mt-1">
          Enter sendet, Umschalt+Enter erzeugt einen Zeilenumbruch.
        </p>
      </div>
    </div>
  );
}

function AnswerSection({
  response,
  activeMarker,
  onSelectCitation,
  onSaveNote,
}: {
  response: AskResponse;
  activeMarker: number | null;
  onSelectCitation: (citation: Citation) => void;
  onSaveNote: () => void;
}): ReactElement {
  return (
    <div
      className={cx(
        'border-l-2 pl-4',
        response.citations.length > 0 ? 'border-accent' : 'border-border-subtle',
      )}
    >
      {response.simulated && (
        <div className="mb-3">
          <InlineNote tone="warning" title="Simulierte Antwort — kein Modell verbunden">
            Der Server läuft mit LLM_PROVIDER=stub. Es wurde nichts formuliert, sondern nur gezeigt,
            welche Textstellen gefunden wurden.
          </InlineNote>
        </div>
      )}

      {!response.grounded && !response.simulated && (
        <div className="mb-3">
          <InlineNote tone="warning" title="Nicht aus den Quellen belegbar">
            Die ausgewählten Quellen decken diese Frage nicht ab.
          </InlineNote>
        </div>
      )}

      <div aria-live="polite">
        <AnswerBody
          answer={response.answer}
          citations={response.citations}
          activeMarker={activeMarker}
          onSelectCitation={onSelectCitation}
        />
      </div>

      {response.droppedMarkers.length > 0 && (
        <p className="text-meta text-warning mt-3">
          {response.droppedMarkers.length} vom Modell gesetzte Belege zeigten auf keine abgerufene
          Textstelle und wurden entfernt.
        </p>
      )}
      {response.unsupportedSentenceCount > 0 && (
        <p className="text-meta text-warning mt-1">
          {response.unsupportedSentenceCount} Sätze ohne Beleg (gepunktet unterstrichen).
        </p>
      )}

      {response.citations.length > 0 && (
        <ul className="mt-3 space-y-1">
          {response.citations.map((citation) => (
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
                {citation.sourceTitle}
                {citation.headingPath === '' ? '' : ` · ${citation.headingPath}`} · Zeichen{' '}
                {citation.startOffset}–{citation.endOffset}
                {citation.precision === 'chunk' && ' (ganzer Abschnitt)'}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" onClick={onSaveNote}>
          Als Notiz speichern
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            void navigator.clipboard.writeText(response.answer);
          }}
        >
          Kopieren
        </Button>
        <span className="text-meta text-content-subtle font-mono">
          {response.model} · {response.elapsedMs} ms
        </span>
      </div>
    </div>
  );
}
