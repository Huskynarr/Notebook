import { describe, expect, it } from 'vitest';
import { EMPTY_COOLDOWN, failedLogin, readCooldown, remainingSeconds } from './loginCooldown.ts';

describe('client login cooldown', () => {
  it('waits after the third rejection and doubles the next delay', () => {
    let state = failedLogin(EMPTY_COOLDOWN, 0, 1000);
    expect(remainingSeconds(state, 1000)).toBe(0);
    state = failedLogin(state, 0, 2000);
    expect(remainingSeconds(state, 2000)).toBe(0);
    state = failedLogin(state, 0, 3000);
    expect(remainingSeconds(state, 3000)).toBe(30);
    expect(remainingSeconds(state, 32999)).toBe(1);
    state = failedLogin(state, 0, 33000);
    expect(remainingSeconds(state, 33000)).toBe(60);
  });

  it('honors a longer server cooldown and caps the local delay', () => {
    expect(remainingSeconds(failedLogin(EMPTY_COOLDOWN, 120, 0), 0)).toBe(120);
    expect(remainingSeconds(failedLogin({ failures: 99, retryAt: 0, updatedAt: 0 }, 0, 0), 0)).toBe(
      900,
    );
  });

  it('restores the countdown across reloads and resets stale or malformed storage', () => {
    const value = { failures: 3, retryAt: 31000, updatedAt: 1000 };
    expect(readCooldown({ getItem: () => JSON.stringify(value) }, 10000)).toEqual(value);
    expect(readCooldown({ getItem: () => JSON.stringify(value) }, 4_000_000)).toEqual(
      EMPTY_COOLDOWN,
    );
    expect(readCooldown({ getItem: () => '{broken' })).toEqual(EMPTY_COOLDOWN);
    expect(readCooldown({ getItem: () => '{"failures":-1,"retryAt":"later"}' })).toEqual(
      EMPTY_COOLDOWN,
    );
  });
});
