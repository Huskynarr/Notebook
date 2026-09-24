import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, lstatSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { forbiddenTrackedPath } from './preflight.mjs';

// Fixed allowlist: no working databases, environment files, keys, dependencies,
// tests or local logs can accidentally enter the deployable artifact.
const files = [
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'apps/api/package.json',
  'apps/api/src',
  'packages/shared/package.json',
  'packages/shared/dist',
  'apps/web/dist',
  'tools/deploy-remote.sh',
];
for (const file of files) {
  if (!existsSync(file))
    throw new Error(`Release-Datei fehlt: ${file}. Zuerst pnpm check:all ausführen.`);
}
const destination = resolve('build/release');
rmSync(destination, { recursive: true, force: true });
mkdirSync(destination, { recursive: true });
for (const file of files) {
  cpSync(file, resolve(destination, file), {
    recursive: true,
    filter: (source) => {
      if (lstatSync(source).isSymbolicLink())
        throw new Error(`Symlink im Release verweigert: ${source}`);
      return (
        !forbiddenTrackedPath(relative(process.cwd(), source)) &&
        !/\.(?:test|spec)(?:\.d)?\.[cm]?[jt]sx?$/.test(source) &&
        !/\.map$/.test(source)
      );
    },
  });
}
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const dirty = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim() !== '';
writeFileSync(
  resolve(destination, 'release.json'),
  `${JSON.stringify({ commit, dirty, createdAt: new Date().toISOString(), node: process.versions.node }, null, 2)}\n`,
);
process.stdout.write(`Release-Verzeichnis: ${destination} (${commit}, uncommitted=${dirty})\n`);
