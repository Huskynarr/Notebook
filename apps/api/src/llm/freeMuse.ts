export const FREE_MUSE_MODEL = 'muse-spark-1.3-contributor-free';
export const OPENCODE_CONSOLE_URL = 'https://opencode.ai/inference/openai/v1';

export function isFreeMuseConsole(base: string, model: string): boolean {
  return base.replace(/\/+$/, '') === OPENCODE_CONSOLE_URL && model === FREE_MUSE_MODEL;
}

export function isAllowedConsoleModel(base: string, model: string): boolean {
  return (
    base.replace(/\/+$/, '') === OPENCODE_CONSOLE_URL &&
    (model === FREE_MUSE_MODEL || model === 'mimo-v2.6-flash-free')
  );
}

export function isBlockedConsoleModel(base: string, model: string, status?: string): boolean {
  return status === 'blocked' && isAllowedConsoleModel(base, model);
}
