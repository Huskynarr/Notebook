import { z } from 'zod';
import type { AskResponse, Language, RetrievedChunk } from '@notebook/shared';
import { buildMatchQuery } from '../domain/retrieval.ts';
import { validateCitations } from '../domain/citations.ts';
import {
  SYSTEM_PROMPT,
  buildContext,
  buildUserPrompt,
  insufficientEvidenceAnswer,
  noMatchAnswer,
  noSourcesAnswer,
} from '../domain/prompt.ts';
import { extractJson, LlmUnavailableError, ModelAnswerSchema } from '../llm/provider.ts';
import { StubProvider } from '../llm/stub.ts';
import { FREE_MIMO_MODEL, isFreeMimoConsole, isOpenCodeConsole } from '../llm/freeMimo.ts';
import { retrieved, type SiteEnv } from './db.ts';

const ChatCompletion = z.object({
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

async function model(
  env: SiteEnv,
  system: string,
  user: string,
): Promise<{
  answer: z.infer<typeof ModelAnswerSchema>;
  model: string;
  simulated: boolean;
}> {
  const base = env.LLM_BASE_URL,
    modelName = env.LLM_MODEL;
  if (!base || !modelName || (!env.LLM_API_KEY && !isFreeMimoConsole(base, modelName)))
    throw new LlmUnavailableError('Kein Modell verbunden.');
  if (isOpenCodeConsole(base) && modelName !== FREE_MIMO_MODEL)
    throw new LlmUnavailableError('Für OpenCode Console ist nur MiMo V2.6 Flash Free freigegeben.');
  if (system.length + user.length > 100_000)
    throw new LlmUnavailableError('Die Textstellen sind für eine Anfrage zu groß.');
  const abort = new AbortController();
  const timer = setTimeout(() => {
    abort.abort();
  }, 120_000);
  try {
    const response = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      redirect: 'error',
      signal: abort.signal,
      headers: {
        'content-type': 'application/json',
        ...(env.LLM_API_KEY && !isFreeMimoConsole(base, modelName)
          ? { authorization: `Bearer ${env.LLM_API_KEY}` }
          : {}),
      },
      body: JSON.stringify({
        model: modelName,
        temperature: 0,
        max_tokens: 4096,
        ...(modelName === FREE_MIMO_MODEL ? {} : { response_format: { type: 'json_object' } }),
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new LlmUnavailableError(`Das Modell antwortete mit HTTP ${response.status}.`);
    }
    if (Number(response.headers.get('content-length') ?? 0) > 262_144) {
      await response.body?.cancel();
      throw new LlmUnavailableError('Die Modellantwort ist zu groß.');
    }
    const reader = response.body?.getReader();
    if (!reader) throw new LlmUnavailableError('Die Modellantwort ist leer.');
    const text = new TextDecoder();
    let body = '',
      length = 0;
    for (;;) {
      const item = await reader.read();
      if (item.done) break;
      length += item.value.byteLength;
      if (length > 262_144) {
        await reader.cancel();
        throw new LlmUnavailableError('Die Modellantwort ist zu groß.');
      }
      body += text.decode(item.value, { stream: true });
    }
    body += text.decode();
    const completion = ChatCompletion.safeParse(JSON.parse(body) as unknown);
    const choice = completion.success ? completion.data.choices[0] : undefined;
    if (!choice || choice.finish_reason === 'length' || choice.finish_reason === 'content_filter')
      throw new LlmUnavailableError('Das Modell lieferte keine vollständige Antwort.');
    const answer = ModelAnswerSchema.safeParse(extractJson(choice.message.content ?? ''));
    if (!answer.success)
      throw new LlmUnavailableError('Das Modell antwortete nicht im erwarteten JSON-Format.');
    return { answer: answer.data, model: modelName, simulated: false };
  } catch (error) {
    if (error instanceof LlmUnavailableError) throw error;
    throw new LlmUnavailableError('Der Modellendpunkt ist nicht erreichbar.');
  } finally {
    clearTimeout(timer);
  }
}

export async function askSites(
  env: SiteEnv,
  input: { question: string; sourceIds: string[]; language: Language },
): Promise<AskResponse> {
  const start = Date.now(),
    simulated = env.LLM_PROVIDER !== 'openai';
  const empty = (answer: string): AskResponse => ({
    answer,
    citations: [],
    retrieved: [],
    grounded: false,
    unsupportedSentenceCount: 0,
    droppedMarkers: [],
    simulated,
    model: simulated ? 'stub (kein Modell verbunden)' : '',
    elapsedMs: Date.now() - start,
  });
  if (input.sourceIds.length === 0) return empty(noSourcesAnswer(input.language));
  const match = buildMatchQuery(input.question);
  if (!match) return empty(noMatchAnswer(input.language));
  const ids = input.sourceIds;
  const sql = `SELECT c.id,c.source_id,c.ordinal,c.text,c.start_offset,c.end_offset,
    c.heading_path,s.title AS source_title,-bm25(chunks_fts,1.0,0.4) AS score
    FROM chunks_fts JOIN chunks c ON c.rowid=chunks_fts.rowid
    JOIN sources s ON s.id=c.source_id
    WHERE chunks_fts MATCH ? AND c.source_id IN (SELECT value FROM json_each(?))
    ORDER BY score DESC LIMIT 12`;
  const rows = await env.DB.prepare(sql).bind(match, JSON.stringify(ids)).all();
  const passages: RetrievedChunk[] = rows.results.map(retrieved);
  if (passages.length === 0) return empty(noMatchAnswer(input.language));
  const prompt = buildUserPrompt(input.question, buildContext(passages), input.language);
  const completion = simulated
    ? await new StubProvider().complete({
        system: SYSTEM_PROMPT,
        user: prompt,
        language: input.language,
      })
    : await model(env, SYSTEM_PROMPT, prompt);
  if (completion.simulated) {
    return {
      ...empty(completion.answer.answer),
      retrieved: passages,
      citations: passages.slice(0, 3).map((chunk, index) => ({
        marker: index + 1,
        sourceId: chunk.sourceId,
        sourceTitle: chunk.sourceTitle,
        chunkId: chunk.id,
        headingPath: chunk.headingPath,
        startOffset: chunk.startOffset,
        endOffset: chunk.endOffset,
        excerpt: chunk.text,
        precision: 'chunk',
      })),
    };
  }
  const validated = validateCitations(completion.answer.answer, passages, completion.answer.quotes);
  const grounded =
    completion.answer.grounded &&
    validated.citations.length > 0 &&
    !validated.hasInvalidCitations &&
    validated.unsupportedSentenceCount === 0;
  return {
    answer: grounded ? validated.answer : insufficientEvidenceAnswer(input.language),
    citations: grounded ? validated.citations : [],
    retrieved: passages,
    grounded,
    unsupportedSentenceCount: validated.unsupportedSentenceCount,
    droppedMarkers: validated.droppedMarkers,
    simulated: false,
    model: completion.model,
    elapsedMs: Date.now() - start,
  };
}

export { LlmUnavailableError };
