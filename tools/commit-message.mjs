import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function validCommitMessage(message) {
  return (
    /^(feat|fix|perf|refactor|docs|test|build|ci|chore|style)\((web|api|shared|rag|db|docs|ci)\)!?: .{3,100}$/m.test(
      message.split('\n')[0],
    ) && /^Verifiziert-durch: .+/m.test(message)
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.argv[2] || !validCommitMessage(readFileSync(process.argv[2], 'utf8'))) {
    process.stderr.write(
      'Commit benötigt Conventional-Commit-Titel mit Scope und Verifiziert-durch: im Text (AGENTS.md).\n',
    );
    process.exitCode = 1;
  }
}
