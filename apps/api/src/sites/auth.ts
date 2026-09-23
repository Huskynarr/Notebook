import { z } from 'zod';
import type { Database, SiteEnv } from './db.ts';

const Accounts = z
  .array(z.object({ username: z.string().min(1), password: z.string().min(16) }))
  .max(10);
const encoder = new TextEncoder();
const DAY = 86_400_000;

export interface Account {
  username: string;
  password: string;
}

/** Secrets are mandatory in the hosted runtime; no publicly known demo fallback. */
export function accounts(env: SiteEnv): Account[] {
  if (
    !env.AUTH_USERNAME ||
    !env.AUTH_PASSWORD ||
    env.AUTH_PASSWORD.length < 16 ||
    !env.AUTH_SECRET ||
    env.AUTH_SECRET.length < 32
  )
    throw new Error('Sites auth secrets missing');
  const additional = Accounts.parse(JSON.parse(env.AUTH_ADDITIONAL_USERS ?? '[]') as unknown);
  const all = [{ username: env.AUTH_USERNAME, password: env.AUTH_PASSWORD }, ...additional];
  if (new Set(all.map((a) => a.username)).size !== all.length)
    throw new Error('Duplicate accounts');
  return all;
}

async function digest(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
}

async function equal(a: string, b: string): Promise<boolean> {
  const [first, second] = await Promise.all([digest(a), digest(b)]);
  let diff = 0;
  for (let i = 0; i < first.length; i++) diff |= (first[i] ?? 0) ^ (second[i] ?? 0);
  return diff === 0;
}

function b64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function unb64(text: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(text) || text.length > 4096) return null;
  try {
    const decoded = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(decoded, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

async function key(env: SiteEnv): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(env.AUTH_SECRET ?? ''),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function login(
  env: SiteEnv,
  username: string,
  password: string,
): Promise<{ token: string; expiresAt: string } | null> {
  let matched: string | null = null;
  for (const account of accounts(env)) {
    const [u, p] = await Promise.all([
      equal(username, account.username),
      equal(password, account.password),
    ]);
    if (u && p) matched = account.username;
  }
  if (matched === null) return null;
  const expiresAtMs = Date.now() + 12 * 60 * 60 * 1000;
  const payload = b64(encoder.encode(JSON.stringify({ u: matched, e: expiresAtMs })));
  const signature = b64(
    new Uint8Array(await crypto.subtle.sign('HMAC', await key(env), encoder.encode(payload))),
  );
  return { token: `${payload}.${signature}`, expiresAt: new Date(expiresAtMs).toISOString() };
}

export async function verify(env: SiteEnv, authorization: string | null): Promise<string | null> {
  const match = /^Bearer\s+(\S+)$/i.exec(authorization ?? '');
  const parts = match?.[1]?.split('.');
  if (parts?.length !== 2) return null;
  const payload = parts[0],
    signature = parts[1];
  if (!payload || !signature || signature.length !== 43) return null;
  const decoded = unb64(payload),
    sig = unb64(signature);
  if (
    !decoded ||
    !sig ||
    !(await crypto.subtle.verify(
      'HMAC',
      await key(env),
      new Uint8Array(sig),
      encoder.encode(payload),
    ))
  )
    return null;
  try {
    const parsed = z
      .object({ u: z.string(), e: z.number().int() })
      .safeParse(JSON.parse(new TextDecoder().decode(decoded)) as unknown);
    return parsed.success &&
      parsed.data.e > Date.now() &&
      accounts(env).some((a) => a.username === parsed.data.u)
      ? parsed.data.u
      : null;
  } catch {
    return null;
  }
}

async function bucket(value: string): Promise<string> {
  return b64(await digest(value));
}

export interface Cooldown {
  retryAfterSeconds: number;
  retryAt: string;
}
const delay = (failures: number): number =>
  failures < 3 ? 0 : Math.min(30 * 2 ** Math.min(failures - 3, 12), 900);

export async function loginBuckets(ip: string, username: string | null): Promise<string[]> {
  return [
    username === null ? 'account:unknown' : `account:${await bucket(username)}`,
    `ip:${await bucket(ip)}`,
  ];
}

export async function checkLogin(
  db: Database,
  buckets: string[],
  at = Date.now(),
): Promise<Cooldown | null> {
  const rows = await db
    .prepare(
      `SELECT MAX(blocked_until) AS blocked FROM login_attempts
    WHERE bucket IN (?,?) AND last_failure>=?`,
    )
    .bind(buckets[0] ?? '', buckets[1] ?? '', at - DAY)
    .first();
  const blocked = Number((rows as { blocked?: unknown } | null)?.blocked ?? 0);
  return blocked > at
    ? {
        retryAfterSeconds: Math.ceil((blocked - at) / 1000),
        retryAt: new Date(blocked).toISOString(),
      }
    : null;
}

/** Atomic UPSERT prevents parallel edge requests from losing failed attempts. */
export async function failedLogin(
  db: Database,
  buckets: string[],
  at = Date.now(),
): Promise<Cooldown | null> {
  for (const bucket of buckets) {
    await db
      .prepare(
        `INSERT INTO login_attempts(bucket,failures,blocked_until,last_failure)
      VALUES(?,1,0,?) ON CONFLICT(bucket) DO UPDATE SET
      failures=CASE WHEN last_failure < ? THEN 1 ELSE MIN(failures+1,32) END,
      blocked_until=CASE WHEN last_failure < ? THEN 0 ELSE
        ? + MIN(30 * (1 << MIN(MAX(failures-2,0),5)),900) * (failures>=2) * 1000 END,
      last_failure=?`,
      )
      .bind(bucket, at, at - DAY, at - DAY, at, at)
      .run();
  }
  return checkLogin(db, buckets, at);
}

export async function clearLogin(db: Database, buckets: string[]): Promise<void> {
  await db
    .prepare('DELETE FROM login_attempts WHERE bucket IN (?,?)')
    .bind(buckets[0] ?? '', buckets[1] ?? '')
    .run();
}

/** Durable per-account windows replace process-local API and model counters. */
export async function quota(
  db: Database,
  bucket: string,
  windowMs: number,
  limit: number,
  at = Date.now(),
): Promise<Cooldown | null> {
  await db
    .prepare(
      `INSERT INTO api_quota(bucket,used,expires) VALUES(?,1,?)
    ON CONFLICT(bucket) DO UPDATE SET
    used=CASE WHEN expires<=? THEN 1 ELSE used+1 END,
    expires=CASE WHEN expires<=? THEN excluded.expires ELSE expires END`,
    )
    .bind(bucket, at + windowMs, at, at)
    .run();
  const raw = await db
    .prepare('SELECT used,expires FROM api_quota WHERE bucket=?')
    .bind(bucket)
    .first();
  const row = raw === null ? null : z.object({ used: z.number(), expires: z.number() }).parse(raw);
  if (row !== null && row.used > limit)
    return {
      retryAfterSeconds: Math.max(1, Math.ceil((row.expires - at) / 1000)),
      retryAt: new Date(row.expires).toISOString(),
    };
  return null;
}

export const loginDelayForTest = delay;
