import assert from 'node:assert/strict';
import test from 'node:test';
import { validCommitMessage } from './commit-message.mjs';

test('commits require a declared scope and reproducible verification', () => {
  assert.equal(
    validCommitMessage('feat(web): ergänze Quellenwahl\n\nVerifiziert-durch: pnpm verify'),
    true,
  );
  assert.equal(
    validCommitMessage('fix(api)!: ändere API\n\nVerifiziert-durch: pnpm check:all'),
    true,
  );
  assert.equal(validCommitMessage('fix(api): ändere API'), false);
  assert.equal(validCommitMessage('update all\n\nVerifiziert-durch: pnpm verify'), false);
  assert.equal(
    validCommitMessage('feat(other): neuer Scope\n\nVerifiziert-durch: pnpm verify'),
    false,
  );
});
