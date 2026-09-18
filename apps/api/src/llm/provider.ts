import { z } from 'zod';

/** Die Antwortform, auf die das Modell festgelegt wird (siehe domain/prompt.ts).
 *  Wird streng validiert - ein Modell, das sich nicht daran haelt, darf keine
 *  halbgare Antwort durchreichen. */
export const ModelAnswerSchema = z.object({
  grounded: z.boolean(),
  answer: z.string(),
  quotes: z.record(z.string(), z.string()).default({}),
});
export type ModelAnswer = z.infer<typeof ModelAnswerSchema>;

export interface CompletionRequest {
  readonly system: string;
  readonly user: string;
}

export interface CompletionResult {
  readonly answer: ModelAnswer;
  readonly model: string;
  /** true = die Antwort stammt nicht von einem Modell. Wird bis ins UI
   *  durchgereicht und dort sichtbar angezeigt (AGENTS.md Regel 5). */
  readonly simulated: boolean;
}

export interface LlmProvider {
  readonly name: string;
  complete(request: CompletionRequest): Promise<CompletionResult>;
}

export class LlmUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LlmUnavailableError';
  }
}

/** Modelle verpacken JSON gern in einen Codeblock oder stellen einen Satz davor.
 *  Holt das erste vollstaendige JSON-Objekt heraus. */
export function extractJson(raw: string): unknown {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(raw);
  const candidate = fenced?.[1] ?? raw;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end <= start) {
    throw new LlmUnavailableError('Die Modellantwort enthält kein JSON-Objekt.');
  }
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as unknown;
  } catch (error) {
    throw new LlmUnavailableError(
      `Die Modellantwort ist kein gueltiges JSON: ${error instanceof Error ? error.message : 'unbekannt'}`,
    );
  }
}
