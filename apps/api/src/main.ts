import { loadConfig } from './config.ts';
import { createContext } from './context.ts';
import { buildServer } from './server.ts';
import { seedIfEmpty } from './seed/run.ts';

async function main(): Promise<void> {
  const config = loadConfig();
  const ctx = createContext(config);

  if (config.SEED_ON_EMPTY && seedIfEmpty(ctx)) {
    process.stdout.write('Beispiel-Notebook angelegt (Datenbank war leer).\n');
  }

  const app = await buildServer(ctx);

  if (ctx.auth.secretIsEphemeral) {
    app.log.warn(
      'AUTH_SECRET ist nicht gesetzt - Sitzungen gelten nur bis zum Neustart des Servers.',
    );
  }
  if (config.LLM_PROVIDER === 'stub') {
    app.log.warn(
      'LLM_PROVIDER=stub - es ist kein Modell verbunden. Antworten sind simuliert und im UI als solche gekennzeichnet.',
    );
  }

  let stopping = false;
  const stop = async (): Promise<void> => {
    if (stopping) return;
    stopping = true;
    await app.close();
    ctx.db.close();
  };
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
      void stop().catch(() => {
        process.exitCode = 1;
      });
    });
  }
  await app.listen({ port: config.PORT, host: config.HOST });
}

main().catch((error: unknown) => {
  process.stderr.write(
    `Start fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
});
