# Öffentliche Auffindbarkeit und Linkvorschau

Nur die öffentliche Startseite ist für Suchmaschinen bestimmt. `apps/web/index.html`
enthält den HTML-Einstieg samt Seitentitel, Beschreibung, Canonical, Open-Graph-
und X-Metadaten. Bei einem Shared-Link ist `apps/web/public/og.png` die
statische Everlast-Vorschau. Sie zeigt eine **Illustration**, keine
Modellantwort oder tatsächliche Quelle. Der `WebSite`-JSON-LD-Eintrag nennt
lediglich den sichtbaren Produktnamen und die öffentliche URL; er enthält
weder Bewertungen noch Preisangaben.

`robots.txt` und `sitemap.xml` listen nur die öffentliche Domain. Der
geschützte Arbeitsbereich wird nicht vorgerendert; der Zugang bleibt auch bei
Suchmaschinenaufrufen serverseitig geschützt. Eine geänderte Domain erfordert
eine gemeinsame Anpassung von Canonical, Sitemap, OG-/X-Bild-URL und JSON-LD.
Texte in der statischen Kurzfassung und in `LandingPage.tsx` müssen dieselben
tatsächlichen Fähigkeiten und Grenzen beschreiben.

Vor Veröffentlichung prüfen:

1. `pnpm verify` baut `dist/og.png` und prüft Metadaten, Bildformat und Maße.
2. `pnpm test:e2e` prüft den öffentlichen Einstieg im HTML ohne JavaScript.
3. Nach Deployment `https://notebook.sebastianselinger.de/og.png` direkt
   abrufen; Such- und Social-Caches können eine alte Vorschau behalten.

Grundlagen: [Google Site Names](https://developers.google.com/search/docs/appearance/site-names),
[Google AI Features](https://developers.google.com/search/docs/appearance/ai-features)
und [Open Graph](https://ogp.me/). Eine spezielle GEO-Datei oder garantierte
Anzeige in Suchergebnissen lässt sich daraus nicht ableiten.
