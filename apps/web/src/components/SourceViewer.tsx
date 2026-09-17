import { useEffect, useRef, useState, type ReactElement } from 'react';
import type { Citation, SourceContent } from '@notebook/shared';
import { Button } from './ui/Button.tsx';
import { EmptyState } from './ui/Status.tsx';

/**
 * Quellenansicht mit hervorgehobener Belegstelle (Design-System 8.6, dritte
 * Erscheinungsform).
 *
 * Die Markierung entsteht aus den Zeichen-Offsets des Belegs, nicht aus einer
 * Textsuche. Deshalb trifft sie auch dann, wenn dieselbe Formulierung mehrfach
 * im Dokument vorkommt.
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
  const markRef = useRef<HTMLElement>(null);
  const [flash, setFlash] = useState(0);

  useEffect(() => {
    if (citation === null || markRef.current === null) return;
    markRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setFlash((n) => n + 1);
  }, [citation]);

  if (source === null) {
    return (
      <EmptyState title="Keine Quelle geöffnet">
        Wähle links eine Quelle aus oder klicke in einer Antwort auf einen Beleg, um die
        Originalstelle zu sehen.
      </EmptyState>
    );
  }

  const highlight =
    citation !== null && citation.sourceId === source.id
      ? { start: citation.startOffset, end: citation.endOffset }
      : null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border-subtle px-4 py-2">
        <div className="min-w-0">
          <p className="truncate text-heading text-content-strong">{source.title}</p>
          <p className="text-meta text-content-muted">
            {source.wordCount} Wörter · {source.chunkCount} Abschnitte
          </p>
        </div>
        {citationCount > 1 && (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              aria-label="Vorheriger Beleg"
              onClick={() => {
                onStep(-1);
              }}
            >
              ←
            </Button>
            <span className="font-mono text-meta text-content-muted tabular-nums">
              Beleg {citationIndex + 1} von {citationCount}
            </span>
            <Button
              size="sm"
              variant="ghost"
              aria-label="Nächster Beleg"
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
        <pre className="max-w-reading font-reading text-reading whitespace-pre-wrap text-content">
          {highlight === null ? (
            source.content
          ) : (
            <>
              {source.content.slice(0, highlight.start)}
              <mark
                key={flash}
                ref={markRef}
                className="citation-flash rounded-xs bg-accent-surface text-content-strong underline decoration-accent-border decoration-2 underline-offset-4"
              >
                {source.content.slice(highlight.start, highlight.end)}
              </mark>
              {source.content.slice(highlight.end)}
            </>
          )}
        </pre>
      </div>

      {citation !== null && citation.sourceId === source.id && (
        <p className="border-t border-border-subtle px-4 py-2 font-mono text-meta text-content-muted">
          Zeichen {citation.startOffset}–{citation.endOffset}
          {citation.precision === 'chunk'
            ? ' · ganzer Abschnitt (kein wörtliches Zitat gefunden)'
            : ' · wörtlich belegt'}
        </p>
      )}
    </div>
  );
}
