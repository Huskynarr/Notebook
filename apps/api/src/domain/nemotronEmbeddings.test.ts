import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RetrievedChunk } from '@notebook/shared';
import { NEMOTRON_EMBED_MODEL, rerankNemotron } from './nemotronEmbeddings.ts';

const candidates = ['Frist beträgt vierzehn Tage', 'Geschäftsführer laut Originalquelle'].map(
  (text, index) =>
    ({
      id: `chunk-${index}`,
      sourceId: 'selected',
      sourceTitle: 'Original',
      ordinal: index,
      startOffset: index * 40,
      endOffset: index * 40 + text.length,
      headingPath: '',
      text,
      score: 1 - index,
    }) satisfies RetrievedChunk,
);

afterEach(() => vi.unstubAllGlobals());

describe('optional NVIDIA embedding search', () => {
  it('reorders only the selected original chunks and keeps their offsets', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        data: [
          { index: 2, embedding: [1, 0] },
          { index: 0, embedding: [1, 0] },
          { index: 1, embedding: [0, 1] },
        ],
      }),
    );
    vi.stubGlobal('fetch', fetcher);
    const result = await rerankNemotron(
      'Wer ist Geschäftsführer?',
      candidates,
      'only-server-key',
      1,
    );
    expect(result).toEqual([candidates[1]]);
    const [url, init] = fetcher.mock.calls[0]!;
    expect(url).toBe('https://openrouter.ai/api/v1/embeddings');
    expect(init?.headers).toMatchObject({ authorization: 'Bearer only-server-key' });
    expect(init?.redirect).toBe('manual');
    const body = typeof init?.body === 'string' ? init.body : '';
    expect(JSON.parse(body) as unknown).toEqual({
      model: NEMOTRON_EMBED_MODEL,
      input: [
        'query: Wer ist Geschäftsführer?',
        ...candidates.map((chunk) => `passage: ${chunk.text}`),
      ],
    });
    expect(body).not.toContain('only-server-key');
  });

  it('refuses absent keys and provider failure without leaking provider content', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('secret provider diagnostic', { status: 429 }));
    vi.stubGlobal('fetch', fetcher);
    await expect(rerankNemotron('Frage', candidates, '', 1)).rejects.toThrow('Schlüssel fehlt');
    expect(fetcher).not.toHaveBeenCalled();
    await expect(rerankNemotron('Frage', candidates, 'server-key', 1)).rejects.toThrow(
      'semantische Quellenabruf',
    );
  });

  it('rejects missing, duplicate and malformed vectors instead of inventing rankings', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(
        Response.json({
          data: [
            { index: 0, embedding: [1, 0] },
            { index: 1, embedding: [0, 1] },
            { index: 1, embedding: [1, 0] },
          ],
        }),
      ),
    );
    await expect(rerankNemotron('Frage', candidates, 'server-key', 2)).rejects.toThrow(
      'semantische Quellenabruf',
    );
  });
});
