export const FREE_MIMO_CONSOLE_URL = 'https://opencode.ai/inference/openai/v1';
export const FREE_MIMO_MODEL = 'mimo-v2.6-flash-free';

/** Only the Console free-chat endpoint may be called without a credential.
 * Keep this exact match: another model must never be charged accidentally. */
export function isFreeMimoConsole(baseUrl: string, model: string): boolean {
  return baseUrl.replace(/\/+$/, '') === FREE_MIMO_CONSOLE_URL && model === FREE_MIMO_MODEL;
}

export function isOpenCodeConsole(baseUrl: string): boolean {
  return baseUrl.replace(/\/+$/, '') === FREE_MIMO_CONSOLE_URL;
}
