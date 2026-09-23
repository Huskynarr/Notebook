import type { ZodType } from 'zod';
import { MAX_SOURCE_BYTES, type ApiError } from '@notebook/shared';
import type { Cooldown } from './auth.ts';

const encoder = new TextEncoder();
type ErrorCode = ApiError['error']['code'];
export class ApiFailure extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly cooldown: Cooldown | undefined;
  constructor(status: number, code: ErrorCode, message: string, cooldown?: Cooldown) {
    super(message);
    this.status = status;
    this.code = code;
    this.cooldown = cooldown;
  }
}

export function json(data: unknown, status = 200, extra?: HeadersInit): Response {
  const headers = new Headers(extra);
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('cache-control', 'no-store');
  headers.set('x-content-type-options', 'nosniff');
  headers.set('referrer-policy', 'no-referrer');
  return new Response(JSON.stringify(data), { status, headers });
}
export function errorResponse(error: ApiFailure): Response {
  const headers: Record<string, string> = {};
  if (error.cooldown) headers['Retry-After'] = String(error.cooldown.retryAfterSeconds);
  return json(
    { error: { code: error.code, message: error.message, ...error.cooldown } },
    error.status,
    headers,
  );
}
export function missing(what: string): never {
  throw new ApiFailure(404, 'not_found', `${what} nicht gefunden.`);
}
export function limited(cooldown: Cooldown): never {
  throw new ApiFailure(
    429,
    'rate_limited',
    'Zu viele Anfragen. Bitte die Wartezeit abwarten.',
    cooldown,
  );
}
export async function body<T>(request: Request, schema: ZodType<T>, limit = 1_048_576): Promise<T> {
  if (Number(request.headers.get('content-length') ?? 0) > limit)
    throw new ApiFailure(413, 'payload_too_large', 'Die Anfrage ist zu groß.');
  const reader = request.body?.getReader();
  if (!reader) throw new ApiFailure(400, 'validation_failed', 'Die Anfrage enthält keine Daten.');
  const chunks: Uint8Array[] = [];
  let length = 0;
  for (;;) {
    const part = await reader.read();
    if (part.done) break;
    length += part.value.byteLength;
    if (length > limit) {
      await reader.cancel();
      throw new ApiFailure(413, 'payload_too_large', 'Die Anfrage ist zu groß.');
    }
    chunks.push(part.value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let candidate: unknown;
  try {
    candidate = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as unknown;
  } catch {
    throw new ApiFailure(400, 'validation_failed', 'Ungültiges JSON oder UTF-8.');
  }
  if (
    typeof candidate === 'object' &&
    candidate !== null &&
    'content' in candidate &&
    typeof candidate.content === 'string' &&
    encoder.encode(candidate.content).byteLength > MAX_SOURCE_BYTES
  ) {
    throw new ApiFailure(
      413,
      'payload_too_large',
      'Eine Quelle darf höchstens 10 MiB UTF-8-Text enthalten.',
    );
  }
  const result = schema.safeParse(candidate);
  if (!result.success)
    throw new ApiFailure(
      400,
      'validation_failed',
      result.error.issues.map((item) => `${item.path.join('.')}: ${item.message}`).join('; '),
    );
  return result.data;
}
