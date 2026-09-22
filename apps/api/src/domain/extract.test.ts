import { describe, expect, it } from 'vitest';
import { ausAntwort, ausHtml, entitaetenAufloesen } from './extract.ts';

const SEITE = `<!doctype html><html><head><title>Prüfungsordnung &ndash; Fakultät</title>
<style>body{color:red}</style><script>alert(1)</script></head>
<body>
<nav><a href="/">Start</a><a href="/x">Mehr</a></nav>
<header><h1>Kopfzeile, die nicht zählt</h1></header>
<main>
  <h1>Prüfungsordnung</h1>
  <p>Diese Ordnung gilt f&uuml;r alle <b>Modulprüfungen</b>.</p>
  <h2>3 Fristen</h2>
  <p>Die Widerspruchsfrist beträgt vierzehn Tage.<br>Der Widerspruch ist schriftlich einzureichen.</p>
  <ul><li>Name</li><li>Matrikelnummer</li></ul>
</main>
<footer>Impressum &copy; 2026</footer>
</body></html>`;

describe('ausHtml', () => {
  const e = ausHtml(SEITE, 'fallback');

  it('nimmt den Seitentitel und löst Entitäten auf', () => {
    expect(e.title).toBe('Prüfungsordnung – Fakultät');
  });

  it('entfernt Skripte, Stile, Navigation, Kopf- und Fußzeile', () => {
    expect(e.content).not.toContain('alert');
    expect(e.content).not.toContain('color:red');
    expect(e.content).not.toContain('Start');
    expect(e.content).not.toContain('Kopfzeile');
    expect(e.content).not.toContain('Impressum');
  });

  it('macht aus Überschriften Markdown, damit Abschnittspfade entstehen', () => {
    expect(e.content).toContain('# Prüfungsordnung');
    expect(e.content).toContain('## 3 Fristen');
  });

  it('erhält Absätze, Zeilenumbrüche und Listenpunkte', () => {
    expect(e.content).toContain('Diese Ordnung gilt für alle Modulprüfungen.');
    expect(e.content).toMatch(/vierzehn Tage\.\nDer Widerspruch/);
    expect(e.content).toContain('- Name');
    expect(e.content).toContain('- Matrikelnummer');
  });

  it('fällt auf den übergebenen Titel zurück, wenn die Seite keinen hat', () => {
    expect(ausHtml('<p>nur text</p>', 'example.org').title).toBe('example.org');
  });
});

describe('ausAntwort', () => {
  it('rückt JSON ein', () => {
    const e = ausAntwort('application/json', '{"a":1,"b":[1,2]}', 'api');
    expect(e.content).toBe('{\n  "a": 1,\n  "b": [\n    1,\n    2\n  ]\n}');
    expect(e.kind).toBe('text');
  });
  it('erkennt HTML auch ohne passenden Content-Type', () => {
    expect(ausAntwort('text/plain', '<!doctype html><title>x</title><p>y</p>', 'f').content).toBe(
      'y',
    );
  });
  it('übernimmt Markdown unverändert', () => {
    const e = ausAntwort('text/markdown', '# Hallo\n\nText', 'f');
    expect(e.kind).toBe('markdown');
    expect(e.content).toBe('# Hallo\n\nText');
  });
});

describe('entitaetenAufloesen', () => {
  it('kennt benannte, dezimale und hexadezimale Entitäten', () => {
    expect(entitaetenAufloesen('&auml; &#252; &#x1F600; &amp; &unbekannt;')).toBe(
      'ä ü 😀 & &unbekannt;',
    );
  });
});
