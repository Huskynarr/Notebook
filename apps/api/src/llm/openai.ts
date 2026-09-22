import { z } from 'zod';
import type { ReadableStreamReadResult } from 'node:stream/web';
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
    .array(
      z.object({
        message: z.object({ content: z.string().max(100_000).nullable() }),
        finish_reason: z.string().nullable().optional(),
      }),
    )
    .min(1)
    .max(4),
});

export const MAX_PROVIDER_RESPONSE_BYTES = 256 * 1024;
export const MAX_PROVIDER_PROMPT_CHARS = 100_000;

/** Die Grenze gilt während des Lesens, auch ohne Content-Length. Der vom
 * Aufrufer gesetzte Abbruch bleibt bis zum Ende des Antwortkörpers aktiv. */
async function readLimitedJson(response: Response): Promise<unknown> {
  if (Number(response.headers.get('content-length') ?? 0) > MAX_PROVIDER_RESPONSE_BYTES) {
    await response.body?.cancel();
    throw new LlmUnavailableError('Die Modellantwort überschreitet die Größenbegrenzung.');
  }
  if (response.body === null) throw new LlmUnavailableError('Die Modellantwort ist leer.');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const next: ReadableStreamReadResult<unknown> = await reader.read();
      if (next.done) break;
      if (!(next.value instanceof Uint8Array)) {
        await reader.cancel();
        throw new LlmUnavailableError('Der Modellendpunkt lieferte keinen gültigen Datenstrom.');
      }
      length += next.value.byteLength;
      if (length > MAX_PROVIDER_RESPONSE_BYTES) {
        await reader.cancel();
        throw new LlmUnavailableError('Die Modellantwort überschreitet die Größenbegrenzung.');
      }
      chunks.push(next.value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } catch {
    throw new LlmUnavailableError('Der Modellendpunkt hat kein gültiges JSON geliefert.');
  }
}

export interface OpenAiCompatibleOptions {
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly model: string;
  readonly timeoutMs: number;
  readonly temperature: number;
}

/**
 * Spricht die OpenAI-Chat-Completions-Schnittstelle (D-004). Damit laufen
 * OpenAI-kompatible Endpunkte wie NVIDIA, vLLM und Ollama über denselben Code.
 * Anbieterzugang und Verfügbarkeit müssen für den konkreten Dienst geprüft werden.
 *
 * Der Schluessel verlaesst diese Datei nicht: er steht ausschliesslich im
 * Authorization-Header und taucht in keiner Fehlermeldung auf.
 */
export class OpenAiCompatibleProvider implements LlmProvider {
  readonly name = 'openai';
  private readonly options: OpenAiCompatibleOptions;

  constructor(options: OpenAiCompatibleOptions) {
    this.options = options;
  }

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    if (request.system.length + request.user.length > MAX_PROVIDER_PROMPT_CHARS) {
      throw new LlmUnavailableError('Die ausgewählten Textstellen sind für eine Anfrage zu groß.');
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, this.options.timeoutMs);

    try {
      const response = await fetch(`${this.options.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        redirect: 'error',
        headers: {
          'content-type': 'application/json',
          ...(this.options.apiKey === '' ? {} : { authorization: `Bearer ${this.options.apiKey}` }),
        },
        body: JSON.stringify({
          model: this.options.model,
          temperature: this.options.temperature,
          max_tokens: 4096,
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
        await response.body?.cancel();
        throw new LlmUnavailableError(
          `Das Modell antwortete mit HTTP ${response.status}. Basis-URL und Modellname prüfen.`,
        );
      }

      const parsed = ChatCompletionSchema.safeParse(await readLimitedJson(response));
      if (!parsed.success) {
        throw new LlmUnavailableError(
          'Die Antwort des Endpunkts entspricht nicht dem erwarteten Format.',
        );
      }
      const choice = parsed.data.choices[0];
      if (choice?.finish_reason === 'length' || choice?.finish_reason === 'content_filter') {
        throw new LlmUnavailableError('Das Modell hat keine vollständige Antwort geliefert.');
      }
      const content = choice?.message.content ?? '';
      const answer = ModelAnswerSchema.safeParse(extractJson(content));
      if (!answer.success) {
        throw new LlmUnavailableError(
          'Das Modell hat nicht in der vorgegebenen JSON-Form geantwortet.',
        );
      }
      return { answer: answer.data, model: this.options.model, simulated: false };
    } catch (error) {
      if (error instanceof LlmUnavailableError) throw error;
      if (controller.signal.aborted || (error instanceof Error && error.name === 'AbortError')) {
        throw new LlmUnavailableError(
          `Das Modell hat nicht innerhalb von ${this.options.timeoutMs} ms geantwortet.`,
        );
      }
      throw new LlmUnavailableError('Der Modellendpunkt ist nicht erreichbar.');
    } finally {
      clearTimeout(timer);
    }
  }
}
