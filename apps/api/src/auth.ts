import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
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
    if (token === undefined || token === '') return false;
    const [encoded, signature] = token.split('.');
    if (encoded === undefined || signature === undefined) return false;

    let payload: string;
    try {
      payload = Buffer.from(encoded, 'base64url').toString('utf8');
    } catch {
      return false;
    }
    if (!safeEquals(signature, this.sign(payload))) return false;

    const expiresAtMs = Number.parseInt(payload.slice(payload.lastIndexOf('.') + 1), 10);
    return Number.isFinite(expiresAtMs) && expiresAtMs > Date.now();
  }

  private sign(payload: string): string {
    return createHmac('sha256', this.secret).update(payload).digest('base64url');
  }
}

/** Laufzeitkonstanter Vergleich, damit ein Passwort nicht Zeichen fuer Zeichen
 *  erraten werden kann. */
function safeEquals(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) {
    // Trotzdem vergleichen, damit die Dauer nicht von der Laenge abhaengt.
    timingSafeEqual(bufferA, bufferA);
    return false;
  }
  return timingSafeEqual(bufferA, bufferB);
}

export function bearerToken(header: string | undefined): string | undefined {
  if (header === undefined) return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1];
}
