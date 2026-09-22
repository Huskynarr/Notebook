import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { format, resolveConfig } from 'prettier';

const destination = 'apps/web/src/styles/theme.css';
const scratch = mkdtempSync(join(tmpdir(), 'notebook-theme-'));
try {
  mkdirSync(join(scratch, 'apps/web/src/styles'), { recursive: true });
  execFileSync('python3', [resolve('tools/build-theme.py')], { cwd: scratch, stdio: 'pipe' });
  const expected = await format(readFileSync(join(scratch, destination), 'utf8'), {
    ...(await resolveConfig(resolve(destination))),
    filepath: resolve(destination),
  });
  if (readFileSync(destination, 'utf8') !== expected) {
    throw new Error('Design-Tokens weichen vom Generator ab. Zuerst pnpm theme ausführen.');
  }
  process.stdout.write('Design-Tokens stimmen mit dem Generator überein.\n');
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
