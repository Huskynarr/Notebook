import { describe, expect, it } from 'vitest';
import { Auth, bearerToken } from './auth.ts';
import { loadConfig } from './config.ts';

const ENV = {
  AUTH_USERNAME: 'admin',
  AUTH_PASSWORD: 'admin',
  AUTH_SECRET: 'testgeheimnis-mindestens-16-zeichen',
};

const config = loadConfig(ENV);

describe('Auth', () => {
  it('gibt für die richtigen Zugangsdaten ein gueltiges Token aus', () => {
    const auth = new Auth(config);
    const session = auth.login('admin', 'admin');
    expect(session).not.toBeNull();
    expect(auth.verify(session?.token)).toBe(true);
  });

  it('weist falsches Passwort und falschen Benutzernamen ab', () => {
    const auth = new Auth(config);
    expect(auth.login('admin', 'falsch')).toBeNull();
    expect(auth.login('root', 'admin')).toBeNull();
  });

  it('erkennt ein veraendertes Token', () => {
    const auth = new Auth(config);
    const token = auth.login('admin', 'admin')?.token ?? '';
    const [payload, signature] = token.split('.');
    const forged = `${Buffer.from('admin.99999999999999').toString('base64url')}.${signature ?? ''}`;
    expect(auth.verify(forged)).toBe(false);
    expect(auth.verify(`${payload ?? ''}.abc`)).toBe(false);
  });

  it('lehnt ein abgelaufenes Token ab', () => {
    const expired = new Auth(loadConfig({ ...ENV, AUTH_TOKEN_TTL_HOURS: '1' }));
    const token = expired.login('admin', 'admin')?.token ?? '';
    const stale = `${Buffer.from('admin.1').toString('base64url')}.${token.split('.')[1] ?? ''}`;
    expect(expired.verify(stale)).toBe(false);
  });

  it('weist leere und unsinnige Token ab', () => {
    const auth = new Auth(config);
    expect(auth.verify(undefined)).toBe(false);
    expect(auth.verify('')).toBe(false);
    expect(auth.verify('nur-ein-teil')).toBe(false);
  });

  it('kennzeichnet ein fluechtiges Sitzungsgeheimnis', () => {
    expect(new Auth(config).secretIsEphemeral).toBe(false);
    expect(new Auth(loadConfig({})).secretIsEphemeral).toBe(true);
  });
});

describe('bearerToken', () => {
  it('liest das Token aus dem Authorization-Header', () => {
    expect(bearerToken('Bearer abc.def')).toBe('abc.def');
    expect(bearerToken('bearer  abc')).toBe('abc');
    expect(bearerToken('Basic abc')).toBeUndefined();
    expect(bearerToken(undefined)).toBeUndefined();
  });
});
