/**
 * Text aus einer abgerufenen Adresse gewinnen - ohne Abhaengigkeit.
 *
 * HTML wird in einen Markdown-aehnlichen Text ueberfuehrt: Ueberschriften
 * bleiben als #-Zeilen erhalten (damit chunkText Abschnittspfade bilden kann),
 * Skripte, Stile, Navigation, Kopf- und Fusszeilen entfallen. Das ist kein
 * Readability-Algorithmus: Seiten mit viel Seitenleiste liefern mehr Rauschen
 * als noetig. Dafuer ist das Verhalten vorhersagbar und in extract.test.ts
 * nachlesbar.
 *
 * JSON wird eingerueckt ausgegeben, reiner Text unveraendert uebernommen.
 */

const ENTITAETEN: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  auml: 'ä',
  ouml: 'ö',
  uuml: 'ü',
  Auml: 'Ä',
  Ouml: 'Ö',
  Uuml: 'Ü',
  szlig: 'ß',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  laquo: '«',
  raquo: '»',
  bdquo: '„',
  ldquo: '“',
  rdquo: '”',
};

export function entitaetenAufloesen(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dez: string) => String.fromCodePoint(Number.parseInt(dez, 10)))
    .replace(/&([a-zA-Z]+);/g, (ganz, name: string) => ENTITAETEN[name] ?? ganz);
}

export interface Extrahiert {
  readonly title: string;
  readonly content: string;
  readonly kind: 'markdown' | 'text';
}

export function ausHtml(html: string, fallbackTitel: string): Extrahiert {
  const titelTreffer = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  const title =
    entitaetenAufloesen(titelTreffer?.[1] ?? '')
      .replace(/\s+/g, ' ')
      .trim() || fallbackTitel;

  let s = html;
  // Ganze Bloecke, die nie Inhalt sind.
  for (const tag of [
    'script',
    'style',
    'noscript',
    'template',
    'svg',
    'iframe',
    'nav',
    'header',
    'footer',
    'aside',
    'form',
  ]) {
    s = s.replace(new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}\\s*>`, 'gi'), '\n');
  }
  s = s.replace(/<!--[\s\S]*?-->/g, '');
  s = s.replace(/<head\b[\s\S]*?<\/head\s*>/gi, '');
  s = s.replace(/<title\b[\s\S]*?<\/title\s*>/gi, '');
  // Nur den Rumpf, falls vorhanden.
  const rumpf = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(s);
  if (rumpf?.[1] !== undefined) s = rumpf[1];

  // Ueberschriften -> Markdown, damit Abschnittspfade entstehen.
  s = s.replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1\s*>/gi, (_, ebene: string, inhalt: string) => {
    const text = inhalt
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text === '' ? '\n' : `\n\n${'#'.repeat(Number(ebene))} ${text}\n\n`;
  });
  // Listenpunkte und Blockgrenzen.
  s = s.replace(/<li\b[^>]*>/gi, '\n- ');
  s = s.replace(
    /<\/(p|div|li|tr|section|article|blockquote|pre|ul|ol|table|dd|dt|figure|figcaption)\s*>/gi,
    '\n\n',
  );
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<(td|th)\b[^>]*>/gi, ' ');
  // Rest der Tags entfernen.
  s = s.replace(/<[^>]+>/g, '');
  s = entitaetenAufloesen(s);

  const content = s
    .split('\n')
    .map((z) => z.replace(/[ \t\u00a0]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { title, content, kind: 'markdown' };
}

export function ausJson(text: string, fallbackTitel: string): Extrahiert {
  let content: string;
  try {
    content = JSON.stringify(JSON.parse(text) as unknown, null, 2);
  } catch {
    content = text;
  }
  return { title: fallbackTitel, content, kind: 'text' };
}

export function ausAntwort(contentType: string, text: string, fallbackTitel: string): Extrahiert {
  const typ = contentType.toLowerCase();
  if (typ.includes('html') || /^\s*<(!doctype|html)/i.test(text))
    return ausHtml(text, fallbackTitel);
  if (typ.includes('json')) return ausJson(text, fallbackTitel);
  return {
    title: fallbackTitel,
    content: text.trim(),
    kind: typ.includes('markdown') ? 'markdown' : 'text',
  };
}

/** Titel aus der Adresse, wenn die Seite keinen liefert. */
export function titelAusAdresse(url: URL): string {
  const letzter = url.pathname.split('/').filter(Boolean).pop();
  return letzter === undefined || letzter === ''
    ? url.hostname
    : `${url.hostname} · ${decodeURIComponent(letzter)}`;
}
