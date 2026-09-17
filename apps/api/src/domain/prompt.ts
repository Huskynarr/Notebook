import type { RetrievedChunk } from '@notebook/shared';

/** Die Nummer vor jedem Abschnitt ist zugleich der Marker, den das Modell setzen
 *  soll. Dadurch ist die Zuordnung Marker -> Abschnitt eindeutig und
 *  serverseitig pruefbar (siehe domain/citations.ts). */
export function buildContext(chunks: readonly RetrievedChunk[]): string {
  return chunks
    .map((chunk, index) => {
      const heading = chunk.headingPath === '' ? '' : ` · ${chunk.headingPath}`;
      return `[${index + 1}] ${chunk.sourceTitle}${heading}\n${chunk.text}`;
    })
    .join('\n\n---\n\n');
}

export const SYSTEM_PROMPT = `Du beantwortest Fragen ausschliesslich aus den vorgelegten Textabschnitten.

Regeln, ohne Ausnahme:
1. Verwende ausschliesslich Informationen aus den nummerierten Abschnitten. Nutze kein
   eigenes Wissen, auch wenn du die Antwort zu kennen glaubst.
2. Jede inhaltliche Aussage traegt am Satzende einen Marker mit der Nummer des Abschnitts,
   auf den sie sich stuetzt: [1] oder [2,5] bei mehreren.
3. Erfinde keine Nummern. Erlaubt sind nur die Nummern, die dir vorgelegt wurden.
4. Tragen die Abschnitte die Frage nicht, setze "grounded": false und schreibe in "answer"
   einen Satz darueber, was fehlt. Rate nicht und fuelle nicht mit Allgemeinwissen auf.
5. Antworte auf Deutsch, sachlich und ohne Einleitungsfloskeln.

Antworte ausschliesslich mit einem JSON-Objekt in genau dieser Form:
{
  "grounded": true oder false,
  "answer": "Antworttext mit Markern wie [1].",
  "quotes": { "1": "woertliches Zitat aus Abschnitt 1, das die Aussage traegt" }
}

Zu "quotes": Fuer jeden verwendeten Marker ein woertliches, unveraendertes Zitat aus dem
zugehoerigen Abschnitt - so kurz wie moeglich, aber lang genug, um die Aussage zu tragen
(mindestens acht Zeichen). Schreibe nicht um, kuerze nicht mit Auslassungspunkten.`;

export function buildUserPrompt(question: string, context: string): string {
  return `Abschnitte:\n\n${context}\n\n---\n\nFrage: ${question}`;
}

export const NO_SOURCES_ANSWER =
  'Es ist keine Quelle ausgewaehlt. Waehle links mindestens eine Quelle aus, damit die Frage aus den Quellen beantwortet werden kann.';

export const NO_MATCH_ANSWER =
  'In den ausgewaehlten Quellen findet sich zu dieser Frage keine Textstelle. Moeglich ist, dass die Quellen das Thema nicht behandeln oder die Frage andere Begriffe verwendet als die Texte.';
