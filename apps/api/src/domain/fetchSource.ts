import { isIP } from 'node:net';
import { lookup } from 'node:dns/promises';
import { ausAntwort, titelAusAdresse, type Extrahiert } from './extract.ts';

/**
 * Holt eine Adresse fuer eine neue Quelle.
 *
 * Der Server ruft fremde Adressen im Auftrag eines angemeldeten Nutzers ab -
 * das ist die klassische SSRF-Angriffsflaeche. Deshalb: nur http(s), keine
 * privaten oder lokalen Ziele (auch nicht nach DNS-Aufloesung), begrenzte
 * Groesse, begrenzte Zeit, hoechstens drei Weiterleitungen, die jeweils neu
 * geprueft werden.
 */

export class AbrufFehler extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AbrufFehler';
  }
}

const MAX_BYTES = 2 * 1024 * 1024;
const TIMEOUT_MS = 15_000;
const MAX_WEITERLEITUNGEN = 3;

function istPrivateAdresse(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split('.').map(Number);
    if (a === undefined || b === undefined) return true;
    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) ||
      (a === 100 && b >= 64 && b <= 127)
    );
  }
  const klein = ip.toLowerCase();
  return (
    klein === '::1' ||
    klein === '::' ||
    klein.startsWith('fc') ||
    klein.startsWith('fd') ||
    klein.startsWith('fe80') ||
    klein.startsWith('::ffff:')
  );
}

async function zielPruefen(url: URL): Promise<void> {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new AbrufFehler('Nur http:// und https:// werden abgerufen.');
  }
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) {
    throw new AbrufFehler('Lokale Adressen werden nicht abgerufen.');
  }
  const adressen = isIP(host) ? [host] : (await lookup(host, { all: true })).map((a) => a.address);
  if (adressen.length === 0) throw new AbrufFehler('Die Adresse lässt sich nicht auflösen.');
  if (adressen.some(istPrivateAdresse)) {
    throw new AbrufFehler('Die Adresse zeigt auf ein privates Netz und wird nicht abgerufen.');
  }
}

export async function quelleAbrufen(adresse: string): Promise<Extrahiert & { origin: string }> {
  let url: URL;
  try {
    url = new URL(adresse);
  } catch {
    throw new AbrufFehler('Das ist keine gültige Adresse.');
  }

  for (let schritt = 0; schritt <= MAX_WEITERLEITUNGEN; schritt += 1) {
    await zielPruefen(url);
    const abbruch = new AbortController();
    const timer = setTimeout(() => {
      abbruch.abort();
    }, TIMEOUT_MS);
    let antwort: Response;
    try {
      antwort = await fetch(url, {
        redirect: 'manual',
        signal: abbruch.signal,
        headers: {
          accept: 'text/html, text/markdown, text/plain, application/json;q=0.9, */*;q=0.1',
          'user-agent': 'Notebook/0.1 (+source import)',
        },
      });
    } catch (fehler) {
      clearTimeout(timer);
      if (fehler instanceof Error && fehler.name === 'AbortError') {
        throw new AbrufFehler(
          `Die Adresse hat nicht innerhalb von ${TIMEOUT_MS / 1000} Sekunden geantwortet.`,
        );
      }
      throw new AbrufFehler('Die Adresse ist nicht erreichbar.');
    }
    clearTimeout(timer);

    if (antwort.status >= 300 && antwort.status < 400) {
      const ziel = antwort.headers.get('location');
      if (ziel === null) throw new AbrufFehler('Weiterleitung ohne Ziel.');
      url = new URL(ziel, url);
      continue;
    }
    if (!antwort.ok) throw new AbrufFehler(`Die Adresse antwortete mit HTTP ${antwort.status}.`);

    const laenge = Number(antwort.headers.get('content-length') ?? 0);
    if (laenge > MAX_BYTES) throw new AbrufFehler('Die Seite ist größer als 2 MB.');
    const puffer = await antwort.arrayBuffer();
    if (puffer.byteLength > MAX_BYTES) throw new AbrufFehler('Die Seite ist größer als 2 MB.');

    const text = new TextDecoder('utf-8').decode(puffer);
    const extrahiert = ausAntwort(
      antwort.headers.get('content-type') ?? '',
      text,
      titelAusAdresse(url),
    );
    if (extrahiert.content.trim() === '')
      throw new AbrufFehler('Die Seite enthält keinen lesbaren Text.');
    return { ...extrahiert, origin: url.toString() };
  }
  throw new AbrufFehler('Zu viele Weiterleitungen.');
}

export { istPrivateAdresse };
