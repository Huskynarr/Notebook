#!/usr/bin/env node
/**
 * Groesse des gebauten Frontends als Markdown-Tabelle (roh und gzip), fuer
 * die Zusammenfassung des CI-Laufs und den Kommentar am Pull Request.
 * Keine Abhaengigkeiten; liest apps/web/dist.
 *
 *   node tools/bundle-size.mjs [dist-verzeichnis]
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

const wurzel = process.argv[2] ?? 'apps/web/dist';

function dateien(ordner) {
  return readdirSync(ordner).flatMap((name) => {
    const pfad = join(ordner, name);
    return statSync(pfad).isDirectory() ? dateien(pfad) : [pfad];
  });
}

function kb(bytes) {
  return `${(bytes / 1024).toFixed(1)} kB`;
}

const zeilen = dateien(wurzel)
  .filter((p) => /\.(js|css|html)$/.test(p))
  .map((p) => {
    const inhalt = readFileSync(p);
    return { pfad: relative(wurzel, p), roh: inhalt.length, gzip: gzipSync(inhalt).length };
  })
  .sort((a, b) => b.roh - a.roh);

const summe = zeilen.reduce((s, z) => ({ roh: s.roh + z.roh, gzip: s.gzip + z.gzip }), {
  roh: 0,
  gzip: 0,
});

const ausgabe = [
  '| Datei | roh | gzip |',
  '|---|---:|---:|',
  ...zeilen.map((z) => `| \`${z.pfad}\` | ${kb(z.roh)} | ${kb(z.gzip)} |`),
  `| **Summe (JS, CSS, HTML)** | **${kb(summe.roh)}** | **${kb(summe.gzip)}** |`,
  '',
  'Schriften (woff/woff2) sind nicht enthalten; sie laden nur fuer die genutzte Schrift und Sprache.',
].join('\n');

process.stdout.write(`${ausgabe}\n`);
