import { z } from 'zod';
import {
  LlmUnavailableError,
  ModelAnswerSchema,
  extractJson,
  type CompletionRequest,
  type CompletionResult,
  type LlmProvider,
} from './provider.ts';

const ChatCompletionSchema = z.object({
  choices: z
    .array(z.object({ message: z.object({ content: z.string().nullable() }) }))
    .min(1),
});

export interface OpenAiCompatibleOptions {
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly model: string;
  readonly timeoutMs: number;
  readonly temperature: number;
}

/**
 * Spricht die OpenAI-Chat-Completions-Schnittstelle (D-004). Damit laufen
 * vLLM, Ollama, LiteLLM, Azure und OpenAI selbst ueber denselben Code.
 *
 * Der Schluessel verlaesst diese Datei nicht: er steht ausschliesslich im
 * Authorization-Header und taucht in keiner Fehlermeldung auf.
 */
export class OpenAiCompatibleProvider implements LlmProvider {
  readonly name = 'openai';

  constructor(private readonly options: OpenAiCompatibleOptions) {}

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, this.options.timeoutMs);

    try {
      const response = await fetch(`${this.options.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(this.options.apiKey === ''
            ? {}
            : { authorization: `Bearer ${this.options.apiKey}` }),
        },
        body: JSON.stringify({
          model: this.options.model,
          temperature: this.options.temperature,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: request.system },
            { role: 'user', content: request.user },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        // Der Antwortkoerper koennte die Anfrage samt Schluessel spiegeln und
        // wird deshalb nicht uebernommen.
        throw new LlmUnavailableError(
          `Das Modell antwortete mit HTTP ${response.status}. Basis-URL und Modellname pruefen.`,
        );
      }

      const parsed = ChatCompletionSchema.safeParse(await response.json());
      if (!parsed.success) {
        throw new LlmUnavailableError('Die Antwort des Endpunkts entspricht nicht dem erwarteten Format.');
      }
      const content = parsed.data.choices[0]?.message.content ?? '';
      const answer = ModelAnswerSchema.safeParse(extractJson(content));
      if (!answer.success) {
        throw new LlmUnavailableError(
          'Das Modell hat nicht in der vorgegebenen JSON-Form geantwortet.',
        );
      }
      return { answer: answer.data, model: this.options.model, simulated: false };
    } catch (error) {
      if (error instanceof LlmUnavailableError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new LlmUnavailableError(
          `Das Modell hat nicht innerhalb von ${this.options.timeoutMs} ms geantwortet.`,
        );
      }
      throw new LlmUnavailableError(
        `Der Modellendpunkt ist nicht erreichbar: ${error instanceof Error ? error.message : 'unbekannter Fehler'}`,
      );
    } finally {
      clearTimeout(timer);
    }
  }
}
