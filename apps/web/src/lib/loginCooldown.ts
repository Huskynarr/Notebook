/** UX barrier only. The API independently enforces its persisted login limit. */
export interface LoginCooldown {
  failures: number;
  retryAt: number;
  updatedAt: number;
}

export const LOGIN_COOLDOWN_KEY = 'notebook.login.cooldown.v1';
const RESET_AFTER_MS = 60 * 60 * 1000;
export const EMPTY_COOLDOWN: LoginCooldown = { failures: 0, retryAt: 0, updatedAt: 0 };

export function readCooldown(storage: Pick<Storage, 'getItem'>, now = Date.now()): LoginCooldown {
  try {
    const data: unknown = JSON.parse(storage.getItem(LOGIN_COOLDOWN_KEY) ?? 'null');
    if (data === null || typeof data !== 'object') return EMPTY_COOLDOWN;
    if (!('failures' in data) || !('retryAt' in data) || !('updatedAt' in data))
      return EMPTY_COOLDOWN;
    if (
      typeof data.failures !== 'number' ||
      !Number.isSafeInteger(data.failures) ||
      data.failures < 0 ||
      typeof data.retryAt !== 'number' ||
      !Number.isFinite(data.retryAt) ||
      typeof data.updatedAt !== 'number' ||
      !Number.isFinite(data.updatedAt) ||
      now - data.updatedAt > RESET_AFTER_MS
    )
      return EMPTY_COOLDOWN;
    return { failures: data.failures, retryAt: data.retryAt, updatedAt: data.updatedAt };
  } catch {
    return EMPTY_COOLDOWN;
  }
}

export function failedLogin(
  previous: LoginCooldown,
  serverSeconds = 0,
  now = Date.now(),
): LoginCooldown {
  const failures = (now - previous.updatedAt > RESET_AFTER_MS ? 0 : previous.failures) + 1;
  const seconds = Math.max(
    serverSeconds,
    failures < 3 ? 0 : Math.min(900, 30 * 2 ** Math.min(failures - 3, 10)),
  );
  return { failures, retryAt: now + seconds * 1000, updatedAt: now };
}

export function remainingSeconds(state: LoginCooldown, now = Date.now()): number {
  return Math.max(0, Math.ceil((state.retryAt - now) / 1000));
}
