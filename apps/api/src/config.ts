import { z } from 'zod';

/** Konfiguration des Backends. Wird beim Start einmal validiert; ein fehlerhafter
 *  Wert bricht den Start ab, statt spaeter als Laufzeitfehler aufzutauchen.
 *
 *  Geheimnisse leben ausschliesslich hier im Serverprozess. Nichts davon wird
 *  jemals an einen Client ausgeliefert (AGENTS.md Regel 4). */
const ConfigSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(8787),
  HOST: z.string().default('127.0.0.1'),

  /** Woher das Frontend kommen darf. Mehrere durch Komma getrennt. */
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  DATABASE_PATH: z.string().default('./data/notebook.db'),

  AUTH_USERNAME: z.string().min(1).default('admin'),
  AUTH_PASSWORD: z.string().min(1).default('admin'),
  /** Signiert die Sitzungstoken. Ohne Vorgabe wird beim Start ein zufaelliger
   *  Wert erzeugt - dann gelten Sitzungen nur bis zum Neustart. */
  AUTH_SECRET: z.string().min(16).optional(),
  AUTH_TOKEN_TTL_HOURS: z.coerce.number().int().positive().default(12),

  /** `openai` spricht einen echten, OpenAI-kompatiblen Endpunkt an.
   *  `stub` liefert nachvollziehbar simulierte Antworten und kennzeichnet sie
   *  als solche - siehe AGENTS.md Regel 5. */
  LLM_PROVIDER: z.enum(['openai', 'stub']).default('stub'),
  LLM_BASE_URL: z.string().url().default('http://localhost:11434/v1'),
  LLM_API_KEY: z.string().default(''),
  LLM_MODEL: z.string().default('qwen2.5:14b-instruct'),
  LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(120_000),
  LLM_TEMPERATURE: z.coerce.number().min(0).max(2).default(0),

  /** Wie viele Abschnitte dem Modell hoechstens vorgelegt werden. */
  RETRIEVAL_TOP_K: z.coerce.number().int().positive().max(50).default(12),
  /** Zielgroesse eines Abschnitts in Zeichen. */
  CHUNK_TARGET_CHARS: z.coerce.number().int().positive().default(1200),

  SEED_ON_EMPTY: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = ConfigSchema.safeParse(env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Konfiguration ungueltig:\n${details}`);
  }
  return parsed.data;
}

/** Was das Frontend ueber die Konfiguration erfahren darf - bewusst ohne
 *  Basis-URL und ohne Schluessel. */
export function publicLlmInfo(config: Config): {
  configured: boolean;
  provider: string;
  model: string;
} {
  return {
    configured: config.LLM_PROVIDER === 'openai',
    provider: config.LLM_PROVIDER,
    model: config.LLM_PROVIDER === 'stub' ? 'kein Modell verbunden' : config.LLM_MODEL,
  };
}
