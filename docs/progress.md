# Fortschritt

Stand: 2026-09-22. Dieser Stand beschreibt lokale Prüfungen, keine erfolgte
Veröffentlichung auf Plesk und keine Live-Abnahme eines KI-Anbieters.

## Implementiert und lokal geprüft

- Öffentliche Landingpage, Login, Everlast-Standardtheme, Huskynarr sowie bestehende
  Papier-/Universität-Themes; responsive Ansichten, Deutsch/Englisch.
- Notebook-Verwaltung, UTF-8-Text-/Markdown-Import, Quellenwahl, Originalbelege,
  Notizverwaltung und Markdown-Export mit lokaler SQLite-Persistenz.
- Serverseitige Anmeldung; nach drei Fehlern persistente IP-/Zugangssperre, steigender
  Countdown im Client, Produktionsprüfung für Passwort und Signaturgeheimnis.
- 10-MiB-Quellgrenze auf Client und Server, Speicher-/Anfragebudgets, begrenzte
  parallele Modellaufrufe und Exporte, validierte Notizbelege. Website-Import entfernt.
- KI-Adapter mit echten HTTP-Aufrufen an einen konfigurierbaren Anbieter. Marker,
  Zitate und Satzabdeckung werden geprüft; fehlerhafte echte Antworten zurückgehalten.
  Offline-Beispiel bleibt sichtbar als Simulation gekennzeichnet.
- Git-Hooks, GitHub-CI-Gates, SemVer über release-please, manuelle Plesk-/Pages-Wege,
  Release-Paket, nginx/systemd-Vorlagen und geprüfter Fail2ban-Filter.

## Tatsächlich ausgeführt

| Prüfung | Ergebnis |
|---|---|
| `pnpm verify` unter Node 24.19.0, pnpm 9.15.9 | Typecheck, ESLint, Prettier, Theme-Vergleich, Build bestanden; 176 Unit-/Integrationstests in 23 Dateien und 10 Tooling-Tests bestanden |
| `pnpm test:e2e` mit Chromium | 12 Tests bestanden: vollständiger Ablauf, Belegsprung, Quellenwahl, Notiz nach Neuladen, Dateiimport/10-MiB-Abweisung, mobile Breite, Login-Sperre |
| Fail2ban 1.1.0, `bash tools/test-fail2ban.sh` | 5 exakte IP-Treffer, 7 Nichttreffer, 12 Zeitstempel; UTC auch unter Europe/Berlin korrekt |
| Isoliertes Release-Paket, ausschließlich Produktionsabhängigkeiten | Installation erfolgreich; API startet, Health 200, geschützte Notebookroute ohne Token 401 |
| Deploy-Skript mit lokalen Testdoppeln | Konfigurationsprüfung, erfolgreiche Umschaltung und Rückkehr bei Startfehlern bestanden; kein SSH-Deployment |
| GitHub CI unter Node 22 und CodeQL für Commit `16392b6` | [CI erfolgreich](https://github.com/Huskynarr/Notebook/actions/runs/35763920968), einschließlich Chromium und Fail2ban; [CodeQL erfolgreich](https://github.com/Huskynarr/Notebook/actions/runs/35763920983) |
| Visuelle Prüfung der erzeugten Screenshots | Landingpage Desktop/Mobil und Arbeitsbereich Everlast/Huskynarr geprüft; Screenshots in README |

Die 13 fachlichen Commits wurden einzeln in einem isolierten Checkout mit `pnpm verify`
geprüft; jeder bleibt unter 400 geänderten Produktivcodezeilen. Die Dateibäume wurden
bei der GitHub-Übertragung abgeglichen. [Pull Request #9](https://github.com/Huskynarr/Notebook/pull/9)
enthält die Umsetzung und die nachgeführte Abnahmedokumentation. Lokal lief Node 24;
der erfolgreiche GitHub-Lauf bestätigt zusätzlich Node 22.

Die lokale Chromium-Installation erfolgte wegen eines fehlgeschlagenen Playwright-CDN-
Downloads über das Paket `@sparticuz/chromium` außerhalb des Repositorys und
`CHROMIUM_PATH`. CI installiert den von Playwright vorgesehenen Chromium-Build.
Es wurden keine Tests als bestanden ausgegeben, die dafür übersprungen wurden.

Die Tests prüfen unter anderem ungültige/fremde Belege, erfundene Zitate, unbelegte
Sätze, Anbieterfehler und -timeouts, zu große Antworten, Prompt-Injection-Daten,
gefälschte Proxy-Header, Token-Manipulation, Neustart der Loginsperre, Speichergrenzen,
binäre/zu große Quellen, gelöschte Originalquellen und Exportgrenzen.

## Nicht ausgeführt oder noch offen

- **Kein Live-Aufruf bei NVIDIA/Nemotron oder einem anderen externen Modell:** kein
  API-Schlüssel vorhanden. Lokale HTTP-Testserver belegen den Adaptervertrag, nicht
  Antwortqualität, Kostenfreiheit, Verfügbarkeit oder Kontingent eines Anbieters.
- **Kein Deployment** auf `panel.gardenpiratez.de` oder
  `notebook.sebastianselinger.de`; DNS, TLS, Cloudflare, SSH-Secrets, Service-Rechte und
  vHost-Integration müssen am Zielserver eingerichtet und geprüft werden.
- Kein Last-/Penetrationstest, keine vollständige Accessibility- oder Kontrastabnahme
  aller acht Theme-Varianten und keine Messung wissenschaftlicher Antwortqualität.
- PDFs/OCR, Konten/Rollen, Zusammenarbeit, Audio/Video, Crawling und Vektordienste
  bleiben außerhalb des Pflichtumfangs.

## Fachliche Grenzen

Wörtlich vorhandene Belege beweisen keine semantische Richtigkeit. BM25 kann relevante
Stellen übersehen. Der gemeinsame Admin bietet keine Trennung zwischen Personen und
kann durch verteilte Fehlanmeldungen zeitweise blockiert werden. SQLite liegt lokal
beim Backend; Browserdemo und API-Betrieb haben unterschiedliche Schutz-/Funktionsgrenzen.
