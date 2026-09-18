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
    const markers = [...request.user.matchAll(/^\[(\d+)\]\s(.+)$/gm)].slice(0, 3);
    const listed = markers
      .map(([, number, title]) => `- Abschnitt [${number ?? '?'}] aus ${title ?? 'unbekannt'}`)
      .join('\n');

    const texte =
      request.language === 'en'
        ? {
            leer: 'No language model is connected, and no passage for this question was found in the selected sources.',
            intro:
              'No language model is connected. This answer is therefore not written out; it only shows which passages were found for the question:',
            outro:
              'To get real answers, set LLM_PROVIDER=openai and configure LLM_BASE_URL and LLM_MODEL (see apps/api/.env.example).',
          }
        : {
            leer: 'Es ist kein Sprachmodell verbunden, und zu dieser Frage wurde in den ausgewählten Quellen keine Textstelle gefunden.',
            intro:
              'Es ist kein Sprachmodell verbunden. Diese Antwort ist daher nicht formuliert, sondern zeigt nur, welche Textstellen zu der Frage gefunden wurden:',
            outro:
              'Um echte Antworten zu erhalten, setze LLM_PROVIDER=openai und trage LLM_BASE_URL sowie LLM_MODEL ein (siehe apps/api/.env.example).',
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
