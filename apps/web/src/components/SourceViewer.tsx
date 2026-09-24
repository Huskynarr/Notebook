import { useEffect, useRef, useState, type ReactElement } from 'react';
import type { Citation, SourceContent } from '@notebook/shared';
import { useT } from '../i18n/index.ts';
import { Button } from './ui/Button.tsx';
import { EmptyState } from './ui/Status.tsx';

/**
 * Quellenansicht mit hervorgehobener Belegstelle (Design-System 8.6).
 * Die Markierung entsteht aus den Zeichen-Offsets des Belegs, nicht aus einer
 * Textsuche - sie trifft auch dann, wenn dieselbe Formulierung mehrfach im
 * Dokument vorkommt.
 */
export function SourceViewer({
  source,
  citation,
  citationIndex,
  citationCount,
  onStep,
}: {
  source: SourceContent | null;
  citation: Citation | null;
  citationIndex: number;
  citationCount: number;
  onStep: (delta: number) => void;
}): ReactElement {
  const t = useT();
  const markRef = useRef<HTMLElement>(null);
  const [flash, setFlash] = useState(0);

  // Haengt auch an `source`: der Beleg steht oft fest, bevor der Quelltext
  // geladen ist - erst dann gibt es die Markierung, zu der gerollt wird.
  useEffect(() => {
    if (citation === null || markRef.current === null) return;
    markRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setFlash((n) => n + 1);
  }, [citation, source]);

  if (source === null) {
    return (
      <div className="p-4">
        <EmptyState title={t('viewer.emptyTitle')}>{t('viewer.emptyBody')}</EmptyState>
      </div>
    );
  }

  const highlight =
    citation !== null && citation.sourceId === source.id
      ? { start: citation.startOffset, end: citation.endOffset }
      : null;

  return (
    <div className="flex h-full flex-col">
      <div className="border-border-subtle flex items-center justify-between gap-2 border-b px-4 py-2">
        <div className="min-w-0">
          <p className="text-heading text-content-strong truncate" title={source.title}>
            {source.title}
          </p>
          <p className="text-meta text-content-muted">
            {source.wordCount} {t('common.words')} · {source.chunkCount} {t('common.sections')}
            {source.origin !== null && (
              <>
                {' · '}
                <a
                  href={source.origin}
                  target="_blank"
                  rel="noreferrer"
                  className="text-action underline-offset-2 hover:underline"
                >
                  {new URL(source.origin).hostname}
                </a>
              </>
            )}
          </p>
        </div>
        {citationCount > 1 && (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              aria-label={t('citation.prev')}
              disabled={citationIndex === 0}
              onClick={() => {
                onStep(-1);
              }}
            >
              ←
            </Button>
            <span className="text-meta text-content-muted font-mono tabular-nums">
              {t('citation.step', { index: citationIndex + 1, total: citationCount })}
            </span>
            <Button
              size="sm"
              variant="ghost"
              aria-label={t('citation.next')}
              disabled={citationIndex >= citationCount - 1}
              onClick={() => {
                onStep(1);
              }}
            >
              →
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <pre className="max-w-reading font-reading text-reading text-content whitespace-pre-wrap">
          {highlight === null ? (
            source.content
          ) : (
            <>
              {source.content.slice(0, highlight.start)}
              <mark
                key={flash}
                ref={markRef}
                className="citation-flash bg-accent-surface text-content-strong decoration-accent-border rounded-xs underline decoration-2 underline-offset-4"
              >
                {source.content.slice(highlight.start, highlight.end)}
              </mark>
              {source.content.slice(highlight.end)}
            </>
          )}
        </pre>
      </div>

      {citation !== null && citation.sourceId === source.id && (
        <p className="border-border-subtle text-meta text-content-muted border-t px-4 py-2 font-mono">
          {t('citation.range', { start: citation.startOffset, end: citation.endOffset })} ·{' '}
          {citation.precision === 'chunk' ? t('citation.chunk') : t('citation.exact')}
        </p>
      )}
    </div>
  );
}
