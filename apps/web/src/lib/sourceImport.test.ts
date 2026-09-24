import { describe, expect, it, vi } from 'vitest';
import { MAX_SOURCE_BYTES } from '@notebook/shared';
import { checkSourceText, readSourceFile } from './sourceImport.ts';

describe('source import boundaries', () => {
  it('checks UTF-8 bytes instead of JavaScript character count', () => {
    expect(() => {
      checkSourceText('a'.repeat(MAX_SOURCE_BYTES));
    }).not.toThrow();
    expect(() => {
      checkSourceText('a'.repeat(MAX_SOURCE_BYTES + 1));
    }).toThrow('tooLarge');
    expect(() => {
      checkSourceText('ä'.repeat(MAX_SOURCE_BYTES / 2 + 1));
    }).toThrow('tooLarge');
  });
  it('rejects oversized files before reading them', async () => {
    const arrayBuffer = vi.fn<() => Promise<ArrayBuffer>>();
    await expect(
      readSourceFile({ size: MAX_SOURCE_BYTES + 1, name: 'large.md', arrayBuffer }),
    ).rejects.toThrow('tooLarge');
    expect(arrayBuffer).not.toHaveBeenCalled();
  });
  it('rejects wrong extensions, malformed UTF-8 and binary content', async () => {
    const data = (): Promise<ArrayBuffer> => Promise.resolve(new Uint8Array([0xff, 0xff]).buffer);
    await expect(
      readSourceFile({ size: 2, name: 'binary.pdf', arrayBuffer: data }),
    ).rejects.toThrow('invalidFile');
    await expect(readSourceFile({ size: 2, name: 'wrong.txt', arrayBuffer: data })).rejects.toThrow(
      'invalidFile',
    );
    expect(() => {
      checkSourceText('hello\u0000world');
    }).toThrow('invalidFile');
  });
  it('preserves the imported UTF-8 original text exactly', async () => {
    const text = '# Überblick\r\n\r\nText mit Umlauten.\n';
    const bytes = new TextEncoder().encode(text);
    await expect(
      readSourceFile({
        size: bytes.byteLength,
        name: 'quelle.MD',
        arrayBuffer: () => Promise.resolve(bytes.buffer),
      }),
    ).resolves.toBe(text);
  });
});
