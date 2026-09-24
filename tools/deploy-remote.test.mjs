import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const commit = 'a'.repeat(40);
const deploy = resolve('tools/deploy-remote.sh');

function fixture(t, { healthy = true, dirty = false, production = true } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'notebook-deploy-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const root = join(dir, 'notebook');
  const payload = join(dir, 'payload');
  const bin = join(dir, 'bin');
  for (const path of [
    join(root, 'shared'),
    join(root, 'releases/previous'),
    join(payload, 'apps/api/src'),
    bin,
  ])
    mkdirSync(path, { recursive: true });
  writeFileSync(join(root, 'shared/api.env'), 'AUTH_PASSWORD=only-a-test\n', { mode: 0o600 });
  symlinkSync(join(root, 'releases/previous'), join(root, 'current'));
  writeFileSync(join(payload, 'release.json'), JSON.stringify({ commit, dirty }));
  writeFileSync(join(payload, 'apps/api/package.json'), '{"type":"module"}');
  writeFileSync(
    join(payload, 'apps/api/src/config.ts'),
    `export function loadConfig() { return ${JSON.stringify({ NODE_ENV: production ? 'production' : 'development', HOST: '127.0.0.1', PORT: 8787, DATABASE_PATH: './data/notebook.db' })}; }`,
  );
  const scripts = {
    pnpm: '#!/bin/sh\nif [ "$1" = --version ]; then echo 9.15.9; fi\n',
    systemctl: '#!/bin/sh\nprintf "%s\\n" "$*" >> "$DEPLOY_TEST_LOG"\n',
    curl: `#!/bin/sh\nexit ${healthy ? '0' : '1'}\n`,
    sleep: '#!/bin/sh\nexit 0\n',
  };
  for (const [name, script] of Object.entries(scripts)) {
    writeFileSync(join(bin, name), script, { mode: 0o755 });
  }
  const archive = join(dir, 'release.tar.gz');
  execFileSync('tar', ['-czf', archive, '-C', payload, '.']);
  return {
    root,
    archive,
    log: join(dir, 'service.log'),
    run: () =>
      spawnSync('bash', [deploy, root, commit, archive], {
        env: {
          ...process.env,
          PATH: `${bin}:${process.env.PATH}`,
          DEPLOY_TEST_LOG: join(dir, 'service.log'),
        },
        encoding: 'utf8',
      }),
  };
}

test('deployment switches current only after configuration validation, then checks health', (t) => {
  const f = fixture(t);
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readlinkSync(join(f.root, 'current')), join(f.root, `releases/${commit}`));
  assert.equal(
    readlinkSync(join(f.root, `releases/${commit}/apps/api/data`)),
    join(f.root, 'shared/data'),
  );
  assert.match(readFileSync(f.log, 'utf8'), /--user restart notebook.service/);
});

test('failed health check restores previous code release and restarts it', (t) => {
  const f = fixture(t, { healthy: false });
  const result = f.run();
  assert.equal(result.status, 1);
  assert.equal(readlinkSync(join(f.root, 'current')), join(f.root, 'releases/previous'));
  assert.equal(readFileSync(f.log, 'utf8').trim().split('\n').length, 2);
  assert.match(result.stderr, /Database migrations are not automatically reverted/);
});

test('dirty artifact or non-production config cannot replace a running release', (t) => {
  for (const option of [{ dirty: true }, { production: false }]) {
    const f = fixture(t, option);
    assert.notEqual(f.run().status, 0);
    assert.equal(readlinkSync(join(f.root, 'current')), join(f.root, 'releases/previous'));
  }
});

test('insecure server environment permissions fail before unpacking', (t) => {
  const f = fixture(t);
  chmodSync(join(f.root, 'shared/api.env'), 0o644);
  const result = f.run();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /mode 600/);
  assert.equal(readlinkSync(join(f.root, 'current')), join(f.root, 'releases/previous'));
});
