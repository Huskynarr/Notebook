import { useEffect, useRef, useState, type ReactElement } from 'react';
import type { AskResponse, Citation } from '@notebook/shared';
import { useT } from '../i18n/index.ts';
import { AnswerBody } from './AnswerBody.tsx';
import { ShareMenu, type ShareActions } from './ShareMenu.tsx';
import { Button } from './ui/Button.tsx';
import { InlineNote } from './ui/Status.tsx';
import { cx } from './ui/cx.ts';

export interface Exchange {
  readonly id: string;
  readonly question: string;
  readonly selectedCount: number;
  readonly model?: string;
  readonly response: AskResponse | null;
  readonly error: string | null;
}

export function ChatPanel({
  exchanges,
  pending,
  modelBlocked,
  openRouterChat,
  models,
  selectedModel,
  onModelChange,
  selectedCount,
  activeMarker,
  onAsk,
  onSelectCitation,
  onSaveNote,
  shareActions,
}: {
  exchanges: readonly Exchange[];
  pending: boolean;
  modelBlocked: boolean;
  openRouterChat: boolean;
  models: readonly { id: string; name: string }[];
  selectedModel: string | null;
  onModelChange: (model: string) => void;
  selectedCount: number;
  activeMarker: number | null;
  onAsk: (question: string) => void;
  onSelectCitation: (citation: Citation, citations: readonly Citation[]) => void;
  onSaveNote: (exchange: Exchange) => void;
  /** Liefert die Teilen-Aktionen für eine Antwort; `element` ist die Karte
   *  für Bild und Druck. */
  shareActions: (exchange: Exchange, element: HTMLElement | null) => ShareActions;
}): ReactElement {
  const t = useT();
  const [question, setQuestion] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [exchanges.length, pending]);

  const submit = (text = question): void => {
    const trimmed = text.trim();
    if (trimmed === '' || pending || modelBlocked) return;
    onAsk(trimmed);
    setQuestion('');
  };

  const beispiele = [t('chat.example1'), t('chat.example2'), t('chat.example3')];

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        {exchanges.length === 0 && !pending && (
          <div className="max-w-reading mx-auto flex h-full flex-col justify-center gap-5">
            <div>
              <p className="text-display text-content-strong font-display">
                {t('chat.emptyTitle')}
              </p>
              <p className="text-body text-content-muted mt-2">{t('chat.emptyBody')}</p>
            </div>
            <div>
              <p className="text-label text-content-muted mb-2">{t('chat.tryOne')}</p>
              <div className="flex flex-wrap gap-2">
                {beispiele.map((b) => (
                  <button
                    key={b}
                    type="button"
                    disabled={selectedCount === 0 || modelBlocked}
                    onClick={() => {
                      submit(b);
                    }}
                    className={cx(
                      'text-body text-content border-border bg-surface-raised rounded-sm border px-3 py-1.5 text-left',
                      'hover:border-border-strong hover:bg-surface-inset transition-colors duration-[80ms]',
                      'disabled:text-content-subtle disabled:hover:bg-surface-raised disabled:cursor-not-allowed',
                    )}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {exchanges.map((exchange) => (
          <article key={exchange.id} className="space-y-3">
            <div className="flex justify-end">
              <div className="border-border-subtle bg-surface-raised max-w-[80%] rounded-md border px-4 py-2">
                <p className="text-body text-content">{exchange.question}</p>
                <p className="text-meta text-content-muted mt-1">
                  {t('chat.considered', { count: exchange.selectedCount })}
                  {exchange.model === undefined ? '' : ` · ${exchange.model}`}
                </p>
              </div>
            </div>

            {exchange.error !== null && (
              <InlineNote tone="danger" title={t('chat.errorTitle')}>
                {exchange.error}
              </InlineNote>
            )}

            {exchange.response !== null && (
              <AnswerSection
                exchange={exchange}
                response={exchange.response}
                activeMarker={activeMarker}
                onSelectCitation={(citation) => {
                  onSelectCitation(citation, exchange.response?.citations ?? [citation]);
                }}
                onSaveNote={() => {
                  onSaveNote(exchange);
                }}
                shareActions={shareActions}
              />
            )}
          </article>
        ))}

        {pending && (
          <p className="text-meta text-content-muted flex items-center gap-2">
            <span className="bg-action size-2 animate-pulse rounded-full" aria-hidden="true" />
            {t('chat.searching', {
              count: selectedCount,
              noun: selectedCount === 1 ? t('chat.sourceOne') : t('chat.sourceMany'),
            })}
          </p>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-border-subtle bg-surface no-print border-t px-6 py-3">
        {models.length > 0 && selectedModel !== null && (
          <div className="mb-3 max-w-sm">
            <label htmlFor="chat-model" className="text-label text-content mb-1 block">
              {t('chat.modelLabel')}
            </label>
            <select
              id="chat-model"
              value={selectedModel}
              disabled={pending || modelBlocked}
              onChange={(event) => {
                onModelChange(event.target.value);
              }}
              className={cx(
                'border-border bg-surface-raised text-body text-content w-full rounded-sm border px-3 py-2',
                'hover:border-border-strong focus:border-action disabled:cursor-not-allowed',
              )}
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            <p className="text-meta text-content-muted mt-1">{t('chat.modelHint')}</p>
          </div>
        )}
        {openRouterChat && (
          <p className="text-meta text-warning mb-2" role="status">
            {t('chat.openRouterPrivacy')}
          </p>
        )}
        {modelBlocked && (
          <div className="mb-3">
            <InlineNote tone="warning" title={t('chat.modelBlockedTitle')}>
              {t('chat.modelBlockedBody')}
            </InlineNote>
          </div>
        )}
        {selectedCount === 0 && (
          <div className="mb-3">
            <InlineNote tone="warning" title={t('chat.noSourceTitle')}>
              {t('chat.noSourceBody')}
            </InlineNote>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={Math.min(8, Math.max(1, question.split('\n').length))}
            value={question}
            disabled={modelBlocked}
            aria-label={t('chat.inputLabel')}
            placeholder={t('chat.inputPlaceholder')}
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
              'disabled:bg-surface-inset disabled:cursor-not-allowed',
            )}
          />
          <Button
            variant="primary"
            size="lg"
            loading={pending}
            disabled={modelBlocked}
            onClick={() => {
              submit();
            }}
          >
            {t('chat.send')}
          </Button>
        </div>
        <p className="text-meta text-content-muted mt-1">{t('chat.hint')}</p>
      </div>
    </div>
  );
}

function AnswerSection({
  exchange,
  response,
  activeMarker,
  onSelectCitation,
  onSaveNote,
  shareActions,
}: {
  exchange: Exchange;
  response: AskResponse;
  activeMarker: number | null;
  onSelectCitation: (citation: Citation) => void;
  onSaveNote: () => void;
  shareActions: (exchange: Exchange, element: HTMLElement | null) => ShareActions;
}): ReactElement {
  const t = useT();
  const karte = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={karte}
      className={cx(
        'rounded-md border-l-2 pl-4',
        response.citations.length > 0 ? 'border-accent' : 'border-border-subtle',
      )}
    >
      {response.simulated && (
        <div className="mb-3">
          <InlineNote tone="warning" title={t('chat.simulatedTitle')}>
            {t('chat.simulatedBody')}
          </InlineNote>
        </div>
      )}

      {!response.grounded && !response.simulated && (
        <div className="mb-3">
          <InlineNote tone="warning" title={t('chat.ungroundedTitle')}>
            {t('chat.ungroundedBody')}
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
          {t('chat.dropped', { count: response.droppedMarkers.length })}
        </p>
      )}
      {response.unsupportedSentenceCount > 0 && (
        <p className="text-meta text-warning mt-1">
          {t('chat.unsupported', { count: response.unsupportedSentenceCount })}
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
                {citation.headingPath === '' ? '' : ` · ${citation.headingPath}`} ·{' '}
                {t('citation.range', { start: citation.startOffset, end: citation.endOffset })}
                {citation.precision === 'chunk' && ` (${t('chat.wholeSection')})`}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="no-print mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={onSaveNote}>
          {t('chat.saveNote')}
        </Button>
        <ShareMenu scope="answer" actions={shareActions(exchange, karte.current)} />
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            void navigator.clipboard.writeText(response.answer);
          }}
        >
          {t('common.copy')}
        </Button>
        <span className="text-meta text-content-subtle font-mono">
          {response.model} · {response.elapsedMs} ms
        </span>
      </div>
    </div>
  );
}
