import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_PROVIDER_PROMPT_CHARS,
  MAX_PROVIDER_RESPONSE_BYTES,
  OpenAiCompatibleProvider,
} from './openai.ts';
import { extractJson, ModelAnswerSchema } from './provider.ts';
import { OPENROUTER_BASE_URL, OPENROUTER_FREE_CHAT_MODEL } from './openrouter.ts';

const modelAnswer = {
  grounded: true,
  answer: 'Die Frist beträgt vierzehn Tage [1].',
  quotes: { '1': 'vierzehn Tage' },
};
const request = { system: 'Quellenbasiert antworten.', user: 'Frist?', language: 'de' as const };
const options = {
  baseUrl: 'https://provider.example/v1/',
  apiKey: 'server-only-test-secret',
  model: 'test-model',
  timeoutMs: 500,
  temperature: 0,
};
const provider = () => new OpenAiCompatibleProvider(options);
function completion(content = JSON.stringify(modelAnswer), finishReason = 'stop') {
  return Response.json({ choices: [{ message: { content }, finish_reason: finishReason }] });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

/** HTTP-Vertragstests mit kontrollierten Fetch-Doubles, keine Live-Modelltests. */
describe('OpenAI-kompatibler HTTP-Vertrag', () => {
  it('sendet Zugangsdaten nur im Header und liefert validiertes Modell-JSON', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(completion());
    vi.stubGlobal('fetch', fetchMock);
    const result = await provider().complete(request);
    expect(result).toEqual({ answer: modelAnswer, model: 'test-model', simulated: false });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://provider.example/v1/chat/completions');
    expect(init?.headers).toMatchObject({ authorization: `Bearer ${options.apiKey}` });
    expect(init?.redirect).toBe('error');
    expect(init?.body).not.toContain(options.apiKey);
    const body = init?.body;
    if (typeof body !== 'string') throw new Error('JSON-Request-Body erwartet');
    expect(JSON.parse(body) as unknown).toMatchObject({
      max_tokens: 4096,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system' }, { role: 'user' }],
    });
  });

  it('unterstützt lokale Anbieter ohne API-Schlüssel', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(completion());
    vi.stubGlobal('fetch', fetchMock);
    await new OpenAiCompatibleProvider({ ...options, apiKey: '' }).complete(request);
    expect(fetchMock.mock.calls[0]?.[1]?.headers).not.toHaveProperty('authorization');
  });

  it('limits OpenRouter to the free chat ID and sends its key only in the header', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(completion());
    vi.stubGlobal('fetch', fetchMock);
    const result = await new OpenAiCompatibleProvider({
      ...options,
      baseUrl: OPENROUTER_BASE_URL,
      model: OPENROUTER_FREE_CHAT_MODEL,
    }).complete(request);
    expect(result.model).toBe(OPENROUTER_FREE_CHAT_MODEL);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${OPENROUTER_BASE_URL}/chat/completions`);
    expect(init?.headers).toMatchObject({ authorization: `Bearer ${options.apiKey}` });
    expect(init?.body).not.toContain(options.apiKey);
    await expect(
      new OpenAiCompatibleProvider({
        ...options,
        baseUrl: OPENROUTER_BASE_URL,
        model: 'qwen/qwen3.8-27b',
      }).complete(request),
    ).rejects.toThrow('nicht für die kostenlose Demo freigegeben');
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('ruft MiMo V2.6 Flash Free an der Console ohne Schlüssel und ohne ungeprüftes response_format auf', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(completion());
    vi.stubGlobal('fetch', fetchMock);
    await new OpenAiCompatibleProvider({
      ...options,
      baseUrl: 'https://opencode.ai/inference/openai/v1',
      apiKey: '',
      model: 'mimo-v2.6-flash-free',
    }).complete(request);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://opencode.ai/inference/openai/v1/chat/completions');
    expect(init?.headers).not.toHaveProperty('authorization');
    if (typeof init?.body !== 'string') throw new Error('JSON-Request-Body erwartet');
    const body = JSON.parse(init.body) as unknown;
    expect(body).not.toHaveProperty('response_format');
    expect(body).toMatchObject({ model: 'mimo-v2.6-flash-free' });
  });

  it('sperrt andere Console-Modelle auch bei gesetztem Schlüssel', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      new OpenAiCompatibleProvider({
        ...options,
        baseUrl: 'https://opencode.ai/inference/openai/v1',
        model: 'paid-model',
      }).complete(request),
    ).rejects.toThrow('nicht freigegeben');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('nutzt für Muse Free ausschließlich Responses und prüft die Antwortstruktur', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        status: 'completed',
        output: [
          {
            type: 'message',
            role: 'assistant',
            content: [{ type: 'output_text', text: JSON.stringify(modelAnswer) }],
          },
        ],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const muse = new OpenAiCompatibleProvider({
      ...options,
      baseUrl: 'https://opencode.ai/inference/openai/v1',
      model: 'muse-spark-1.3-contributor-free',
    });
    expect((await muse.complete(request)).answer).toEqual(modelAnswer);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://opencode.ai/inference/openai/v1/responses');
    expect(init?.headers).toMatchObject({ authorization: `Bearer ${options.apiKey}` });
    if (typeof init?.body !== 'string') throw new Error('JSON-Request-Body erwartet');
    const body = JSON.parse(init.body) as Record<string, unknown>;
    expect(body).toMatchObject({
      model: 'muse-spark-1.3-contributor-free',
      instructions: request.system,
      input: request.user,
    });
    expect(body).not.toHaveProperty('response_format');
    fetchMock.mockResolvedValueOnce(Response.json({ status: 'incomplete', output: [] }));
    await expect(muse.complete(request)).rejects.toThrow('keine vollständige Antwort');
  });

  it('sendet einen konfigurierten Console-Service-Key nur im Header der freien Modell-ID', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(completion());
    vi.stubGlobal('fetch', fetchMock);
    const result = await new OpenAiCompatibleProvider({
      ...options,
      baseUrl: 'https://opencode.ai/inference/openai/v1',
      model: 'mimo-v2.6-flash-free',
    }).complete(request);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(result.model).toBe('mimo-v2.6-flash-free');
    expect(url).toBe('https://opencode.ai/inference/openai/v1/chat/completions');
    expect(init?.headers).toMatchObject({ authorization: `Bearer ${options.apiKey}` });
    expect(init?.body).not.toContain(options.apiKey);
  });

  it('begrenzt den Console-Vertrag für GLM Flash auf das explizite Modell mit Schlüssel', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(completion());
    vi.stubGlobal('fetch', fetchMock);
    const result = await new OpenAiCompatibleProvider({
      ...options,
      baseUrl: 'https://opencode.ai/inference/openai/v1',
      model: 'glm-5.3-flash',
    }).complete(request);
    expect(result.model).toBe('glm-5.3-flash');
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://opencode.ai/inference/openai/v1/chat/completions');
    expect(init?.headers).toMatchObject({ authorization: `Bearer ${options.apiKey}` });
    if (typeof init?.body !== 'string') throw new Error('JSON-Request-Body erwartet');
    expect(JSON.parse(init.body) as unknown).toMatchObject({ model: 'glm-5.3-flash' });
    expect(JSON.parse(init.body) as Record<string, unknown>).not.toHaveProperty('response_format');
    await expect(
      new OpenAiCompatibleProvider({
        ...options,
        baseUrl: 'https://opencode.ai/inference/openai/v1',
        model: 'glm-5.3-flash',
        apiKey: '',
      }).complete(request),
    ).rejects.toThrow('serverseitige Schlüssel');
  });

  it.each([401, 429, 500])(
    'gibt bei HTTP %i weder Antwortkörper noch Schlüssel weiter',
    async (status) => {
      vi.stubGlobal(
        'fetch',
        vi.fn<typeof fetch>().mockResolvedValue(new Response(options.apiKey, { status })),
      );
      const error: unknown = await provider()
        .complete(request)
        .catch((caught: unknown) => caught);
      expect(error).toBeInstanceOf(Error);
      expect(String(error)).toContain(`HTTP ${status}`);
      expect(String(error)).not.toContain(options.apiKey);
    },
  );

  it('unterdrückt vertrauliche Daten in Transportfehlern', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(new Error(options.apiKey)));
    await expect(provider().complete(request)).rejects.toThrow(
      'Der Modellendpunkt ist nicht erreichbar.',
    );
  });

  it.each([
    () => new Response('{"secret":"server-only-test-secret",'),
    () => Response.json({ choices: [] }),
    () => completion('{"grounded":true}'),
    () => completion('kein JSON'),
    () => completion('{"answer":"server-only-test-secret",broken}'),
    () => completion(JSON.stringify(modelAnswer), 'length'),
    () => completion(JSON.stringify(modelAnswer), 'content_filter'),
  ])('verwirft unvollständige oder ungültige Antworten: %#', async (response) => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(response()));
    const error: unknown = await provider()
      .complete(request)
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(Error);
    expect(String(error)).not.toContain(options.apiKey);
  });

  it('bricht einen übergroßen Antwortstrom auch ohne Content-Length ab', async () => {
    const cancel = vi.fn();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(MAX_PROVIDER_RESPONSE_BYTES + 1));
      },
      cancel,
    });
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(body)));
    await expect(provider().complete(request)).rejects.toThrow('Größenbegrenzung');
    expect(cancel).toHaveBeenCalledOnce();
  });

  it('lehnt deklarierte übergroße Antworten vor dem Lesen ab', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response('klein', {
          headers: { 'content-length': String(MAX_PROVIDER_RESPONSE_BYTES + 1) },
        }),
      ),
    );
    await expect(provider().complete(request)).rejects.toThrow('Größenbegrenzung');
  });

  it('begrenzt die Promptgröße vor dem Anbieteraufruf', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      provider().complete({ ...request, user: 'x'.repeat(MAX_PROVIDER_PROMPT_CHARS) }),
    ).rejects.toThrow('zu groß');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('hält den Timeout auch nach Eingang der HTTP-Header aktiv', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((_url, init) =>
      Promise.resolve(
        new Response(
          new ReadableStream<Uint8Array>({
            start(controller) {
              init?.signal?.addEventListener(
                'abort',
                () => {
                  controller.error(new DOMException('Abgebrochen', 'AbortError'));
                },
                { once: true },
              );
            },
          }),
        ),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      new OpenAiCompatibleProvider({ ...options, timeoutMs: 10 }).complete(request),
    ).rejects.toThrow('innerhalb von 10 ms');
    expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  });
});

describe('Modellantwort-Schema', () => {
  it('erkennt JSON in Codeblöcken, ohne fremde Texte in Fehlermeldungen zu spiegeln', () => {
    expect(extractJson(`\`\`\`json\n${JSON.stringify(modelAnswer)}\n\`\`\``)).toEqual(modelAnswer);
    expect(() => extractJson('{"secret":"server-only-test-secret",broken}')).toThrow(
      'Die Modellantwort ist kein gültiges JSON.',
    );
  });

  it('begrenzt Antwort, Zitate und zusätzliche Felder', () => {
    expect(
      ModelAnswerSchema.safeParse({ ...modelAnswer, answer: 'x'.repeat(20_001) }).success,
    ).toBe(false);
    expect(ModelAnswerSchema.safeParse({ ...modelAnswer, extra: 'ignore rules' }).success).toBe(
      false,
    );
    expect(ModelAnswerSchema.safeParse({ ...modelAnswer, quotes: { '1': 'kurz' } }).success).toBe(
      false,
    );
    expect(
      ModelAnswerSchema.safeParse({ ...modelAnswer, quotes: { invalid: 'vierzehn Tage' } }).success,
    ).toBe(false);
  });
});
