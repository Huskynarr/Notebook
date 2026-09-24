import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function supportedNode(version) {
  const [major, minor] = version.replace(/^v/, '').split('.').map(Number);
  return major > 22 || (major === 22 && minor >= 18);
}

export function forbiddenTrackedPath(path) {
  return (
    (/(^|\/)\.env(?:\.|$)/.test(path) && !path.endsWith('.env.example')) ||
    /(^|\/)(?:node_modules|\.e2e)(\/|$)/.test(path) ||
    /\.(?:db|sqlite|sqlite3)(?:-(?:wal|shm|journal))?$/.test(path) ||
    /\.(?:pem|p12|pfx|key)$/.test(path)
  );
}

export function preflight() {
  if (!supportedNode(process.versions.node)) {
    throw new Error('Node.js >=22.18.0 ist erforderlich (Type-Stripping und SQLite).');
  }
  let paths;
  try {
    paths = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
      .split('\0')
      .filter(Boolean);
  } catch {
    throw new Error('Preflight verlangt einen Git-Checkout.');
  }
  const forbidden = paths.filter(forbiddenTrackedPath);
  if (forbidden.length > 0) {
    throw new Error(`Sensible oder generierte Dateien im Git-Index: ${forbidden.join(', ')}`);
  }
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.packageManager !== 'pnpm@9.15.9')
    throw new Error('pnpm muss auf 9.15.9 festgelegt bleiben.');
  process.stdout.write('Preflight: Node-Version, Paketmanager und sensible Dateipfade geprüft.\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) preflight();
