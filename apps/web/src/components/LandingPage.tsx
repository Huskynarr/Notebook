import { useState, type ReactElement } from 'react';
import { useSprache, useT } from '../i18n/index.ts';
import { Button } from './ui/Button.tsx';

const COPY = {
  de: {
    eyebrow: 'DER ARBEITSRAUM FÜR QUELLENBASIERTES WISSEN',
    title: 'Gute Antworten.',
    emphasis: 'Prüfbare Belege.',
    intro:
      'Unterlagen verstehen, Zusammenhänge finden und jede Antwort am Original prüfen. Ein Notebook für konzentriertes Arbeiten in Studium, Forschung und Lehre.',
    start: 'Arbeitsbereich öffnen',
    workflow: 'So funktioniert’s',
    format: 'Text & Markdown',
    limit: 'Bis 10 MiB je Quelle',
    export: 'Notizen exportieren',
    preview: 'DIE VERBINDUNG ZUM ORIGINAL',
    illustration: 'Illustration · fiktives Beispiel, keine KI-Antwort',
    question: 'Welche Quellen fließen in die Antwort ein?',
    answer:
      'Die Auswahl im Notebook bestimmt, welche Quellen für eine Frage berücksichtigt werden.',
    citation: 'Beleg 1 öffnen',
    original: 'Originalquelle · Produktnotiz.md',
    quote:
      'Für eine Frage werden ausschließlich die ausgewählten Quellen des geöffneten Notebooks abgerufen.',
    quoteHint: 'Beleg öffnen. Textstelle lesen. Aussage einordnen.',
    selected: '2 Quellen ausgewählt',
    saved: 'Als Notiz festhalten',
    sectionLabel: 'VON DER QUELLE ZUR ERKENNTNIS',
    sectionTitle: 'Der Gedankengang bleibt prüfbar.',
    steps: [
      [
        '01',
        'Wissen zusammentragen',
        'Notebook öffnen, eigene Texte oder Markdown-Dateien hinzufügen und die relevanten Quellen auswählen.',
      ],
      [
        '02',
        'Gezielt Fragen stellen',
        'Fragen an die ausgewählten Unterlagen richten. Der KI-Workflow ruft passende Textabschnitte als Kontext ab.',
      ],
      [
        '03',
        'Belege prüfen & festhalten',
        'Verweise führen zur markierten Stelle im Original. Ergebnisse lassen sich als Notiz speichern und exportieren.',
      ],
    ],
    focusLabel: 'FÜR DEN UNIVERSITÄREN ALLTAG',
    focusTitle: 'Mehr Überblick.\nDer Kontext bleibt erhalten.',
    focusBody:
      'Seminarunterlagen, Projektdokumentation oder Forschungsnotizen: getrennte Notebooks schaffen klare Quellenräume. Modellantworten bleiben überprüfbare Arbeitshilfen – die fachliche Bewertung gehört weiterhin dazu.',
    check1: 'Originaltext und hervorgehobene Belegstelle nebeneinander',
    check2: 'Quellenwahl vor jeder Frage sichtbar',
    check3: 'Ein Beispiel-Notebook für den ersten Einstieg',
    modelLabel: 'TRANSPARENTER BETRIEB',
    modelTitle: 'Das Modell ist austauschbar. Die Quelle bleibt.',
    modelBody:
      'Mit verbundenem KI-Anbieter entstehen echte Modellantworten. Ohne Modell ist jede simulierte Antwort sichtbar gekennzeichnet. Ausgewählte Textausschnitte werden bei einem KI-Aufruf an den konfigurierten Anbieter übermittelt.',
    privacyNotice:
      'Bei Nutzung von MiMo-V2.6-Flash Free gehen Frage und relevante Textausschnitte an OpenCode (USA). Während der kostenlosen Phase können diese Daten zur Verbesserung des Modells verwendet werden. Für diese Demo nur nicht vertrauliche Beispieldaten verwenden.',
    footer: 'Eigenständiges Hochschulprojekt · keine Verbindung zu Google NotebookLM',
    demo: 'Browser-Demo: ohne Zugangsschutz, ohne KI-Modell. Nur Beispieldaten verwenden.',
    theme: 'Design & Sprache',
  },
  en: {
    eyebrow: 'A WORKSPACE FOR SOURCE-BASED KNOWLEDGE',
    title: 'Good answers.',
    emphasis: 'Traceable sources.',
    intro:
      'Understand documents, connect ideas and check each answer against the original. A notebook for focused work in learning, research and teaching.',
    start: 'Open workspace',
    workflow: 'How it works',
    format: 'Text & Markdown',
    limit: 'Up to 10 MiB per source',
    export: 'Export notes',
    preview: 'CONNECTED TO THE ORIGINAL',
    illustration: 'Illustration · fictional example, no AI answer',
    question: 'Which sources contribute to an answer?',
    answer: 'The selection in the notebook determines which sources are considered for a question.',
    citation: 'Open citation 1',
    original: 'Original source · Product note.md',
    quote: 'For a question, only the selected sources in the open notebook are retrieved.',
    quoteHint: 'Open the citation. Read the passage. Assess the claim.',
    selected: '2 sources selected',
    saved: 'Keep as a note',
    sectionLabel: 'FROM SOURCE TO INSIGHT',
    sectionTitle: 'Keep the reasoning verifiable.',
    steps: [
      [
        '01',
        'Bring knowledge together',
        'Open a notebook, add text or Markdown documents, and select the relevant sources.',
      ],
      [
        '02',
        'Ask focused questions',
        'Ask about the selected documents. The AI workflow retrieves matching passages as context.',
      ],
      [
        '03',
        'Check evidence & keep notes',
        'References lead to highlighted passages in the original. Save results as notes and export them.',
      ],
    ],
    focusLabel: 'FOR UNIVERSITY WORK',
    focusTitle: 'More clarity.\nKeep the context.',
    focusBody:
      'Course documents, project documentation or research notes: separate notebooks define clear source collections. Model answers remain verifiable working aids and still require expert judgement.',
    check1: 'Original text and highlighted evidence side by side',
    check2: 'Visible source selection before each question',
    check3: 'An example notebook ready to explore',
    modelLabel: 'TRANSPARENT OPERATION',
    modelTitle: 'Change the model. Keep the source.',
    modelBody:
      'A connected AI provider generates real model responses. Without a model, every simulated answer is visibly labelled. When calling an AI model, selected text passages are sent to the configured provider.',
    privacyNotice:
      'When using MiMo-V2.6-Flash Free, your question and relevant passages go to OpenCode (US). During its free period, this data may be used to improve the model. For this demo, use non-confidential sample data only.',
    footer: 'Independent university project · not affiliated with Google NotebookLM',
    demo: 'Browser demo: no access protection, no AI model. Use sample data only.',
    theme: 'Design & language',
  },
} as const;

export function NotebookMark(): ReactElement {
  return (
    <svg viewBox="0 0 32 32" fill="none" className="size-8" aria-hidden="true">
      <rect x="4" y="3" width="22" height="26" rx="5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M10 3v26M15 10h6M15 15h6M15 20h3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="m23 22 3 3 5-6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LandingPage({
  demo,
  onLogin,
  onOpenSettings,
}: {
  demo: boolean;
  onLogin: () => void;
  onOpenSettings: () => void;
}): ReactElement {
  const t = useT();
  const copy = COPY[useSprache()];
  const [showOriginal, setShowOriginal] = useState(true);
  return (
    <div className="bg-surface-sunken text-content min-h-screen">
      <header className="max-w-page mx-auto flex items-center justify-between gap-4 px-5 py-6 sm:px-8">
        <a
          href="#"
          className="text-content-strong flex items-center gap-3 font-semibold tracking-tight"
          aria-label="Notebook"
        >
          <span className="text-action">
            <NotebookMark />
          </span>
          <span className="text-xl">
            notebook<span className="text-action">.</span>
          </span>
          <span className="border-border text-content-muted hidden rounded-full border px-2 py-1 text-[10px] font-medium tracking-widest sm:block">
            RESEARCH
          </span>
        </a>
        <nav className="flex items-center gap-2 sm:gap-6" aria-label={copy.workflow}>
          <a
            href="#ablauf"
            className="text-content-muted hover:text-content hidden text-sm md:block"
          >
            {copy.workflow}
          </a>
          <div className="hidden sm:block">
            <Button variant="ghost" onClick={onOpenSettings}>
              {copy.theme}
            </Button>
          </div>
          <Button variant="primary" onClick={onLogin} className="rounded-full! px-5">
            {t('login.submit')} <span aria-hidden="true">↗</span>
          </Button>
        </nav>
      </header>

      <main>
        {demo && (
          <p
            className="bg-warning-surface text-warning mx-5 rounded-md p-3 text-sm sm:mx-8"
            role="status"
          >
            {copy.demo}
          </p>
        )}
        <section className="max-w-page mx-auto grid items-center gap-12 px-5 pb-20 pt-12 sm:px-8 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-28">
          <div className="min-w-0">
            <p className="text-action mb-6 flex items-center gap-2 text-[10px] font-medium tracking-[0.16em] sm:text-xs">
              <span className="bg-action size-1.5 rounded-full" aria-hidden="true" />
              {copy.eyebrow}
            </p>
            <h1 className="text-hero text-content-strong font-display">
              {copy.title}
              <br />
              <span className="text-action">{copy.emphasis}</span>
            </h1>
            <p className="text-content-muted mt-7 max-w-xl text-base leading-relaxed sm:text-lg">
              {copy.intro}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <Button variant="primary" size="lg" onClick={onLogin} className="rounded-full! px-6">
                {copy.start}
                <span aria-hidden="true">↗</span>
              </Button>
              <a href="#ablauf" className="text-content text-sm underline-offset-4 hover:underline">
                {copy.workflow} <span aria-hidden="true">↓</span>
              </a>
            </div>
            <div className="text-content-muted mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs">
              {[copy.format, copy.limit, copy.export].map((item) => (
                <span key={item}>
                  <span className="text-action mr-1.5" aria-hidden="true">
                    ✓
                  </span>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative min-w-0">
            <div
              className="bg-action pointer-events-none absolute inset-12 rounded-full opacity-[0.07] blur-3xl"
              aria-hidden="true"
            />
            <div className="bg-surface border-border relative overflow-hidden rounded-lg border shadow-lg">
              <div className="border-border-subtle flex items-center justify-between gap-3 border-b px-5 py-4">
                <span className="text-content-muted text-[10px] font-medium tracking-[0.12em]">
                  {copy.preview}
                </span>
                <span className="flex gap-1.5" aria-hidden="true">
                  <span className="bg-border-strong size-1.5 rounded-full" />
                  <span className="bg-border size-1.5 rounded-full" />
                  <span className="bg-border size-1.5 rounded-full" />
                </span>
              </div>
              <div className="space-y-5 p-5 sm:p-6">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-action" aria-hidden="true">
                    ▤
                  </span>
                  <span className="text-content-muted">{copy.selected}</span>
                </div>
                <div className="bg-surface-inset border-border-subtle rounded-md border px-4 py-3 text-sm">
                  {copy.question}
                </div>
                <div className="flex gap-3">
                  <span
                    className="bg-action-surface text-action flex size-7 shrink-0 items-center justify-center rounded-sm"
                    aria-hidden="true"
                  >
                    ✳
                  </span>
                  <p className="text-sm leading-7">
                    {copy.answer}{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setShowOriginal(!showOriginal);
                      }}
                      aria-expanded={showOriginal}
                      aria-controls="landing-original"
                      aria-label={copy.citation}
                      className="bg-accent-surface text-accent hover:bg-accent-surface-strong rounded-xs inline-flex size-6 items-center justify-center text-xs font-semibold"
                    >
                      1
                    </button>
                  </p>
                </div>
                {showOriginal && (
                  <div
                    id="landing-original"
                    className="border-accent-border bg-accent-surface/40 rounded-md border p-4"
                  >
                    <div className="text-accent mb-3 flex items-center justify-between text-xs">
                      <span>{copy.original}</span>
                      <span aria-hidden="true">↗</span>
                    </div>
                    <blockquote className="text-content text-sm leading-7">
                      <mark className="bg-accent-surface-strong text-content rounded-xs box-decoration-clone px-1">
                        {copy.quote}
                      </mark>
                    </blockquote>
                    <p className="text-content-muted mt-3 text-xs">{copy.quoteHint}</p>
                  </div>
                )}
                <div className="border-border-subtle text-content-muted border-t pt-4 text-xs">
                  <span aria-hidden="true">↳ </span>
                  {copy.saved}
                </div>
              </div>
            </div>
            <p className="text-content-subtle mt-4 text-center text-[10px]">{copy.illustration}</p>
          </div>
        </section>

        <section id="ablauf" className="border-border-subtle border-y">
          <div className="max-w-page mx-auto px-5 py-16 sm:px-8">
            <p className="text-action text-[10px] tracking-[0.16em]">{copy.sectionLabel}</p>
            <h2 className="text-section text-content-strong mt-4 font-semibold">
              {copy.sectionTitle}
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {copy.steps.map(([number, title, body]) => (
                <article key={number} className="border-border border-t pt-6">
                  <span className="text-action font-mono text-xs">{number} /</span>
                  <h3 className="text-content-strong mt-5 text-lg font-medium">{title}</h3>
                  <p className="text-content-muted mt-3 text-sm leading-6">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-page mx-auto grid gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:gap-24">
          <div>
            <p className="text-action text-[10px] tracking-[0.16em]">{copy.focusLabel}</p>
            <h2 className="text-section text-content-strong mt-4 whitespace-pre-line font-semibold">
              {copy.focusTitle}
            </h2>
            <p className="text-content-muted mt-6 text-sm leading-7">{copy.focusBody}</p>
            <ul className="mt-6 space-y-4 text-sm">
              {[copy.check1, copy.check2, copy.check3].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-action" aria-hidden="true">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <aside className="bg-surface border-border-subtle rounded-lg border p-7 sm:p-9">
            <p className="text-action text-[10px] tracking-[0.16em]">{copy.modelLabel}</p>
            <h2 className="text-content-strong mt-5 text-2xl font-medium leading-tight">
              {copy.modelTitle}
            </h2>
            <p className="text-content-muted mt-5 text-sm leading-7">{copy.modelBody}</p>
            <p className="bg-warning-surface text-warning mt-5 rounded-md p-4 text-sm leading-6">
              {copy.privacyNotice}
            </p>
            <Button variant="secondary" className="rounded-full! mt-7" onClick={onLogin}>
              {copy.start}
              <span aria-hidden="true">↗</span>
            </Button>
          </aside>
        </section>
      </main>
      <footer className="border-border-subtle border-t">
        <div className="max-w-page text-content-muted mx-auto flex flex-wrap items-center justify-between gap-5 px-5 py-7 pb-44 text-xs sm:px-8">
          <p>{copy.footer}</p>
          <Button size="sm" variant="ghost" onClick={onOpenSettings}>
            {copy.theme}
          </Button>
        </div>
      </footer>
    </div>
  );
}
