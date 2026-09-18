import type { AskResponse, Citation, Note, Notebook, Source } from '@notebook/shared';
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import { toPng } from 'html-to-image';
import type { Uebersetzer } from '../i18n/index.ts';

/**
 * Export in vier Formate, alles im Browser:
 *  - Markdown: eigener Text
 *  - Word:     .docx über `docx` (erzeugt echtes OOXML, keine HTML-Kopie)
 *  - Bild:     PNG der Antwortkarte über `html-to-image`
 *  - PDF:      Druckdialog des Browsers mit Druck-Stylesheet (styles/print.css);
 *              "Als PDF speichern" ist in jedem Browser vorhanden, ein eigener
 *              PDF-Erzeuger wäre Infrastruktur ohne Mehrwert (Regel 7).
 *
 * Belege werden in jedem Format als Liste mit Quelle, Abschnitt und
 * Zeichenpositionen mitgegeben - ein Export ohne Belege wäre genau die
 * unbelegte Aussage, die das Produkt vermeiden soll.
 */

export interface AntwortExport {
  readonly question: string;
  readonly response: AskResponse;
}

function datum(): string {
  return new Date().toISOString().slice(0, 10);
}

/* Nur ASCII im Dateinamen: Umlaute werden umschrieben, andere Akzente
 * abgelegt - so kommt der Name in jedem Browser und Dateisystem gleich an. */
function dateiname(basis: string, endung: string): string {
  const sauber = basis
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${sauber === '' ? 'notebook' : sauber}.${endung}`;
}

function herunterladen(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function belegZeile(c: Citation, t: Uebersetzer): string {
  const ort = c.headingPath === '' ? '' : ` · ${c.headingPath}`;
  const genau = c.precision === 'exact' ? '' : ` (${t('chat.wholeSection')})`;
  return `[${c.marker}] ${c.sourceTitle}${ort} · ${t('citation.range', { start: c.startOffset, end: c.endOffset })}${genau}`;
}

/* ------------------------------ Markdown ------------------------------ */

export function antwortAlsMarkdown(a: AntwortExport, t: Uebersetzer): string {
  const zeilen = [
    `## ${t('share.questionHeading')}`,
    '',
    a.question,
    '',
    `## ${t('share.answerHeading')}`,
    '',
    a.response.answer,
    '',
  ];
  if (a.response.citations.length > 0) {
    zeilen.push(`## ${t('share.citationsHeading')}`, '');
    for (const c of a.response.citations) {
      zeilen.push(`- ${belegZeile(c, t)}`, `  > ${c.excerpt.replace(/\n+/g, ' ')}`);
    }
    zeilen.push('');
  }
  zeilen.push(`_${t('share.exportedOn', { date: datum() })}_`);
  return zeilen.join('\n');
}

export function notebookAlsMarkdown(
  notebook: Notebook,
  sources: ReadonlyArray<Source & { content: string }>,
  notes: readonly Note[],
  t: Uebersetzer,
): string {
  const zeilen = [
    `# ${notebook.title}`,
    '',
    `_${t('share.exportedOn', { date: datum() })}_`,
    '',
    `## ${t('notes.title')}`,
    '',
  ];
  if (notes.length === 0) zeilen.push(`_${t('share.noNotes')}_`, '');
  for (const n of notes) {
    zeilen.push(`### ${n.title}`, '');
    if (n.question !== '') zeilen.push(`**${t('share.questionHeading')}:** ${n.question}`, '');
    zeilen.push(n.body, '');
    if (n.citations.length > 0) {
      zeilen.push(`**${t('share.citationsHeading')}:**`, '');
      for (const c of n.citations)
        zeilen.push(`- ${belegZeile(c, t)}`, `  > ${c.excerpt.replace(/\n+/g, ' ')}`);
      zeilen.push('');
    }
  }
  zeilen.push(`## ${t('sources.title')}`, '');
  for (const s of sources) {
    zeilen.push(`### ${s.title}`, '');
    if (s.origin !== null) zeilen.push(`<${s.origin}>`, '');
    zeilen.push(
      `_${s.wordCount} ${t('common.words')} · ${s.chunkCount} ${t('common.sections')}_`,
      '',
      s.content,
      '',
    );
  }
  return zeilen.join('\n');
}

export function markdownSpeichern(markdown: string, basis: string): void {
  herunterladen(
    new Blob([markdown], { type: 'text/markdown;charset=utf-8' }),
    dateiname(basis, 'md'),
  );
}

/* -------------------------------- Word -------------------------------- */

function absaetze(text: string): Paragraph[] {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block !== '')
    .map((block) => {
      const ueberschrift = /^(#{1,6})\s+(.*)$/.exec(block);
      if (ueberschrift) {
        const ebene = Math.min(ueberschrift[1]?.length ?? 1, 3);
        const heading =
          ebene === 1
            ? HeadingLevel.HEADING_1
            : ebene === 2
              ? HeadingLevel.HEADING_2
              : HeadingLevel.HEADING_3;
        return new Paragraph({ text: ueberschrift[2] ?? '', heading });
      }
      const zeilen = block.split('\n');
      return new Paragraph({
        children: zeilen.flatMap((z, i) =>
          i === 0 ? [new TextRun(z)] : [new TextRun({ text: z, break: 1 })],
        ),
      });
    });
}

function belegAbsaetze(citations: readonly Citation[], t: Uebersetzer): Paragraph[] {
  if (citations.length === 0) return [];
  return [
    new Paragraph({ text: t('share.citationsHeading'), heading: HeadingLevel.HEADING_2 }),
    ...citations.flatMap((c) => [
      new Paragraph({ children: [new TextRun({ text: belegZeile(c, t), bold: true })] }),
      new Paragraph({
        children: [new TextRun({ text: c.excerpt.replace(/\n+/g, ' '), italics: true })],
      }),
    ]),
  ];
}

export async function antwortAlsDocx(a: AntwortExport, t: Uebersetzer): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: t('share.questionHeading'), heading: HeadingLevel.HEADING_1 }),
          new Paragraph(a.question),
          new Paragraph({ text: t('share.answerHeading'), heading: HeadingLevel.HEADING_1 }),
          ...absaetze(a.response.answer),
          ...belegAbsaetze(a.response.citations, t),
          new Paragraph({
            children: [
              new TextRun({ text: t('share.exportedOn', { date: datum() }), italics: true }),
            ],
          }),
        ],
      },
    ],
  });
  return Packer.toBlob(doc);
}

export async function notebookAlsDocx(
  notebook: Notebook,
  sources: ReadonlyArray<Source & { content: string }>,
  notes: readonly Note[],
  t: Uebersetzer,
): Promise<Blob> {
  const kinder: Paragraph[] = [
    new Paragraph({ text: notebook.title, heading: HeadingLevel.TITLE }),
    new Paragraph({
      children: [new TextRun({ text: t('share.exportedOn', { date: datum() }), italics: true })],
    }),
    new Paragraph({ text: t('notes.title'), heading: HeadingLevel.HEADING_1 }),
  ];
  if (notes.length === 0)
    kinder.push(
      new Paragraph({ children: [new TextRun({ text: t('share.noNotes'), italics: true })] }),
    );
  for (const n of notes) {
    kinder.push(new Paragraph({ text: n.title, heading: HeadingLevel.HEADING_2 }));
    if (n.question !== '')
      kinder.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${t('share.questionHeading')}: `, bold: true }),
            new TextRun(n.question),
          ],
        }),
      );
    kinder.push(...absaetze(n.body), ...belegAbsaetze(n.citations, t));
  }
  kinder.push(new Paragraph({ text: t('sources.title'), heading: HeadingLevel.HEADING_1 }));
  for (const s of sources) {
    kinder.push(new Paragraph({ text: s.title, heading: HeadingLevel.HEADING_2 }));
    if (s.origin !== null)
      kinder.push(new Paragraph({ children: [new TextRun({ text: s.origin, italics: true })] }));
    kinder.push(...absaetze(s.content));
  }
  return Packer.toBlob(new Document({ sections: [{ children: kinder }] }));
}

export function docxSpeichern(blob: Blob, basis: string): void {
  herunterladen(blob, dateiname(basis, 'docx'));
}

/* -------------------------------- Bild -------------------------------- */

export async function elementAlsPng(element: HTMLElement, basis: string): Promise<void> {
  // Der ganze Austausch (Frage und Antwort), ohne Bedienelemente.
  const ziel = element.closest<HTMLElement>('article') ?? element;
  const hintergrund = getComputedStyle(document.body).backgroundColor;
  const url = await toPng(ziel, {
    pixelRatio: 2,
    backgroundColor: hintergrund,
    cacheBust: true,
    width: ziel.offsetWidth + 48,
    height: ziel.offsetHeight + 48,
    style: { padding: '24px', boxSizing: 'border-box' },
    filter: (knoten) => !(knoten instanceof HTMLElement && knoten.classList.contains('no-print')),
  });
  const blob = await (await fetch(url)).blob();
  herunterladen(blob, dateiname(basis, 'png'));
}

/* -------------------------------- PDF --------------------------------- */

/** Markiert genau ein Element als Druckinhalt und öffnet den Druckdialog.
 *  Das Druck-Stylesheet (styles/print.css) blendet alles Übrige aus. */
export function drucken(element: HTMLElement | null): void {
  const vorher = document.querySelectorAll('[data-print-target]');
  for (const el of vorher) el.removeAttribute('data-print-target');
  if (element !== null) element.setAttribute('data-print-target', '');
  document.body.dataset['printing'] = element === null ? 'all' : 'target';
  const aufraeumen = (): void => {
    delete document.body.dataset['printing'];
    element?.removeAttribute('data-print-target');
    window.removeEventListener('afterprint', aufraeumen);
  };
  window.addEventListener('afterprint', aufraeumen);
  window.print();
}
