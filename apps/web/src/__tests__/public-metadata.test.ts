import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const cardUrl = 'https://notebook.sebastianselinger.de/og.png';

function meta(key: string): string | undefined {
  const tag = html.match(new RegExp(`<meta\\s+(?:name|property)="${key}"[\\s\\S]*?\\/>`));
  return tag?.[0].match(/content="([^"]+)"/)?.[1];
}

describe('Öffentliche Such- und Linkvorschau', () => {
  it('zeigt die öffentliche Seite und denselben Bildlink für Open Graph und X', () => {
    expect(html).toContain('rel="canonical" href="https://notebook.sebastianselinger.de/"');
    expect(meta('description')).toContain('Belegstellen im Original prüfen');
    expect(meta('og:url')).toBe('https://notebook.sebastianselinger.de/');
    expect(meta('og:image')).toBe(cardUrl);
    expect(meta('twitter:image')).toBe(cardUrl);
    expect(meta('twitter:card')).toBe('summary_large_image');
    expect(meta('og:image:alt')).toContain('hervorgehobenen Belegverbindung');
    expect(meta('twitter:image:alt')).toBe(meta('og:image:alt'));
    const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
    const website: unknown = JSON.parse(jsonLd ?? 'null');
    expect(website).toMatchObject({
      '@type': 'WebSite',
      name: 'notebook.',
      url: 'https://notebook.sebastianselinger.de/',
    });
  });

  it('liefert eine tatsächlich gebaute, ausreichend große PNG-Vorschau', () => {
    const source = readFileSync(new URL('../../public/og.png', import.meta.url));
    const built = readFileSync(new URL('../../dist/og.png', import.meta.url));
    expect(source.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(source.readUInt32BE(16)).toBe(1728);
    expect(source.readUInt32BE(20)).toBe(910);
    expect(source.byteLength).toBeLessThan(5_000_000);
    expect(built.equals(source)).toBe(true);
  });
});
