/** Limit this demo to explicit free model IDs. The router and paid
 * model IDs could incur charges or change the model behind a citation test. */
export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
export const OPENROUTER_FREE_CHAT_MODEL = 'qwen/qwen3.8-27b:free';
export const OPENROUTER_FREE_ALTERNATIVE = 'google/gemma-4-26b-a4b-it:free';

export function isOpenRouter(base: string): boolean {
  return base.replace(/\/+$/, '') === OPENROUTER_BASE_URL;
}

export function isAllowedOpenRouterModel(base: string, model: string): boolean {
  return (
    isOpenRouter(base) &&
    (model === OPENROUTER_FREE_CHAT_MODEL || model === OPENROUTER_FREE_ALTERNATIVE)
  );
}
