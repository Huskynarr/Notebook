import type { AskResponse } from '@notebook/shared';
import type { Db } from '../db/database.ts';
import { LlmUnavailableError, type LlmProvider } from '../llm/provider.ts';
import { validateCitations } from './citations.ts';
import {
  NO_MATCH_ANSWER,
  NO_SOURCES_ANSWER,
  SYSTEM_PROMPT,
  buildContext,
  buildUserPrompt,
} from './prompt.ts';
import { retrieve } from './retrieval.ts';

export interface AskOptions {
  readonly topK: number;
}

/**
 * Der quellenbasierte Ablauf in einer Funktion: abrufen, vorlegen, validieren.
 *
 * Zwei Abbruchpunkte vor dem Modell - keine ausgewaehlte Quelle und kein
 * Treffer - liefern eine ausdrueckliche Auskunft statt einer Antwort. Das
 * Modell wird in diesen Faellen gar nicht erst gefragt, damit es nicht in
 * Versuchung kommt, aus eigenem Wissen zu antworten.
 */
export async function ask(
  db: Db,
  provider: LlmProvider,
  input: { question: string; sourceIds: readonly string[] },
  options: AskOptions,
): Promise<AskResponse> {
  const startedAt = Date.now();

  if (input.sourceIds.length === 0) {
    return emptyResponse(NO_SOURCES_ANSWER, provider, startedAt);
  }

  const retrieved = retrieve(db, input.question, {
    sourceIds: input.sourceIds,
    topK: options.topK,
  });

  if (retrieved.length === 0) {
    return emptyResponse(NO_MATCH_ANSWER, provider, startedAt);
  }

  const completion = await provider.complete({
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(input.question, buildContext(retrieved)),
  });

  const validated = validateCitations(
    completion.answer.answer,
    retrieved,
    completion.answer.quotes,
  );

  // Das Modell darf sich selbst als "belegt" bezeichnen - massgeblich ist aber,
  // ob nach der Validierung ueberhaupt ein Beleg uebrig geblieben ist.
  const grounded = completion.answer.grounded && validated.citations.length > 0;

  return {
    answer: validated.answer,
    citations: validated.citations,
    retrieved,
    grounded,
    unsupportedSentenceCount: validated.unsupportedSentenceCount,
    droppedMarkers: validated.droppedMarkers,
    simulated: completion.simulated,
    model: completion.model,
    elapsedMs: Date.now() - startedAt,
  };
}

function emptyResponse(answer: string, provider: LlmProvider, startedAt: number): AskResponse {
  return {
    answer,
    citations: [],
    retrieved: [],
    grounded: false,
    unsupportedSentenceCount: 0,
    droppedMarkers: [],
    simulated: provider.name === 'stub',
    model: provider.name === 'stub' ? 'stub (kein Modell verbunden)' : '',
    elapsedMs: Date.now() - startedAt,
  };
}

export { LlmUnavailableError };
