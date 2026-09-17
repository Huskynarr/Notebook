import { Fragment, type ReactElement } from 'react';
import type { Citation } from '@notebook/shared';
import { segmentAnswer } from '../lib/answer.ts';
import { CitationMarker } from './CitationMarker.tsx';
import { cx } from './ui/cx.ts';

/** Antworttext mit Belegmarkern. Saetze ohne Beleg werden gepunktet
 *  unterstrichen (Design-System 8.5) - sie bleiben lesbar, sind aber als
 *  ungedeckt erkennbar. */
export function AnswerBody({
  answer,
  citations,
  activeMarker,
  onSelectCitation,
}: {
  answer: string;
  citations: readonly Citation[];
  activeMarker: number | null;
  onSelectCitation: (citation: Citation) => void;
}): ReactElement {
  return (
    <div className="prose-reading max-w-reading font-reading text-reading text-content-strong">
      {segmentAnswer(answer).map((paragraph, pIndex) => (
        <p key={pIndex} className={cx('mb-4 last:mb-0', paragraph.heading && 'font-semibold')}>
          {paragraph.sentences.map((sentence, sIndex) => (
            <Fragment key={sIndex}>
              <span
                className={cx(
                  sentence.checkable &&
                    !sentence.supported &&
                    'decoration-warning underline decoration-dotted decoration-2 underline-offset-4',
                )}
                title={
                  sentence.checkable && !sentence.supported
                    ? 'Dieser Satz trägt keinen Beleg aus den Quellen.'
                    : undefined
                }
              >
                {sentence.parts.map((part, index) =>
                  part.kind === 'text' ? (
                    <Fragment key={index}>{part.text}</Fragment>
                  ) : (
                    <CitationMarker
                      key={index}
                      markers={part.markers}
                      citations={citations}
                      activeMarker={activeMarker}
                      onSelect={onSelectCitation}
                    />
                  ),
                )}
              </span>{' '}
            </Fragment>
          ))}
        </p>
      ))}
    </div>
  );
}
