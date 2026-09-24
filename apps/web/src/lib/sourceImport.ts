import { MAX_SOURCE_BYTES } from '@notebook/shared';

export class SourceImportError extends Error {
  readonly reason: 'tooLarge' | 'invalidFile';
  constructor(reason: 'tooLarge' | 'invalidFile') {
    super(reason);
    this.reason = reason;
  }
}

export function checkSourceText(text: string): void {
  if (new TextEncoder().encode(text).byteLength > MAX_SOURCE_BYTES)
    throw new SourceImportError('tooLarge');
  if (text.includes('\u0000')) throw new SourceImportError('invalidFile');
}

export async function readSourceFile(
  file: Pick<File, 'size' | 'name' | 'arrayBuffer'>,
): Promise<string> {
  // Check metadata before loading the file into memory.
  if (file.size > MAX_SOURCE_BYTES) throw new SourceImportError('tooLarge');
  if (!/\.(txt|md)$/i.test(file.name)) throw new SourceImportError('invalidFile');
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
  } catch {
    throw new SourceImportError('invalidFile');
  }
  checkSourceText(text);
  return text;
}
