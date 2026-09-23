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
| `pnpm verify` unter Node 24.19.0, pnpm 9.15.9 | Typecheck, ESLint, Prettier, Theme-Vergleich, Build bestanden; 190 Unit-/Integrationstests in 25 Dateien und 10 Tooling-Tests bestanden |
| `pnpm test:e2e` mit Chromium | 13 Tests bestanden: zusätzlicher Nutzerzugang, vollständiger Ablauf, Belegsprung, Quellenwahl, Notiz nach Neuladen, Dateiimport/10-MiB-Abweisung, mobile Breite, Login-Sperre |
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
Stellen übersehen. Die festen Zugänge teilen denselben Datenbestand und
können durch verteilte Fehlanmeldungen pro Konto zeitweise blockiert werden. SQLite liegt lokal
beim Backend; Browserdemo und API-Betrieb haben unterschiedliche Schutz-/Funktionsgrenzen.

## 2026-09-22 · Zugänge Huskynar und everlabs

Der bisherige lokale Standardname lautet jetzt `Huskynar`, Passwort unverändert.
`everlabs` wurde mit dem angeforderten Testpasswort in der ignorierten Backend-ENV
eingerichtet; Zugangsdaten werden nicht im Git oder Frontend gespeichert. Ein frischer
Checkout benötigt diese separate Backend-Konfiguration für den zusätzlichen Zugang.
Beide Logins und authentifizierten Datenzugriffe tatsächlich mit HTTP200 geprüft,
der alte Standardname `admin` mit HTTP401. Login-Drossel je Nutzer und IP, keine
Trennung der Notebookdaten. `pnpm check:all`: 190 Unit-/Integrationstests, 10 Tooling-
Tests und 13 Chromium-E2E-Tests bestanden. Konfiguration, ungültige/entfernte Nutzer,
vertauschte Passwörter, isolierte Kontosperren und zweiter Browserlogin sind abgedeckt.
Kein Deployment; die bisher oben verlinkte GitHub-Abnahme betrifft den vorigen Stand.

## 2026-09-23 · Migration auf ChatGPT Sites

Die unveränderte React-Oberfläche kann zusätzlich als Sites-Build mit einem
Worker für `/v1` erstellt werden. D1 speichert Metadaten, FTS5, Notizen und
Kontingente; R2 nimmt unveränderte Originaltexte auf. Im neuen Betriebsweg
sind `Huskynar` und `everlabs` getrennte Datenräume. Die bisherigen lokalen
Fastify-/Plesk-Dateien wurden nicht als Sites-Laufzeit deklariert. Loginsperren
sind in D1 atomar; der clientseitige Countdown bleibt bestehen.

Lokal tatsächlich geprüft: Worker-Typecheck und ESLint bestanden; `pnpm sites:build` erzeugte Client und ESM-Worker, das Packaging enthielt Worker,
Assets, Manifest und die initiale SQL-Migration. Sieben Worker-Tests auf
SQLite-kompatibler Testdatenbank bestanden: Kontentrennung, Beispiel,
Anmeldedrossel samt parallelen Fehlversuchen, Originalbeleg/Notiz/Export,
Quelle über 2 MiB, exakt 10 MiB UTF-8 und Zurückhalten eines ungültig
belegten Modelltextes. Die bestehende Chromium-Strecke prüft weiter den
lokalen Fastify-Modus; eine echte gehostete D1/R2-Abnahme ist damit nicht
behauptet. Externe Modellantworten benötigen einen noch nicht vorhandenen
Anbieterschlüssel. `pnpm verify` bestand am 23.09. mit 197 Unit-/Integrationstests
in 26 Dateien und 10 Tooling-Tests. Der Sites-Build und die Prüfung von
`dist/server/wrangler.json` bestanden ebenfalls.

Lokale Browserprüfung **nicht bestanden**: Playwrights Chromium fehlt in dieser
Umgebung; der vorhandene Ersatz-Browser beendet sich bereits bei `--version`
mit SIGSEGV. Alle 13 Browserfälle brachen vor dem Seitenaufruf ab. Die GitHub-
CI installiert ihren eigenen Chromium-Build; ein erfolgreicher neuer CI-Lauf
steht noch aus. Das ist kein Ergebnis über das Verhalten der Sites-Anwendung.

## 2026-09-23 · Sites-Veröffentlichung und Datenschutzhinweis

Sieben kleine Commits wurden einzeln mit `pnpm verify` geprüft und mit
identischen Dateibäumen in PR #9 übertragen. GitHub CI 35833602868 bestand
einschließlich Chromium-Ablauf, Sites-Build und Fail2ban; CodeQL 35833602806
bestand ebenfalls. Der Sites-Worker wurde aus Commit `86e07bb` erfolgreich
veröffentlicht, zunächst privat und danach auf ausdrücklichen Auftrag mit
öffentlicher Landingpage. D1 meldet alle sieben erwarteten Tabellen.

Der Browser zeigte die öffentliche Landingpage. Der dort entdeckte alte
Einwilligungstext behauptete ausschließlich lokale Datenspeicherung; die
deutsche und englische Fassung beschreiben nun die serverseitige Speicherung
im Onlinebetrieb. Der gehostete Login/Import wurde dabei nicht geprüft.
`notebook.sebastianselinger.de` ist beim Sites-Dienst registriert, aber DNS-
und Zertifikatsprüfung stehen noch aus. Ohne Anbieterschlüssel bleibt das
sichtbar gekennzeichnete KI-Stubprofil aktiv. Die Textkorrektur wurde als
Sites-Version 2 aus Commit `0a837f5` veröffentlicht und im Browser angezeigt;
GitHub CI 35834237603 und CodeQL 35834237634 bestanden für diesen Stand.

## 2026-09-23 · Präzisierte Konten und Big-Pickle-Profil

Die öffentliche Sites-Landingpage und die Domain
`notebook.sebastianselinger.de` sind inzwischen mit aktiver TLS-Bindung erreichbar.
Vor der aktuellen Namensumstellung enthält die produktive D1 ein Notebook
mit dem Eigentümer `Huskynar`; für `everlabs` wurde keines gefunden. Die
Anwendung und laufzeitseitigen Zugänge sollen auf `Huskynarr` und `Everlast`
wechseln, wobei das bisherige Hauptpasswort und das ausschließlich im Backend
gespeicherte Testpasswort unverändert bleiben. Die Datenkorrektur wird auf die
alten Namen begrenzt beim ersten authentifizierten Zugriff des neuen Namens
durchgeführt. Eine bloße ENV-Umbenennung würde das vorhandene Notebook verbergen;
eine D1-Schema-Migration enthält keine Datenänderung.

OpenCodes aktuelle Dokumentation führt Big Pickle als zeitlich begrenzt
kostenloses Chatmodell und die Console-Inference-API als für kostenlose
Chatmodelle ohne Schlüssel aufrufbar. Go listet Big Pickle nicht. Das
Big-Pickle-only-Profil mit `https://opencode.ai/inference/openai/v1` wurde
aus den Dokumenten vorbereitet. Ein echter Modellaufruf, das geforderte
Antwortformat und die Belegqualität sind **noch nicht live geprüft**; das
öffentliche Deployment antwortet bis zur nachgewiesenen Umstellung weiter
im sichtbar gekennzeichneten Offline-Modus. Die Auswirkungen auf Kosten
und Datenschutz sind in `docs/providers.md` dokumentiert.

Die Kontonamen, die idempotente Eigentümerkorrektur und der schlüssellose
Big-Pickle-HTTP-Vertrag sind implementiert. `pnpm verify` bestand mit 203
Unit-/Integrationstests und 10 Tooling-Tests einschließlich Typprüfung,
Lint, Format und Build. Die Modelltests verwenden kontrollierte HTTP-Antworten;
ein Live-Aufruf und eine Überprüfung echter Modellbelege stehen noch aus.

## 2026-09-23 · Sites-Version 4 veröffentlicht

Die geprüfte Änderung `97541ba` wurde als Sites-Version 4 mit Laufzeitrevision 2
erfolgreich veröffentlicht. Die produktiven Zugangsnamen sind `Huskynarr` und
`Everlast`; die vorhandenen Passwörter und das Signaturgeheimnis blieben erhalten.
Nur serverseitig gesetzt: OpenCode Console, Modell `big-pickle`, ohne API-Schlüssel.
Sites meldet die Domain `notebook.sebastianselinger.de` samt TLS weiterhin als aktiv.
GitHub-CI [35838502491](https://github.com/Huskynarr/Notebook/actions/runs/35838502491)
und [CodeQL 35838502505](https://github.com/Huskynarr/Notebook/actions/runs/35838502505)
sind für den übertragenen identischen Dateibaum erfolgreich abgeschlossen.

Die produktive D1 zeigt noch das ursprüngliche Beispiel-Notebook unter `Huskynar`;
die getestete Datenkorrektur läuft erst beim ersten authentifizierten Zugriff von
`Huskynarr`. Ein gehosteter Login, die Übernahme in der produktiven D1 und eine
echte Big-Pickle-Antwort samt Beleg wurden nicht live geprüft. Das Backend gibt
bei Anbieterfehlern eine Fehlermeldung zurück und wählt kein Ersatzmodell.

## 2026-09-23 · Modellwahl auf MiMo-V2.6-Flash Free präzisiert

Nach der veröffentlichten Sites-Version 4 änderte sich die gewünschte Modell-ID
von `big-pickle` auf `mimo-v2.6-flash-free`. OpenCodes [Console-Modellkatalog](https://opencode.ai/v2/docs/console/models/)
führt die exakte ID als kostenloses Chatmodell, jedoch nur befristet. Die
[Inference-API](https://opencode.ai/v2/docs/console/inference/) erlaubt
Anfragen an kostenlose Chatmodelle ohne Bearer-Schlüssel. Die Variante
`mimo-v2.6-flash` im Go-Abonnement hat laut [Go-Dokumentation](https://opencode.ai/docs/go/)
Tokenpreise. Aktuelle Produkttexte und Konfigurationsbeispiele enthalten
deshalb ausschließlich die Console-ID mit `-free`; die Hinweise zu US-Hosting,
möglicher Modellverbesserung und Console-Auto-Reload bleiben erhalten.

Die noch veröffentlichte Sites-Version 4 nutzte `big-pickle`. Ein neuer
Deploy, ein echter MiMo-Aufruf und eine geprüfte Belegantwort sind zum
Zeitpunkt dieses Eintrags nicht nachgewiesen. Ergebnisse der nächsten Prüfung
werden erst nach ihrem tatsächlichen Lauf ergänzt.

## 2026-09-23 · MiMo- und Everlast-Änderung lokal geprüft

Das Backend verwendet nun die exakte MiMo-Free-Modell-ID am schlüssellosen
Console-Endpunkt. Das neue Startnotebook enthält zwei datierte, als
Unternehmens-Selbstauskunft markierte Quellen mit einer prüfbaren Beispielfrage.
Ein zuvor angelegtes Prüfungsbeispiel bleibt auf Sites mit denselben Quellen-
und Notiz-IDs als Archiv erreichbar; der neue Seed kann nach dem Löschen
des neuen Notebooks nicht wiederholt werden, solange das Archiv besteht.

`pnpm verify` lief am 23.09.2026 erfolgreich: TypeScript, ESLint, Prettier,
Produktionsbuild, **205** Unit-/Integrationstests und **10** Tooling-Tests.
Die Worker-Tests nutzen einen SQLite-kompatiblen Testadapter und modellieren
den HTTP-Anbieteraufruf. GitHub CI, gehosteter Login, echte D1/R2-Operationen
und ein echter MiMo-Aufruf sind für diesen neuen Stand noch nicht geprüft.

## 2026-09-23 · GitHub-CI und Sites-Version 5 erfolgreich

Die getrennten lokalen Commits `1156a8a` (MiMo) und `97f37db` (Everlast)
wurden mit identischen Git-Dateibäumen in PR #9 übertragen. Für den zweiten
Commit bestanden [GitHub CI 35841271644](https://github.com/Huskynarr/Notebook/actions/runs/35841271644)
und [CodeQL 35841271468](https://github.com/Huskynarr/Notebook/actions/runs/35841271468).
Der Sites-Build und seine Binding-/Artefaktprüfung bestanden. Sites-Version 5
wurde aus dem lokal geprüften Commit `97f37db` mit Laufzeitrevision 3
erfolgreich veröffentlicht: `LLM_MODEL=mimo-v2.6-flash-free`,
`LLM_BASE_URL=https://opencode.ai/inference/openai/v1`, übrige Zugangswerte
beibehalten. Sites meldet `notebook.sebastianselinger.de` und TLS als aktiv.

Der Header zeigt laut Code den Modellwert aus `/v1/health`; die gehostete
Darstellung hinter dem Login, eine Anmeldung, die Migration des bestehenden
D1-Beispiels und eine echte MiMo-Antwort samt Belegen wurden nicht live
getestet. Ein direkter HTTPS-Abruf von `/v1/health` lieferte anschließend
`configured: true` und `model: "mimo-v2.6-flash-free"`. Der UI-Code liest
dieses Feld; eine produktive Sitzung hinter dem Login ist nicht geprüft.
Der abschließende Dokumentationsstand wurde aus dem ebenfalls lokal
geprüften Commit `d518b50` als Sites-Version 6 veröffentlicht, mit derselben
Laufzeitrevision 3 und weiterhin aktiver Custom Domain samt TLS.
[GitHub CI 35841728179](https://github.com/Huskynarr/Notebook/actions/runs/35841728179)
und [CodeQL 35841728198](https://github.com/Huskynarr/Notebook/actions/runs/35841728198)
bestanden auch für diesen Dokumentationscommit.

## 2026-09-23 · Live-Inferenztest zeigt OpenCode-Sperre

Der HTTP-Test auf der Custom Domain meldete zuerst das erwartete Health-Modell.
Mit dem vorhandenen `Everlast`-Testzugang gelangen anschließend die Anmeldung
(HTTP 200), die Notebookliste und das neue Beispiel mit **zwei** Quellen
(je HTTP 200). Die Frage an beide Quellen endete mit HTTP 503
`llm_unavailable`. Ein separater direkter POST mit einem nicht vertraulichen
„OK“-Prompt an `https://opencode.ai/inference/openai/v1/chat/completions`
mit `mimo-v2.6-flash-free` ohne Schlüssel erhielt HTTP 403 `FreeTierError`:
der kostenlose Tarif sei nur innerhalb von OpenCode nutzbar. Die OpenCode-
Dokumentation über schlüssellose kostenlose Chatmodelle reichte hier nicht
als Funktionsnachweis. Ein authentifizierter Console- oder Go-Key wurde
nicht getestet; ein kostenloser externer V2.6-Zugang bleibt offen.

Der Worker und die Oberfläche kennzeichnen die beobachtete externe Sperre
explizit über den Laufzeitwert `LLM_ACCESS_STATUS=blocked`. In diesem Zustand
wird keine erneute Anbieteranfrage und keine fiktive Modellantwort erzeugt.
Ein späterer realer Modellvertrag braucht einen rechtmäßig nutzbaren externen
Endpunkt und einen erneut geprüften Belegworkflow. `pnpm verify` bestand für
diesen Stand einschließlich 207 Unit-/Integrationstests und 10 Tool-Tests,
Typecheck, Lint, Formatkontrolle und Build. Das Deployment folgt nach Commit
und CI-Prüfung.
`pnpm check:all` wiederholte den erfolgreichen Prüflauf, erreichte lokal aber
keinen Browser-Test: Das von Playwright erwartete Chromium-Executable fehlt in
dieser Arbeitsumgebung; alle 13 E2E-Fälle scheiterten vor dem Start. Die GitHub-
CI installiert Chromium gesondert und bleibt die ausstehende Browser-Prüfung.
Ein lokaler Installationsversuch lud nur ein beschädigtes 0-MiB-Archiv und
wurde nach wiederholtem Fehler beendet.

## 2026-09-23 · Rückmeldung zum Console-Service-Key

Sites-Version 8 ist unter der Custom Domain aktiv; GitHub CI einschließlich
Browser-E2E und CodeQL bestanden. Der Health-Endpoint meldet die MiMo-ID mit
`accessBlocked: true`. Der Nutzer meldete auf der Domain erneut den älteren
Wortlaut „Der Modellendpunkt ist nicht erreichbar“ und beschrieb einen Schlüssel
aus „Keys → Service Account → API“. Ein Console-Service-Key ist für die
Inference-API dokumentiert, wurde hier aber weder eingesehen noch live geprüft.
Der Backend-Header für die feste kostenlose MiMo-ID wird vorbereitet und der
gesperrte Status zusätzlich direkt am Fragefeld angezeigt. Die Site bleibt
gesperrt, bis ein authentifizierter Einmaltest und ein Belegtest gelingen.
`pnpm verify` bestand mit 207 Unit-/Integrationstests und 10 Tool-Tests,
Typecheck, Lint, Formatkontrolle und Build. Ein authentifizierter Live-Test
mit dem beschriebenen Schlüssel steht weiterhin aus.
`pnpm check:all` bestand erneut bis zu Playwright; die 13 lokalen E2E-Fälle
starteten wegen des fehlenden Chromium-Executable nicht. Die GitHub-CI
installiert Chromium für die ausstehende Browserprüfung.

## 2026-09-23 · Muse-Spark-Alternative

Der Console-Katalog führt `muse-spark-1.3-contributor-free` als befristet
kostenloses Responses-Modell. Der Backend-Adapter unterstützt das Format mit
strikter Prüfung auf vollständige Textantwort und dieselbe Quellenvalidierung
wie bisher. Die externen Provider-Antworten werden nicht als Tests simuliert:
Automatisierte Tests verwenden kontrollierte Fetch-Doubles. Ein echter
Muse-Aufruf mit dem vorhandenen Site-Secret und ein bestätigter Belegtest
stehen noch aus; die Site bleibt bis dahin mit `LLM_ACCESS_STATUS=blocked`
gesperrt. OpenCode nennt mögliche Nutzung der Eingaben und Ausgaben zur
Verbesserung des Modells; daher nur freigegebene öffentliche Demo-Quellen.
Der geprüfte Muse-Adapter bestand `pnpm verify`: 208 Unit-/Integrationstests,
10 Tool-Tests sowie Typecheck, Lint, Formatkontrolle und Build. `pnpm check:all`
wiederholte die Prüfungen; alle 13 lokalen Browserfälle konnten nicht starten,
weil in dieser Umgebung das Playwright-Chromium-Executable fehlt. Das ist
keine erfolgreiche E2E-Prüfung; GitHub CI muss sie gesondert ausführen.
