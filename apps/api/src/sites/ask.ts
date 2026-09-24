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
import { isFreeMimoConsole, isOpenCodeConsole } from '../llm/freeMimo.ts';
import {
  FREE_MUSE_MODEL,
  isAllowedConsoleModel,
  isBlockedConsoleModel,
  isFreeMuseConsole,
  isFreeNemotronConsole,
} from '../llm/freeMuse.ts';
import { parseMuseAnswer } from '../llm/museResponse.ts';
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
  if (isBlockedConsoleModel(base ?? '', modelName ?? '', env.LLM_ACCESS_STATUS))
    throw new LlmUnavailableError(
      'Der externe Zugriff auf das kostenlose Modell wurde noch nicht erfolgreich geprüft.',
    );
  if (
    !base ||
    !modelName ||
    (!env.LLM_API_KEY &&
      !isFreeMimoConsole(base, modelName) &&
      !isFreeMuseConsole(base, modelName) &&
      !isFreeNemotronConsole(base, modelName))
  )
    throw new LlmUnavailableError('Kein Modell verbunden.');
  if (isOpenCodeConsole(base) && !isAllowedConsoleModel(base, modelName))
    throw new LlmUnavailableError('Dieses OpenCode-Console-Modell ist nicht freigegeben.');
  if (system.length + user.length > 100_000)
    throw new LlmUnavailableError('Die Textstellen sind für eine Anfrage zu groß.');
  const abort = new AbortController();
  const timer = setTimeout(() => {
    abort.abort();
  }, 120_000);
  try {
    const muse = isAllowedConsoleModel(base, modelName) && modelName === FREE_MUSE_MODEL;
    const response = await fetch(
      `${base.replace(/\/$/, '')}/${muse ? 'responses' : 'chat/completions'}`,
      {
        method: 'POST',
        redirect: 'manual',
        signal: abort.signal,
        headers: {
          'content-type': 'application/json',
          ...(env.LLM_API_KEY && !isFreeNemotronConsole(base, modelName)
            ? { authorization: `Bearer ${env.LLM_API_KEY}` }
            : {}),
        },
        body: JSON.stringify(
          muse
            ? {
                model: FREE_MUSE_MODEL,
                max_output_tokens: 4096,
                instructions: system,
                input: user,
              }
            : {
                model: modelName,
                temperature: 0,
                max_tokens: 4096,
                ...(isOpenCodeConsole(base) ? {} : { response_format: { type: 'json_object' } }),
                messages: [
                  { role: 'system', content: system },
                  { role: 'user', content: user },
                ],
              },
        ),
      },
    );
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      let targetOrigin = 'invalid';
      try {
        if (location) targetOrigin = new URL(location, base).origin;
      } catch {
        // A malformed Location header is not sent to logs or the browser.
      }
      console.warn('LLM outbound redirect', { status: response.status, targetOrigin });
      await response.body?.cancel();
      throw new LlmUnavailableError('Der Modellendpunkt leitet die Anfrage weiter.');
    }
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
    const json = JSON.parse(body) as unknown;
    if (muse) return { answer: parseMuseAnswer(json), model: modelName, simulated: false };
    const completion = ChatCompletion.safeParse(json);
    const choice = completion.success ? completion.data.choices[0] : undefined;
    if (!choice || choice.finish_reason === 'length' || choice.finish_reason === 'content_filter')
      throw new LlmUnavailableError('Das Modell lieferte keine vollständige Antwort.');
    const answer = ModelAnswerSchema.safeParse(extractJson(choice.message.content ?? ''));
    if (!answer.success)
      throw new LlmUnavailableError('Das Modell antwortete nicht im erwarteten JSON-Format.');
    return { answer: answer.data, model: modelName, simulated: false };
  } catch (error) {
    if (error instanceof LlmUnavailableError) throw error;
    const cause = error instanceof Error ? error.cause : undefined;
    const code =
      typeof cause === 'object' &&
      cause !== null &&
      'code' in cause &&
      typeof cause.code === 'string' &&
      /^[A-Z][A-Z0-9_]{1,63}$/.test(cause.code)
        ? cause.code
        : undefined;
    const name = error instanceof Error ? error.name : 'unknown';
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    const category = abort.signal.aborted
      ? 'timeout'
      : /redirect/.test(message)
        ? 'redirect'
        : /dns|resolve/.test(message)
          ? 'dns'
          : /connect|network/.test(message)
            ? 'connection'
            : /blocked|denied|not permitted|not allowed/.test(message)
              ? 'policy'
              : 'unknown';
    console.warn('LLM outbound transport failed', { name, category, code });
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
