import type { CompletionRequest, CompletionResult, LlmProvider } from './provider.ts';

/**
 * Offline-Modus. Erzeugt KEINE inhaltliche Antwort, sondern gibt die
 * abgerufenen Abschnitte unveraendert wieder und sagt ausdruecklich, dass kein
 * Modell verbunden ist.
 *
 * Das ist Absicht: eine plausibel klingende, in Wahrheit erfundene Antwort waere
 * genau die unmarkierte Simulation, die AGENTS.md Regel 5 verbietet. Das Feld
 * `simulated` wird bis ins UI durchgereicht und dort als dauerhaftes Banner
 * angezeigt.
 */
export class StubProvider implements LlmProvider {
  readonly name = 'stub';

  complete(request: CompletionRequest): Promise<CompletionResult> {
    const markers = [...request.user.matchAll(/^\[(\d+)\]$/gm)].slice(0, 3);
    const listed = markers.map(([, number]) => `- Abschnitt [${number ?? '?'}]`).join('\n');

    const texte =
      request.language === 'en'
        ? {
            leer: 'No language model is connected, and no passage for this question was found in the selected sources.',
            intro:
              'No language model is connected. This answer is therefore not written out; it only shows which passages were found for the question:',
            outro:
              'Written answers require a connected AI provider. The passages can already be checked in their original sources.',
          }
        : {
            leer: 'Es ist kein Sprachmodell verbunden, und zu dieser Frage wurde in den ausgewählten Quellen keine Textstelle gefunden.',
            intro:
              'Es ist kein Sprachmodell verbunden. Diese Antwort ist daher nicht formuliert, sondern zeigt nur, welche Textstellen zu der Frage gefunden wurden:',
            outro:
              'Für formulierte Antworten muss ein KI-Anbieter verbunden sein. Die Fundstellen lassen sich bereits im Original prüfen.',
          };
    const answer =
      markers.length === 0
        ? texte.leer
        : `${texte.intro}

${listed}

${texte.outro}`;

    return Promise.resolve({
      answer: { grounded: false, answer, quotes: {} },
      model: 'stub (kein Modell verbunden)',
      simulated: true,
    });
  }
}
