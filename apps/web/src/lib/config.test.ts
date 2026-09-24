import { describe, expect, it } from 'vitest';
import { apiBaseUrl } from './config.ts';

describe('backend address configuration', () => {
  it('uses localhost only for missing configuration', () => {
    expect(apiBaseUrl(undefined)).toBe('http://localhost:8787');
  });
  it('preserves explicitly empty same-origin configuration', () => {
    expect(apiBaseUrl('')).toBe('');
    expect(apiBaseUrl('   ')).toBe('');
  });
  it('supports independent remote API hosts and path prefixes', () => {
    expect(apiBaseUrl(' https://api.example.org/service/ ')).toBe(
      'https://api.example.org/service',
    );
  });
});
