import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';

const packageTool = resolve('tools/package-release.mjs');
const commit = 'a'.repeat(40);

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'notebook-package-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const files = {
    'package.json': '{}',
    'pnpm-lock.yaml': '',
    'pnpm-workspace.yaml': '',
    'apps/api/package.json': '{}',
    'apps/api/src/main.ts': 'export {};',
    'apps/api/src/.env': 'PRIVATE_DATA=canary',
    'apps/api/src/private.key': 'canary',
    'apps/api/src/main.test.ts': 'canary test',
    'packages/shared/package.json': '{}',
    'packages/shared/dist/index.js': 'export {};',
    'packages/shared/dist/index.test.d.ts': 'canary test types',
    'apps/web/dist/index.html': '<html></html>',
    'tools/deploy-remote.sh': '#!/bin/sh',
    '.env.production': 'PRIVATE_DATA=canary',
    'apps/api/data/notebook.db': 'private notebook',
    'bin/git': `#!/bin/sh\nif [ "$1" = rev-parse ]; then echo ${commit}; fi\n`,
  };
  for (const [file, value] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, file)), { recursive: true });
    writeFileSync(join(dir, file), value, { mode: file === 'bin/git' ? 0o755 : 0o644 });
  }
  return {
    dir,
    run: () =>
      spawnSync(process.execPath, [packageTool], {
        cwd: dir,
        env: { ...process.env, PATH: `${join(dir, 'bin')}:${process.env.PATH}` },
        encoding: 'utf8',
      }),
  };
}

test('release allowlist omits credentials, databases, tests and test declarations', (t) => {
  const f = fixture(t);
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  for (const file of [
    '.env.production',
    'apps/api/src/.env',
    'apps/api/src/private.key',
    'apps/api/data/notebook.db',
    'apps/api/src/main.test.ts',
    'packages/shared/dist/index.test.d.ts',
  ]) {
    assert.equal(existsSync(join(f.dir, 'build/release', file)), false, file);
  }
  assert.equal(existsSync(join(f.dir, 'build/release/apps/web/dist/index.html')), true);
  assert.equal(
    JSON.parse(readFileSync(join(f.dir, 'build/release/release.json'), 'utf8')).commit,
    commit,
  );
});

test('release packaging rejects symlinks rather than following private files', (t) => {
  const f = fixture(t);
  symlinkSync(join(f.dir, '.env.production'), join(f.dir, 'apps/api/src/secret.txt'));
  const result = f.run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Symlink im Release verweigert/);
});

test('release packaging requires a built frontend', (t) => {
  const f = fixture(t);
  rmSync(join(f.dir, 'apps/web/dist'), { recursive: true });
  const result = f.run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Release-Datei fehlt: apps\/web\/dist/);
});
