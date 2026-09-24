import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * AGENTS.md Regel 4. Alles, was mit VITE_ beginnt, steht im Klartext im
 * ausgelieferten JavaScript. Dieser Test darf nicht deaktiviert werden.
 *
 * Er prueft zwei Ebenen:
 *   1. den Quelltext - dort darf nur eine einzige VITE_-Variable vorkommen;
 *   2. das gebaute Bundle, verpflichtend - dort darf kein Geheimnismuster
 *      auftauchen. Ohne Build schlägt Teil 2 fehl; pnpm test und CI bauen zuvor.
 */

const WEB_ROOT = new URL('../..', import.meta.url).pathname;
const SRC = join(WEB_ROOT, 'src');
const DIST = join(WEB_ROOT, 'dist');

/** Erlaubt sind nur Werte, die im ausgelieferten JavaScript stehen duerfen:
 *  die Adresse des Backends und der Schalter fuer die Ausgabe ohne Backend.
 *  Kein Schluessel, kein Token, kein Passwort. */
const ALLOWED_ENV_KEYS = new Set(['VITE_API_BASE_URL', 'VITE_DEMO']);

function walk(dir: string, match: (name: string) => boolean): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full, match));
    else if (match(entry)) out.push(full);
  }
  return out;
}

describe('Keine Geheimnisse im Frontend', () => {
  it('verwendet im Quelltext ausschließlich die erlaubte Umgebungsvariable', () => {
    const found = new Set<string>();
    for (const file of walk(SRC, (n) => /\.(ts|tsx)$/.test(n))) {
      for (const match of readFileSync(file, 'utf8').matchAll(/VITE_[A-Z0-9_]+/g)) {
        found.add(match[0]);
      }
    }
    // Der Test selbst nennt die erlaubten Namen und darf sie nicht melden.
    for (const erlaubt of ALLOWED_ENV_KEYS) found.delete(erlaubt);
    expect([...found]).toEqual([]);
  });

  it('nennt im Quelltext kein Passwort und keinen Schlüssel als Wert', () => {
    const forbidden = [
      /\b(?:api[_-]?key|apikey|secret|private[_-]?key)\s*[:=]\s*['"][^'"]{8,}['"]/i,
      /\bsk-[A-Za-z0-9]{16,}\b/,
      /\bBearer\s+[A-Za-z0-9._-]{20,}\b/,
    ];
    const offenders: string[] = [];
    for (const file of walk(SRC, (n) => /\.(ts|tsx)$/.test(n))) {
      if (file.endsWith('no-secrets.test.ts')) continue;
      const content = readFileSync(file, 'utf8');
      for (const pattern of forbidden) {
        if (pattern.test(content)) offenders.push(`${file}: ${pattern.source}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('enthält im gebauten Bundle kein Geheimnismuster', () => {
    expect(
      existsSync(DIST),
      'apps/web/dist fehlt: Bundle-Prüfung ist verpflichtend. Zuerst Frontend bauen.',
    ).toBe(true);
    const bundles = walk(DIST, (n) => n.endsWith('.js'));
    expect(bundles.length).toBeGreaterThan(0);
    const offenders: string[] = [];
    for (const file of bundles) {
      const content = readFileSync(file, 'utf8');
      for (const pattern of [
        /\bsk-[A-Za-z0-9]{16,}\b/,
        /LLM_API_KEY/,
        /AUTH_PASSWORD/,
        /AUTH_ADDITIONAL_USERS/,
        /AUTH_SECRET/,
      ]) {
        if (pattern.test(content)) offenders.push(`${file}: ${pattern.source}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
