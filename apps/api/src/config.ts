import { z } from 'zod';
import { OPENROUTER_CHAT_MODELS } from '@notebook/shared';
import { isAllowedOpenRouterModel, isOpenRouter } from './llm/openrouter.ts';
import { isIP } from 'node:net';

function validProxy(value: string): boolean {
  const [address, prefix, extra] = value.split('/');
  if (address === undefined || extra !== undefined) return false;
  const family = isIP(address);
  if (family === 0) return false;
  if (prefix === undefined) return true;
  return /^\d+$/.test(prefix) && Number(prefix) > 0 && Number(prefix) <= (family === 4 ? 32 : 128);
}

/** Konfiguration des Backends. Wird beim Start einmal validiert; ein fehlerhafter
 *  Wert bricht den Start ab, statt spaeter als Laufzeitfehler aufzutauchen.
 *
 *  Geheimnisse leben ausschliesslich hier im Serverprozess. Nichts davon wird
 *  jemals an einen Client ausgeliefert (AGENTS.md Regel 4). */
const AdditionalUsersSchema = z
  .array(
    z.object({
      username: z.string().min(1).max(200),
      password: z.string().min(1).max(1024),
    }),
  )
  .max(10);

const ConfigSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(8787),
    HOST: z.string().default('127.0.0.1'),
    /** Empty by default. Only explicit proxy IPs/CIDRs are accepted, never blanket trust. */
    TRUST_PROXY: z
      .string()
      .default('')
      .transform((value) => (value === '' ? [] : value.split(',').map((part) => part.trim())))
      .refine(
        (values) => values.every(validProxy),
        'TRUST_PROXY verlangt explizite IP-Adressen oder CIDR-Netze.',
      ),

    /** Woher das Frontend kommen darf. Mehrere durch Komma getrennt. */
    CORS_ORIGIN: z
      .string()
      .default('http://localhost:5173')
      .refine(
        (value) =>
          value.split(',').every((entry) => {
            try {
              const url = new URL(entry.trim());
              return ['http:', 'https:'].includes(url.protocol) && url.origin === entry.trim();
            } catch {
              return false;
            }
          }),
        'CORS_ORIGIN verlangt vollständige Origins ohne Pfad oder Wildcard.',
      ),

    DATABASE_PATH: z.string().default('./data/notebook.db'),

    AUTH_USERNAME: z.string().min(1).max(200).default('Huskynarr'),
    AUTH_PASSWORD: z.string().min(1).max(1024).default('admin'),
    AUTH_ADDITIONAL_USERS: z
      .string()
      .default('[]')
      .transform((value, ctx) => {
        try {
          const parsed = AdditionalUsersSchema.safeParse(JSON.parse(value));
          if (parsed.success) return parsed.data;
        } catch {
          /* Invalid JSON must not echo credentials in startup errors. */
        }
        ctx.addIssue({
          code: 'custom',
          message: 'Gültige JSON-Liste mit höchstens zehn Zugangspaaren erforderlich.',
        });
        return z.NEVER;
      }),
    /** Signiert die Sitzungstoken. Ohne Vorgabe wird beim Start ein zufaelliger
     *  Wert erzeugt - dann gelten Sitzungen nur bis zum Neustart. */
    AUTH_SECRET: z.string().min(16).optional(),
    AUTH_TOKEN_TTL_HOURS: z.coerce.number().int().positive().default(12),

    /** `openai` spricht einen echten, OpenAI-kompatiblen Endpunkt an.
     *  `stub` liefert nachvollziehbar simulierte Antworten und kennzeichnet sie
     *  als solche - siehe AGENTS.md Regel 5. */
    LLM_PROVIDER: z.enum(['openai', 'stub']).default('stub'),
    LLM_BASE_URL: z.url().default('http://localhost:11434/v1'),
    LLM_API_KEY: z.string().default(''),
    LLM_MODEL: z.string().default('qwen2.5:14b-instruct'),
    LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(120_000),
    LLM_TEMPERATURE: z.coerce.number().min(0).max(2).default(0),

    /** Both OpenRouter APIs use the same server credential. Enabling semantic
     * retrieval remains an independent opt-in because free calls log excerpts. */
    EMBEDDING_PROVIDER: z.enum(['none', 'openrouter']).default('none'),
    OPENROUTER_EMBEDDING_KEY: z.string().default(''),

    /** Wie viele Abschnitte dem Modell hoechstens vorgelegt werden. */
    RETRIEVAL_TOP_K: z.coerce.number().int().positive().max(50).default(12),
    /** Zielgroesse eines Abschnitts in Zeichen. */
    CHUNK_TARGET_CHARS: z.coerce.number().int().positive().default(1200),

    SEED_ON_EMPTY: z
      .enum(['true', 'false'])
      .default('true')
      .transform((v) => v === 'true'),
  })
  .superRefine((config, ctx) => {
    if (config.LLM_PROVIDER === 'openai' && isOpenRouter(config.LLM_BASE_URL)) {
      if (!config.OPENROUTER_EMBEDDING_KEY)
        ctx.addIssue({
          code: 'custom',
          path: ['OPENROUTER_EMBEDDING_KEY'],
          message: 'OpenRouter-Schlüssel für Chatantworten erforderlich.',
        });
      if (!isAllowedOpenRouterModel(config.LLM_BASE_URL, config.LLM_MODEL))
        ctx.addIssue({
          code: 'custom',
          path: ['LLM_MODEL'],
          message: 'Nur freigegebene kostenlose OpenRouter-Modelle sind zulässig.',
        });
    }
    if (config.EMBEDDING_PROVIDER === 'openrouter' && !config.OPENROUTER_EMBEDDING_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['OPENROUTER_EMBEDDING_KEY'],
        message: 'OpenRouter-Schlüssel für den semantischen Abruf erforderlich.',
      });
    }
    const names = [
      config.AUTH_USERNAME,
      ...config.AUTH_ADDITIONAL_USERS.map((user) => user.username),
    ];
    if (new Set(names).size !== names.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['AUTH_ADDITIONAL_USERS'],
        message: 'Benutzernamen müssen eindeutig sein.',
      });
    }
    if (config.NODE_ENV !== 'production') return;
    if (
      config.AUTH_ADDITIONAL_USERS.some(
        (user) => user.password === 'admin' || user.password.length < 16,
      )
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['AUTH_ADDITIONAL_USERS'],
        message:
          'Produktion verlangt für jeden Zugang ein eigenes Passwort mit mindestens 16 Zeichen.',
      });
    }
    if (config.AUTH_PASSWORD === 'admin' || config.AUTH_PASSWORD.length < 16) {
      ctx.addIssue({
        code: 'custom',
        path: ['AUTH_PASSWORD'],
        message: 'Produktion verlangt ein eigenes Passwort mit mindestens 16 Zeichen.',
      });
    }
    if (config.AUTH_SECRET === undefined || config.AUTH_SECRET.length < 32) {
      ctx.addIssue({
        code: 'custom',
        path: ['AUTH_SECRET'],
        message: 'Produktion verlangt ein stabiles AUTH_SECRET mit mindestens 32 Zeichen.',
      });
    }
  });

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = ConfigSchema.safeParse(env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Konfiguration ungültig:\n${details}`);
  }
  return parsed.data;
}

/** Was das Frontend ueber die Konfiguration erfahren darf - bewusst ohne
 *  Basis-URL und ohne Schluessel. */
export function publicLlmInfo(config: Config): {
  configured: boolean;
  provider: string;
  model: string;
  selectableModels?: { id: string; name: string }[];
} {
  return {
    configured:
      config.LLM_PROVIDER === 'openai' &&
      (!isOpenRouter(config.LLM_BASE_URL) ||
        (isAllowedOpenRouterModel(config.LLM_BASE_URL, config.LLM_MODEL) &&
          !!config.OPENROUTER_EMBEDDING_KEY)),
    provider: config.LLM_PROVIDER,
    model: config.LLM_PROVIDER === 'stub' ? 'kein Modell verbunden' : config.LLM_MODEL,
    ...(config.LLM_PROVIDER === 'openai' &&
    isAllowedOpenRouterModel(config.LLM_BASE_URL, config.LLM_MODEL) &&
    !!config.OPENROUTER_EMBEDDING_KEY
      ? { selectableModels: [...OPENROUTER_CHAT_MODELS] }
      : {}),
  };
}
