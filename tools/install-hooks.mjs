import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync } from 'node:fs';

if (!process.env.CI && existsSync('.git')) {
  let current = '';
  try {
    current = execFileSync('git', ['config', '--get', 'core.hooksPath'], {
      encoding: 'utf8',
    }).trim();
  } catch {
    /* An unset hooksPath is normal in a fresh checkout. */
  }
  if (current && current !== '.githooks') {
    process.stderr.write(
      `Bestehender Hook-Pfad ${current} bleibt erhalten. Projekt-Hooks: .githooks\n`,
    );
  } else {
    for (const hook of ['pre-commit', 'commit-msg', 'pre-push'])
      chmodSync(`.githooks/${hook}`, 0o755);
    execFileSync('git', ['config', 'core.hooksPath', '.githooks']);
    process.stdout.write('Git-Hooks installiert: verify vor Commit, E2E vor Push.\n');
  }
}
