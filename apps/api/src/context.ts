import type { Config } from './config.ts';
import { Auth } from './auth.ts';
import { LoginThrottle } from './loginThrottle.ts';
import { openDatabase, type Db } from './db/database.ts';
import { NoteRepository, NotebookRepository, SourceRepository } from './db/repositories.ts';
import { OpenAiCompatibleProvider } from './llm/openai.ts';
import { StubProvider } from './llm/stub.ts';
import type { LlmProvider } from './llm/provider.ts';

export interface AppContext {
  readonly config: Config;
  readonly db: Db;
  readonly auth: Auth;
  readonly loginThrottle: LoginThrottle;
  readonly llm: LlmProvider;
  readonly notebooks: NotebookRepository;
  readonly sources: SourceRepository;
  readonly notes: NoteRepository;
}

export function createContext(config: Config, db?: Db): AppContext {
  const database = db ?? openDatabase(config.DATABASE_PATH);
  return {
    config,
    db: database,
    auth: new Auth(config),
    loginThrottle: new LoginThrottle(database),
    llm:
      config.LLM_PROVIDER === 'openai'
        ? new OpenAiCompatibleProvider({
            baseUrl: config.LLM_BASE_URL,
            apiKey: config.LLM_API_KEY,
            model: config.LLM_MODEL,
            timeoutMs: config.LLM_TIMEOUT_MS,
            temperature: config.LLM_TEMPERATURE,
          })
        : new StubProvider(),
    notebooks: new NotebookRepository(database),
    sources: new SourceRepository(database, config.CHUNK_TARGET_CHARS),
    notes: new NoteRepository(database),
  };
}
