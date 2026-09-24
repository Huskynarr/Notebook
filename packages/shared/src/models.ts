/** Curated public model IDs. The server still validates the selected ID before
 * making any request; this list is not an availability or quota guarantee. */
export const OPENROUTER_CHAT_MODELS = [
  { id: 'google/gemma-4-26b-a4b-it:free', name: 'Gemma 4 26B A4B · Free' },
  { id: 'google/gemma-4-31b-it:free', name: 'Gemma 4 31B · Free' },
  { id: 'qwen/qwen3.8-27b:free', name: 'Qwen 3.8 27B · Free' },
  { id: 'nvidia/nemotron-3.5-lightning:free', name: 'Nemotron 3.5 Lightning · Free' },
] as const;
