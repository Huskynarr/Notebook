export const BIG_PICKLE_CONSOLE_URL = 'https://opencode.ai/inference/openai/v1';

/** Only the Console free-chat endpoint may be called without a credential.
 * Keep this exact match: another model must never be charged accidentally. */
export function isBigPickleConsole(baseUrl: string, model: string): boolean {
  return baseUrl.replace(/\/+$/, '') === BIG_PICKLE_CONSOLE_URL && model === 'big-pickle';
}

export function isOpenCodeConsole(baseUrl: string): boolean {
  return baseUrl.replace(/\/+$/, '') === BIG_PICKLE_CONSOLE_URL;
}
