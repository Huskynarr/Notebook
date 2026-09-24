import assert from 'node:assert/strict';
import test from 'node:test';
import { forbiddenTrackedPath, supportedNode } from './preflight.mjs';

test('runtime rejects versions without the required unflagged TypeScript runtime', () => {
  for (const version of ['20.19.0', '22.17.0', 'v21.7.0'])
    assert.equal(supportedNode(version), false);
  for (const version of ['22.18.0', 'v22.21.0', '24.0.0'])
    assert.equal(supportedNode(version), true);
});

test('preflight blocks private env files, keys, databases and dependency trees', () => {
  for (const path of [
    '.env',
    'apps/api/.env.production',
    'private.key',
    'apps/api/data/notebook.db-wal',
    'fixture.sqlite',
    'node_modules/package.json',
    'apps/api/.e2e/test.db',
  ]) {
    assert.equal(forbiddenTrackedPath(path), true, path);
  }
  for (const path of [
    'apps/api/.env.example',
    'docs/env.md',
    'apps/api/src/db/schema.sql',
    'pnpm-lock.yaml',
  ]) {
    assert.equal(forbiddenTrackedPath(path), false, path);
  }
});
