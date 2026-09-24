# Architektur und Begründungen

Stand: 24.09.2026. Diese Seite ist die Einstiegskarte zum vollständigen Code. Sie
erklärt Entscheidungen und Grenzen; API-Verträge und konkrete Einrichtung stehen
in [README](../README.md), [Produktdefinition](product.md) und [Betrieb](deployment.md).

## Warum diese Aufteilung?

| Ort | Verantwortung | Grund |
|---|---|---|
| `packages/shared/src` | Zod-Verträge, Typen, Chunker und Beispiel | Browser, Fastify und Worker müssen dieselben Eingaben und Originalpositionen verstehen. Keine Server-Secrets hier. |
| `apps/web/src` | Öffentliche Landingpage, Anmeldung, Notebook-UI, Design-Tokens | Der Browser stellt Quellen und Belege dar, entscheidet aber weder über Zugriffsrechte noch über gültige Zitate. |
| `apps/api/src/routes`, `domain`, `db`, `llm` | Fastify-HTTP, quellenbasierter Ablauf, SQLite, Modelladapter | Lokal und auf Plesk reicht ein Prozess mit SQLite; Authentifizierung und Modellzugang bleiben serverseitig. |
| `apps/api/src/sites` | Worker-HTTP, D1/R2-Zugriff, begrenzter Modelladapter | Sites erfordert andere Laufzeit und Speicher-APIs. Vertragslogik und Chunker werden wiederverwendet; identische Infrastruktur wird nicht vorgetäuscht. |
| `drizzle/0000_sites.sql`, `apps/api/src/db/schema.sql` | Getrennte Schemata mit vergleichbarem Suchvertrag | D1/SQLite nutzen FTS5; der Worker bewahrt Originaltexte in R2 auf, Fastify in SQLite. |
| `e2e`, `tools`, `.github/workflows` | Browserablauf, Builds, Hooks und CI | Die kritische Kette Login → Quelle → Frage → Originalbeleg braucht mehr als isolierte Funktionstests. |

## Wo liegen die Vertrauensgrenzen?

1. `apps/web/src/lib/api.ts` sendet Eingaben an die API. `packages/shared/src/api.ts`
   und HTTP-Grenzen prüfen Form und Größe nochmals; die 10-MiB-Grenze meint UTF-8-Bytes,
   weil JS-Zeichenlängen Mehrbytezeichen unterschätzen können.
2. `apps/api/src/auth.ts`, `loginThrottle.ts` und `sites/auth.ts` prüfen Tokens und
   drosseln Versuche serverseitig. `apps/web/src/lib/loginCooldown.ts` verbessert
   nur die Rückmeldung. Lokale feste Konten und Sites-Konten sind Demo-Zugänge,
   keine Registrierung oder Universität-SSO.
3. `packages/shared/src/chunking.ts` indexiert den unveränderten Quelltext.
   `domain/retrieval.ts` filtert auf ausgewählte Quellen; der Sites-Worker nutzt
   dieselbe Suchanfrage in `sites/ask.ts`. [Indexierung im Detail](indexing.md).
4. `domain/prompt.ts` verpackt Quellentext als nicht vertrauenswürdige JSON-Daten;
   das Modell erhält keine Werkzeuge. `domain/citations.ts` prüft Nummern, Zitate,
   Offsets und Satzabdeckung. `domain/ask.ts` bzw. `sites/ask.ts` halten eine
   vollständige echte Antwort zurück, wenn ein Beleg ungültig ist. Ein Zitat
   beweist weiterhin keine semantische Schlussfolgerung.
5. `sites/sources.ts` speichert den Originaltext in R2 und Index/Metadaten in D1.
   Bei einem fehlgeschlagenen D1-Import entfernt es das zuvor gespeicherte
   R2-Objekt. Export und Quellenansicht lesen das Original erst nach Auth-Prüfung.

## Warum kein Vektorindex oder Live-Crawling?

Die ausgewählten, kleinen Textkorpora erlauben FTS5 mit nachvollziehbarer
Trefferbegründung und Originaloffsets. Ein Vektordienst würde Betrieb und Kosten
erhöhen, ohne für diesen Prototyp eine gemessene Verbesserung zu belegen.
Synonyme, deutsche Zusammensetzungen und Tabellen bleiben Suchlücken; bei keinem
Treffer wird das Modell nicht zur freien Antwort aufgefordert. Freies Website-
Crawling würde Berechtigungs-, Quellen- und Missbrauchsfragen hinzufügen.

## Warum ein Modellschalter statt Fallback?

Modellkonfiguration und Zugangsdaten werden ausschließlich serverseitig gelesen.
Externe Modellaufrufe bleiben bis zu einem erfolgreichen Anbieter- und Belegtest
sperrbar. Ein stiller Wechsel auf ein anderes Modell könnte andere Kosten oder
Datenflüsse auslösen. Die konkreten Integrationsprüfungen werden getrennt von
der öffentlichen Architekturübersicht dokumentiert.

## Warum steht der Einstieg auch im HTML?

`apps/web/index.html` liefert Titel, Beschreibung, Canonical und einen kurzen,
öffentlichen Einstieg mit dem tatsächlichen Workflow. React ersetzt diesen
Einstieg beim Laden durch die interaktive Landingpage. So können auch Crawler
ohne JavaScript die Kernaussagen lesen; private Notebooks und Kontodaten werden
niemals vorgerendert. Die Fallback-Texte und `LandingPage.tsx` müssen bei jeder
inhaltlichen Änderung zusammen überprüft werden. Sitemap und `robots.txt`
verweisen nur auf die öffentliche Startseite. Eine Indexierung oder Aufnahme in
KI-Suchergebnisse wird dadurch nicht garantiert.

## Prüfpfade

`pnpm verify` prüft Typen, Format, Lint, Build, Unit-/Integrationstests und Tools.
`pnpm test:e2e` prüft unter anderem Login-Drosselung, ausgewählte Quellen,
Originalbelege und die öffentliche Landingpage im Browser; CI installiert dafür
Chromium. Die Simulations- und Adaptertests belegen Softwareverträge, keine
erfolgreiche externe KI-Verbindung. Aktueller Istzustand: [progress.md](progress.md).
