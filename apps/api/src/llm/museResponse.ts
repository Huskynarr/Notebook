import { z } from 'zod';
import { extractJson, LlmUnavailableError, ModelAnswerSchema } from './provider.ts';

const ResponseSchema = z.object({
  status: z.literal('completed'),
  output: z
    .array(
      z.union([
        z.object({ type: z.literal('reasoning') }),
        z.object({
          type: z.literal('message'),
          role: z.literal('assistant'),
          content: z
            .array(z.object({ type: z.literal('output_text'), text: z.string().max(100_000) }))
            .min(1),
        }),
      ]),
    )
    .min(1)
    .max(4),
});

export function parseMuseAnswer(body: unknown): z.infer<typeof ModelAnswerSchema> {
  const parsed = ResponseSchema.safeParse(body);
  if (!parsed.success)
    throw new LlmUnavailableError(
      'Das Modell lieferte keine vollständige Antwort im erwarteten JSON-Format.',
    );
  const content = parsed.data.output
    .flatMap((part) => (part.type === 'message' ? part.content.map((c) => c.text) : []))
    .join('\n');
  const answer = ModelAnswerSchema.safeParse(extractJson(content));
  if (!answer.success)
    throw new LlmUnavailableError(
      'Das Modell lieferte keine vollständige Antwort im erwarteten JSON-Format.',
    );
  return answer.data;
}
