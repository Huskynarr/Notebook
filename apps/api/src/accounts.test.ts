import { describe, expect, it } from 'vitest';
import { Auth } from './auth.ts';
import { loadConfig } from './config.ts';

const env = {
  AUTH_SECRET: 'accounts-fixture-secret-at-least-32-characters',
  AUTH_ADDITIONAL_USERS: JSON.stringify([
    { username: 'Everlast', password: 'second-fixture-password' },
  ]),
};

describe('Konfigurierte Zugänge', () => {
  it('benennt den Standardzugang um und hält beide Passwörter getrennt', () => {
    const auth = new Auth(loadConfig(env));
    for (const [username, password] of [
      ['Huskynarr', 'admin'],
      ['Everlast', 'second-fixture-password'],
    ]) {
      const session = auth.login(username ?? '', password ?? '');
      expect(session).not.toBeNull();
      expect(auth.verify(session?.token)).toBe(true);
      expect(Buffer.from(session?.token.split('.')[0] ?? '', 'base64url').toString()).toMatch(
        new RegExp(`^${username ?? ''}\\.`),
      );
    }
    expect(auth.login('admin', 'admin')).toBeNull();
    expect(auth.login('Everlast', 'admin')).toBeNull();
    expect(auth.login('Huskynarr', 'second-fixture-password')).toBeNull();
    expect(auth.login('Huskynar', 'admin')).toBeNull();
    expect(auth.login('everlabs', 'second-fixture-password')).toBeNull();
    expect(auth.login('huskynar', 'admin')).toBeNull();
  });

  it('verwirft manipulierte und entfernte Benutzer trotz gleichem Signaturgeheimnis', () => {
    const auth = new Auth(loadConfig(env));
    const token = auth.login('Everlast', 'second-fixture-password')?.token ?? '';
    const [encoded, signature] = token.split('.');
    const payload = Buffer.from(encoded ?? '', 'base64url')
      .toString()
      .replace('Everlast', 'Huskynarr');
    expect(auth.verify(`${Buffer.from(payload).toString('base64url')}.${signature ?? ''}`)).toBe(
      false,
    );
    expect(new Auth(loadConfig({ AUTH_SECRET: env.AUTH_SECRET })).verify(token)).toBe(false);
  });

  it.each([
    '{malformed secret-fixture-value',
    '{}',
    JSON.stringify([{ username: '', password: 'secret-fixture-value' }]),
    JSON.stringify([{ username: 'Everlast', password: '' }]),
    JSON.stringify([{ username: 'Huskynarr', password: 'secret-fixture-value' }]),
    JSON.stringify(
      Array.from({ length: 11 }, (_, i) => ({
        username: `user${i}`,
        password: 'secret-fixture-value',
      })),
    ),
    JSON.stringify([
      { username: 'Everlast', password: 'secret-fixture-value' },
      { username: 'Everlast', password: 'other-fixture-value' },
    ]),
  ])('weist ungültige Konfiguration ohne Passwortausgabe ab (%#)', (value) => {
    expect(() => loadConfig({ ...env, AUTH_ADDITIONAL_USERS: value })).toThrow(
      'AUTH_ADDITIONAL_USERS',
    );
    try {
      loadConfig({ ...env, AUTH_ADDITIONAL_USERS: value });
    } catch (error) {
      expect(String(error)).not.toContain('secret-fixture-value');
    }
  });

  it('prüft Produktionspasswörter auch bei zusätzlichen Nutzern', () => {
    const production = {
      ...env,
      NODE_ENV: 'production',
      AUTH_PASSWORD: 'primary-fixture-password',
    };
    expect(() => loadConfig(production)).not.toThrow();
    expect(() =>
      loadConfig({
        ...production,
        AUTH_ADDITIONAL_USERS: JSON.stringify([{ username: 'Everlast', password: 'short' }]),
      }),
    ).toThrow('AUTH_ADDITIONAL_USERS');
  });
});
