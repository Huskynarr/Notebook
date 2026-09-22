import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Config } from './config.ts';

/**
 * Einfachster tragfaehiger Zugang (D-003): ein festes Paar aus Benutzername und
 * Passwort, danach ein signiertes Token. Keine Nutzertabelle, keine Rollen.
 *
 * Bewusst ohne Bibliothek: ein HMAC ueber Nutzdaten und Ablaufzeit ist genau
 * das, was hier gebraucht wird - eine JWT-Bibliothek waere Infrastruktur ohne
 * zusaetzliche Anforderung (AGENTS.md Regel 7).
 */
export class Auth {
  private readonly config: Config;
  private readonly secret: string;
  private readonly ttlMs: number;

  constructor(config: Config) {
    this.config = config;
    this.secret = config.AUTH_SECRET ?? randomBytes(32).toString('hex');
    this.ttlMs = config.AUTH_TOKEN_TTL_HOURS * 60 * 60 * 1000;
  }

  /** true, wenn `AUTH_SECRET` nicht gesetzt ist - Sitzungen enden dann beim
   *  Neustart des Servers. Wird beim Start protokolliert. */
  get secretIsEphemeral(): boolean {
    return this.config.AUTH_SECRET === undefined;
  }

  login(username: string, password: string): { token: string; expiresAt: string } | null {
    const userOk = safeEquals(username, this.config.AUTH_USERNAME);
    const passOk = safeEquals(password, this.config.AUTH_PASSWORD);
    // Beide Vergleiche laufen immer, damit die Antwortzeit nicht verraet,
    // welcher der beiden Werte falsch war.
    if (!userOk || !passOk) return null;

    const expiresAtMs = Date.now() + this.ttlMs;
    const payload = `${this.config.AUTH_USERNAME}.${expiresAtMs}`;
    const token = `${Buffer.from(payload).toString('base64url')}.${this.sign(payload)}`;
    return { token, expiresAt: new Date(expiresAtMs).toISOString() };
  }

  verify(token: string | undefined): boolean {
    if (token === undefined || token === '' || token.length > 4096) return false;
    const parts = token.split('.');
    const [encoded, signature] = parts;
    if (parts.length !== 2 || encoded === undefined || signature === undefined) return false;
    if (!/^[A-Za-z0-9_-]+$/.test(encoded) || !/^[A-Za-z0-9_-]{43}$/.test(signature)) return false;

    let payload: string;
    try {
      payload = Buffer.from(encoded, 'base64url').toString('utf8');
    } catch {
      return false;
    }
    if (!safeEquals(signature, this.sign(payload))) return false;

    const separator = payload.lastIndexOf('.');
    if (payload.slice(0, separator) !== this.config.AUTH_USERNAME) return false;
    const expiry = payload.slice(separator + 1);
    if (!/^\d+$/.test(expiry)) return false;
    const expiresAtMs = Number(expiry);
    return Number.isSafeInteger(expiresAtMs) && expiresAtMs > Date.now();
  }

  private sign(payload: string): string {
    return createHmac('sha256', this.secret).update(payload).digest('base64url');
  }
}

/** Laufzeitkonstanter Vergleich, damit ein Passwort nicht Zeichen fuer Zeichen
 *  erraten werden kann. */
function safeEquals(a: string, b: string): boolean {
  const bufferA = createHash('sha256').update(a).digest();
  const bufferB = createHash('sha256').update(b).digest();
  return timingSafeEqual(bufferA, bufferB);
}

export function bearerToken(header: string | undefined): string | undefined {
  if (header === undefined) return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1];
}
