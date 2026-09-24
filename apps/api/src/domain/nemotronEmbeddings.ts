import { z } from 'zod';
import type { RetrievedChunk } from '@notebook/shared';
import { LlmUnavailableError } from '../llm/provider.ts';

/** Only the server calls this endpoint. OpenRouter's free tier logs submitted text;
 * activation therefore requires an explicit server setting and a separate key. */
export const NEMOTRON_EMBED_MODEL = 'nvidia/llama-nemotron-embed-vl-1b-v2:free';
const EMBEDDINGS_URL = 'https://openrouter.ai/api/v1/embeddings';
const MAX_CANDIDATES = 18;
const MAX_RESPONSE_BYTES = 2_000_000;
const Embeddings = z.object({
  data: z
    .array(
      z.object({
        index: z.number().int().nonnegative(),
        embedding: z.array(z.number()).min(1).max(4096),
      }),
    )
    .min(1)
    .max(MAX_CANDIDATES + 1),
});

function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error('Uneinheitliche Embedding-Dimensionen');
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i],
      y = b[i];
    if (x === undefined || y === undefined) throw new Error('Uneinheitliche Embedding-Dimensionen');
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }
  if (normA === 0 || normB === 0) throw new Error('Leerer Embedding-Vektor');
  return dot / Math.sqrt(normA * normB);
}

/** A bounded semantic second pass over FTS hits, without a vector store or
 * replacing FTS recall. We retain the original chunk IDs and offsets. */
export async function rerankNemotron(
  question: string,
  candidates: readonly RetrievedChunk[],
  apiKey: string,
  topK: number,
): Promise<RetrievedChunk[]> {
  if (!apiKey) throw new LlmUnavailableError('Der OpenRouter-Schlüssel fehlt im Backend.');
  if (candidates.length === 0) return [];
  if (candidates.length > MAX_CANDIDATES || topK < 1 || topK > MAX_CANDIDATES)
    throw new Error('Ungültige Grenze für semantische Suche');
  const inputs = [`query: ${question}`, ...candidates.map((chunk) => `passage: ${chunk.text}`)];
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, 12_000);
  try {
    const response = await fetch(EMBEDDINGS_URL, {
      method: 'POST',
      redirect: 'manual',
      signal: controller.signal,
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: NEMOTRON_EMBED_MODEL, input: inputs }),
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`HTTP ${response.status}`);
    }
    if (Number(response.headers.get('content-length') ?? 0) > MAX_RESPONSE_BYTES) {
      await response.body?.cancel();
      throw new Error('Antwort zu groß');
    }
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Leere Antwort');
    const parts: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const item = await reader.read();
      if (item.done) break;
      size += item.value.byteLength;
      if (size > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new Error('Antwort zu groß');
      }
      parts.push(item.value);
    }
    const payload = new Uint8Array(size);
    let position = 0;
    for (const part of parts) {
      payload.set(part, position);
      position += part.byteLength;
    }
    const result = Embeddings.parse(JSON.parse(new TextDecoder().decode(payload)) as unknown);
    if (result.data.length !== inputs.length) throw new Error('Unvollständige Embeddings');
    const vectors = new Map(result.data.map((entry) => [entry.index, entry.embedding]));
    if (
      vectors.size !== inputs.length ||
      [...vectors.keys()].some((index) => index >= inputs.length)
    )
      throw new Error('Ungültige Embedding-Indizes');
    const query = vectors.get(0);
    if (!query) throw new Error('Fehlender Anfragevektor');
    return candidates
      .map((chunk, index) => {
        const passage = vectors.get(index + 1);
        if (!passage) throw new Error('Fehlender Textvektor');
        return { chunk, index, similarity: cosine(query, passage) };
      })
      .sort((a, b) => b.similarity - a.similarity || a.index - b.index)
      .slice(0, topK)
      .map(({ chunk }) => chunk);
  } catch {
    // No provider body, key, or source excerpt is echoed to the client or logs.
    throw new LlmUnavailableError('Der semantische Quellenabruf ist derzeit nicht erreichbar.');
  } finally {
    clearTimeout(timer);
  }
}
