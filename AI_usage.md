# KI-Einsatz in diesem Projekt

Fortlaufendes Protokoll des tatsächlichen KI-Einsatzes bei der Entwicklung. Regel: Was hier
nicht steht, ist nicht passiert. Was hier steht, ist so passiert.

Die Spalte „Geprüft durch" nennt, wie das Ergebnis kontrolliert wurde. „Nicht geprüft" ist
ein zulässiger, aber sichtbarer Eintrag.

Dies ist das Protokoll des **Entwicklungsprozesses**. Die Modellaufrufe der laufenden
Anwendung gehören nicht hierher.

---

## 2026-09-17

### Werkzeug

Claude (Modellkennung `claude-opus-5`) in Cowork, mit Zugriff auf eine Shell auf dem
Entwicklungsrechner, Web-Abruf und einen Browser für End-to-End-Prüfungen. Für die
Marktrecherche wurde ein Teilagent auf Basis von Sonnet eingesetzt.

### Was die KI gemacht hat

| # | Aufgabe | Übernommen | Geprüft durch |
|---|---|---|---|
| 1 | Klärung des Zuschnitts, Rückfragen bei Widersprüchen | `docs/product.md`, `AGENTS.md`, `docs/decisions.md` | Inhaltliche Vorgaben stammen vom Auftraggeber, Formulierung von der KI. Der Widerspruch zwischen „Postgres + pgvector" und „lokale Persistenz, keine umfangreiche Vektor-Infrastruktur" wurde erkannt und **zurückgefragt statt selbst entschieden** (D-006). |
| 2 | Marktrecherche (Teilagent, Sonnet) | Faktenlage in `docs/product-analysis.md` | **Teilweise nachgeprüft.** Die zentrale Aussage — Produktname „Gemini Notebook" und der Wortlaut zur Quellenbindung — wurde selbst über `support.google.com/gemininotebook/answer/16164461` erneut abgerufen und bestätigt. Plan-Limits und Dateiformate stammen aus dem Teilagenten-Bericht und sind **nicht einzeln nachgeprüft**; sie sind im Dokument mit Quelle versehen. Die Websuche war blockiert, deshalb konnten Nutzerkritik und deutsche Sprachqualität nicht belegt werden — im Dokument als offen markiert. |
| 3 | Design-System (`docs/design-system.md`) | vollständig | Der Entwurf stammt von der KI. Die Kontrastwerte waren zunächst gerechnet und als unbestätigt markiert; später an der gebauten Oberfläche gemessen und eingetragen. |
| 4 | Sämtlicher Produktivcode in `apps/`, `packages/`, `e2e/` | vollständig | Kein Code wurde ungeprüft übernommen: `tsc --noEmit` im Strict-Modus, ESLint mit `no-explicit-any` als Fehler, 61 Unit-/Integrationstests, 7 E2E-Tests, dazu ein tatsächlicher Serverstart und Bildschirmfotos der laufenden Anwendung. Sechs echte Fehler wurden dabei gefunden und behoben (aufgeführt in `docs/progress.md`). |
| 5 | Beispieltexte in `apps/api/src/seed/example.ts` | vollständig | Frei erfunden. Die Texte sagen im ersten Absatz selbst, dass sie erfunden und nicht verbindlich sind. |
| 6 | Commit-Texte und Dokumentation | vollständig | Jeder Commit nennt unter „Verifiziert-durch" einen tatsächlich ausgeführten Befehl mit echtem Ergebnis. |

### Was die KI **nicht** geprüft hat

- **Kein Aufruf eines echten Sprachmodells aus der Anwendung heraus.** Es stand kein
  OpenAI-kompatibler Endpunkt zur Verfügung. Der Adapter ist geschrieben und typgeprüft,
  aber nie gegen ein laufendes Modell ausgeführt (P5 in `docs/progress.md`).
- Die CI-Workflows sind geschrieben, aber nie gelaufen.
- Die Marktzahlen aus der Recherche sind nur stichprobenartig nachgeprüft.

### Fehler im eigenen Vorgehen

Gehört hierher, weil es den Wert des Protokolls ausmacht:

- **Zweimal gegen `AGENTS.md` Regel 1 verstoßen:** `git add -A` zog unfertige oder
  sachfremde Änderungen in einen Commit, der etwas anderes ankündigte. Beide Male wurde der
  Commit per `git reset --soft` wieder zerlegt, bevor er weiterging. Die Regel hat den
  Verstoß also erst sichtbar gemacht — aber sie hat ihn nicht verhindert.
- Ein Test wurde anfangs auf eine Annahme über die Trefferreihenfolge gestützt und schlug
  deshalb zu Recht fehl. Er wurde umgeschrieben, statt die Annahme zur Vorgabe zu erheben.

---

## 2026-09-18

| # | Aufgabe | Übernommen | Geprüft durch |
|---|---|---|---|
| 7 | Bildschirmfotos in die README | `docs/bilder/` | README als HTML gerendert und im Browser aufgerufen; alle Bilder laden. |
| 8 | Corporate Design der Universität umgesetzt, zunächst als Branch `design/uni-freiburg` | Farb- und Schriftsystem, D-012 bis D-014 | Werte selbst über `cd.uni-freiburg.de/farben/` und `/schrift/` abgerufen. Kontraste gemessen; Rückfall auf Arial mit `document.fonts.check` belegt, nicht angenommen. |
| 9 | Designs umschaltbar gemacht, drittes Design nach huskynarr.de | Generator `tools/build-theme.py`, Einstellungen, D-015 | Alle sechs Kombinationen an der gebauten Oberfläche gemessen. **Zu huskynarr.de war nur eine Farbe belegbar** (`theme-color`); das Design ist eine Näherung und in `docs/design-system.md` Abschnitt 11 so ausgewiesen — nicht als Nachbildung verkauft. |
| 10 | Vorschau ohne Backend und Pages-Workflow | `PreviewClient`, `pages.yml`, D-016 | Vorschau-Build unter Basis-Pfad im Browser geöffnet, Hauptablauf in drei Designs durchgeklickt, keine Konsolenfehler. |
| 11 | Vorschau zur Demo umgebaut, nachdem der Auftraggeber den Zweck klargestellt hat (Bewerbungstest) | `DemoClient` mit Zugangsprüfung und `localStorage`, D-017 | 5 Unit-Tests (Zugang, Persistenz über zwei Instanzen, Offsets); Demo-Build unter `/Notebook/` im Browser wie ein Prüfer durchgeklickt: falsches Passwort abgelehnt, eigene Quelle, Beleg trifft die Stelle, Notiz bleibt nach Neuladen, neuer Kontext verlangt Login. Ein Signaturfehler im Test entging `tsc` auf dem Rechner, weil ich es nach dem Schreiben nicht erneut aufrief — der Build im Container fing ihn. |

| 12 | Umlautfehler in Beispieltexten, Kommentaren und Oberfläche behoben | `tools/umlaute.py`, Beispielquellen | Skript sucht bekannte Fehlformen (`ae`/`oe`/`ue`/`ss` an Wortstellen, an denen ein Umlaut hingehört); Treffer einzeln angesehen, ASCII in Code-Kommentaren bewusst belassen. |
| 13 | Adressen als Quelle (Server ruft ab, SSRF-Schutz, Textextraktion), Antwortsprache | `fetchSource.ts`, `extract.ts`, Schema `kind: 'url'`, D-019 | `extract.test.ts` (HTML mit `<head>`, JSON, Titel aus Adresse), `server.test.ts` gegen einen lokalen Testserver; private Ziele mit `istPrivateAdresse` geprüft. Nicht geprüft: Verhalten an echten großen Seiten. |
| 14 | Oberfläche zweisprachig, Einführung, Teilen-Menü mit vier Exporten, verschiebbare Spalten, neuer Kopfbereich | `i18n/`, `Tour.tsx`, `ShareMenu.tsx`, `export.ts`, `Menu.tsx`, `useResizableColumns`, `App.tsx`, D-018/D-020 | 86 Unit-Tests, 8 E2E-Tests (Einführung neu), Demo-Build unter `/Notebook/` im Browser durchgeklickt und Bildschirmfotos angesehen; alle fünf Downloads tatsächlich ausgelöst und geöffnet (MD gelesen, DOCX-XML gelesen, PNG betrachtet). Sechs Fehler dabei gefunden (Nr. 10–15 in `docs/progress.md`), keiner durch Lesen des Codes. |

| 15 | Einwilligungsbanner (CMP) mit wirksamer Ablehnung | `lib/consent.ts`, `ConsentBanner.tsx`, Datenschutz-Abschnitt in den Einstellungen, D-021 | 5 Unit-Tests am Speichermodell (Umtragung in beide Richtungen, beschädigte Werte, ohne Speicher), E2E-Test prüft Speicherinhalt und Cookie-Freiheit nach Ablehnung; Banner in drei Designs und bei 390 px als Bildschirmfoto angesehen. Auf die Rückfrage, ob eine unangebundene Kategorie „Statistik" gezeigt werden soll, wurde bewusst verzichtet. |

| 16 | Repository-Hygiene: Lizenz, Community-Dateien, CI/CD-Ausbau | `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CODEOWNERS`, Issue-Vorlagen, `codeql.yml`, `dependabot.yml`, `preview.yml`, `release.yml` (release-please), `tools/bundle-size.mjs`, D-022 | Alle YAML- und JSON-Dateien geparst; Bundle-Skript gegen den echten Build ausgeführt und die Tabelle angesehen; `pnpm verify` grün. **Nicht geprüft:** die Workflows selbst laufen erst mit dem nächsten Push; ob release-please einen PR öffnen darf, hängt an einer Repository-Einstellung. Der gewünschte Vorschau-Link je PR ist mit GitHub Pages nicht möglich — statt ihn vorzutäuschen gibt es das Demo-Artefakt mit Anleitung. |

**Fehler im eigenen Vorgehen, heute:**

- Eine Shell-Eingabe war zu groß (`E2BIG`) und wurde nicht ausgeführt; ich habe das erst
  bemerkt, weil die Folgeausgabe fehlte. Der Generator wurde daraufhin im Container
  geschrieben und übertragen.
- Ein Commit-Text enthielt Backticks, die die Shell als Befehl ausführte — der Text kam
  verstümmelt an. Per `amend` und `rebase --onto` repariert, bevor etwas darauf aufbaute.
- Die erste Fassung der Belegfarbe im CD war falsch (Grün als Schrift, ~3,3:1). Die Messung
  hat den Zuschnitt geändert, nicht die Planung.
- Die erste Fassung der Pages-Ausgabe hat den Zweck verfehlt: Ich habe eine Vorführung mit
  Warnbanner gebaut, wo ein bedienbarer Frontend-Test gebraucht wurde. Die Regel „keine
  unmarkierten Simulationen" verlangt Kennzeichnung, nicht Entwertung — den Unterschied
  hat der Auftraggeber benennen müssen.
- `pnpm test` scheiterte auf einem frischen Checkout, weil das geteilte Paket nicht gebaut
  war. Ich hatte immer im vorbereiteten Arbeitsverzeichnis geprüft, nie im Zustand nach
  dem Klonen — und die CI ebenso wenig. Gefunden hat es der Auftraggeber.
- Drei weitere Fehler fanden sich erst im laufenden Programm (Nr. 7 und 8 in
  `docs/progress.md`, dazu sechs Build-Warnungen durch Schriftpfade). Keiner wäre durch
  Lesen des Codes aufgefallen.
- Beim Umbau auf Übersetzungen hing der API-Client an der Übersetzungsfunktion; jeder
  Sprachwechsel baute ihn neu und verwarf den Arbeitsstand. Der Fehler stand im Code, den
  ich selbst geschrieben hatte, und fiel erst im Bildschirmfoto nach dem Umschalten auf.
- Ich habe die Live-Demo als „geprüft" gemeldet, weil der Seitentitel stimmte. Tatsächlich
  lieferte Pages die von Jekyll gerenderte README, weil die Pages-Quelle auf dem Branch
  stand — und der E2E-Job war in jedem CI-Lauf rot, was ich nicht nachgesehen hatte. Beides
  hat der Auftraggeber gefunden. Die Prüfung war eine Stichprobe an der falschen Stelle;
  richtig wäre gewesen, die Seite im Browser zu öffnen und die Workflow-Läufe zu lesen.
- Zwei E2E-Tests schlugen nach dem Umbau fehl. Einer zeigte einen echten Fehler (Kopfzeile
  läuft über), einer eine Schwäche des Tests (Kästchen gezählt, bevor sie da waren). Ich
  habe beide vor dem Commit aufgeklärt statt den Test zu lockern — die Netzwerkaufzeichnung
  zeigte, dass kein PATCH abging, also kam die Anwendung gar nicht zum Zug.

---

## Regeln für Einträge

- Jeder Eintrag nennt Datum, Werkzeug, Aufgabe und Prüfung.
- Generierter Code, der ungeprüft übernommen wurde, wird als solcher eingetragen.
- Nicht ausgeführte Prüfungen werden als nicht ausgeführt eingetragen, nicht weggelassen.


### 2026-09-22 · KI-Einsatz 01

build(ci): vereinheitliche Qualitätsprüfung und lokale Hooks. Codex bearbeitete die zugehörigen Dateien.
Prüfung dieses isolierten Zwischenstands: `pnpm verify` im verpflichtenden Commit-Hook.
Die nachfolgenden Produktänderungen sind in diesem Commit noch nicht enthalten.


### 2026-09-22 · KI-Einsatz 02

fix(api): validiere Zugangskonfiguration und API-Grenzen. Codex bearbeitete die zugehörigen Dateien.
Prüfung dieses isolierten Zwischenstands: `pnpm verify` im verpflichtenden Commit-Hook.
Die nachfolgenden Produktänderungen sind in diesem Commit noch nicht enthalten.


### 2026-09-22 · KI-Einsatz 03

fix(api): sichere Notizbelege und begrenze Dokumentexporte. Codex bearbeitete die zugehörigen Dateien.
Prüfung dieses isolierten Zwischenstands: `pnpm verify` im verpflichtenden Commit-Hook.
Die nachfolgenden Produktänderungen sind in diesem Commit noch nicht enthalten.


### 2026-09-22 · KI-Einsatz 04

fix(api): begrenze Anmeldeversuche und Quellenimporte. Codex bearbeitete die zugehörigen Dateien.
Prüfung dieses isolierten Zwischenstands: `pnpm verify` im verpflichtenden Commit-Hook.
Die nachfolgenden Produktänderungen sind in diesem Commit noch nicht enthalten.


### 2026-09-22 · KI-Einsatz 05

refactor(api): entferne den deaktivierten Websiteabruf. Codex bearbeitete die zugehörigen Dateien.
Prüfung dieses isolierten Zwischenstands: `pnpm verify` im verpflichtenden Commit-Hook.
Die nachfolgenden Produktänderungen sind in diesem Commit noch nicht enthalten.


### 2026-09-22 · KI-Einsatz 06

fix(rag): verweigere unvollständig belegte Modellantworten. Codex bearbeitete die zugehörigen Dateien.
Prüfung dieses isolierten Zwischenstands: `pnpm verify` im verpflichtenden Commit-Hook.
Die nachfolgenden Produktänderungen sind in diesem Commit noch nicht enthalten.


### 2026-09-22 · KI-Einsatz 07

fix(api): begrenze gleichzeitige und tägliche KI-Anfragen. Codex bearbeitete die zugehörigen Dateien.
Prüfung dieses isolierten Zwischenstands: `pnpm verify` im verpflichtenden Commit-Hook.
Die nachfolgenden Produktänderungen sind in diesem Commit noch nicht enthalten.


### 2026-09-22 · KI-Einsatz 08

feat(web): ergänze Everlast-Thema und sichere Themeinitialisierung. Codex bearbeitete die zugehörigen Dateien.
Prüfung dieses isolierten Zwischenstands: `pnpm verify` im verpflichtenden Commit-Hook.
Die nachfolgenden Produktänderungen sind in diesem Commit noch nicht enthalten.


### 2026-09-22 · KI-Einsatz 09

feat(web): ergänze die öffentliche Produktlandingpage. Codex bearbeitete die zugehörigen Dateien.
Prüfung dieses isolierten Zwischenstands: `pnpm verify` im verpflichtenden Commit-Hook.
Die nachfolgenden Produktänderungen sind in diesem Commit noch nicht enthalten.


### 2026-09-22 · KI-Einsatz 10

fix(web): übernehme serverseitige Wartezeiten und Backendkonfiguration. Codex bearbeitete die zugehörigen Dateien.
Prüfung dieses isolierten Zwischenstands: `pnpm verify` im verpflichtenden Commit-Hook.
Die nachfolgenden Produktänderungen sind in diesem Commit noch nicht enthalten.


### 2026-09-22 · KI-Einsatz 11

fix(web): validiere Textimporte und kennzeichne die Browserdemo. Codex bearbeitete die zugehörigen Dateien.
Prüfung dieses isolierten Zwischenstands: `pnpm verify` im verpflichtenden Commit-Hook.
Die nachfolgenden Produktänderungen sind in diesem Commit noch nicht enthalten.


### 2026-09-22 · KI-Einsatz 12

feat(web): verbinde Landingpage und geschützten Quellenarbeitsbereich. Codex bearbeitete die zugehörigen Dateien.
Prüfung dieses isolierten Zwischenstands: `pnpm verify` im verpflichtenden Commit-Hook.
Die nachfolgenden Produktänderungen sind in diesem Commit noch nicht enthalten.


## 2026-09-22 · Codex, delegierte Entwicklungs- und Prüfaufgaben

Auftrag: vorhandenes Repository zum geschützten Notebook-Prototyp mit Landingpage,
Themes, Belegvalidierung und Plesk-Auslieferung erweitern. Codex erzeugte und überarbeitete
Code, Tests, GitHub-Workflows, Deploymentvorlagen und Dokumentation. Delegierte Agenten
bearbeiteten Authentifizierung, RAG, Oberfläche, Notizintegrität, Pipeline und Fail2ban.
Übernommen wurden die nach Codeprüfung und tatsächlich ausgeführten Prüfungen validierten
Änderungen. GitHub-MCP für Repository-Metadaten, Webrecherche in Herstellerdokumentation
und Browser-Skill für sichtbare Designreferenzen wurden eingesetzt.

Keine proprietären Universitätsquellen und keine Anbieter-Schlüssel wurden an ein
Live-Modell gesendet. RAG-/Provider-Tests verwenden markierte Testdoppel; Screenshots
zeigen die tatsächlich gestartete Anwendung im gekennzeichneten Offline-Modus.
Die abschließenden ausgeführten Befehle/Resultate stehen in docs/progress.md; fehlende
Live-Anbieter- und Serverabnahme bleiben dort ausdrücklich offen.

Abschließende lokale Prüfung: 176 Unit-/Integrationstests, 10 Tooling-Tests und
12 Chromium-E2E-Tests bestanden. Die Browserprüfung fand einen fehlenden Offline-
Belegmarker und mobilen Überlauf; beide wurden korrigiert und erneut geprüft.
Visuelle Prüfung führte zusätzlich zu bereinigten Screenshots ohne Tooltip/Animation.
Fail2ban: 5 positive, 7 negative Fälle und 12 Zeitstempel geprüft. Das Release-Paket
wurde mit reinen Produktionsabhängigkeiten installiert und gestartet (Health 200,
geschützte Route 401). Ein Review korrigierte die SemVer-Regel vor 1.0 und die Reihenfolge
der Erstinstallation im Betriebshandbuch. Keine externe Modell- oder Plesk-Abnahme.


### 2026-09-22 · Abnahme und Veröffentlichung der Branch

Codex prüfte 13 fachliche Zwischenstände jeweils mit `pnpm verify` in einem isolierten
Checkout und abschließend den gesamten Browserablauf. Mangels lokaler Git-Push-
Zugangsdaten wurden die Commits mit GitHub-MCP übertragen; jeder Dateibaum wurde
gegen den geprüften lokalen Git-Baum abgeglichen. Pull Request #9 wurde geöffnet.
GitHub CI 35763920968 (Node 22, Chromium, Fail2ban) und CodeQL 35763920983 bestanden
am Commit 16392b6. Kein Merge und kein Deployment wurden ausgelöst. Diese tatsächlichen
Resultate wurden in der Fortschrittsdokumentation ergänzt.


### 2026-09-22 · Feste Zugänge anpassen

Codex änderte den Standardnamen auf `Huskynar`, ergänzte validierte weitere
Backend-Zugänge und hinterlegte den angeforderten Zugang `everlabs` ausschließlich
in der ignorierten lokalen Konfiguration. Ein Agent prüfte und implementierte die
nutzerbezogene Anmeldedrossel samt Regressionstests. Das vorgegebene Testpasswort
wurde weder ins Git noch in das Frontend übernommen. Prüfresultate stehen in
`docs/progress.md`: 190 Unit-/Integrationstests, 10 Tooling-Tests und 13 Browsertests
bestanden. Beide lokal konfigurierten Zugangspaare wurden zusätzlich gegen die API
geprüft; der alte Standardname wird abgewiesen. Kein Server-Deployment.

## 2026-09-23 · Sites-Migration

Codex portierte die bestehende API auf einen Sites-Worker mit D1/R2 und
kontogetrennten Notebooks. Delegierte Agenten untersuchten die Sites-Laufzeit,
Speichergrenzen, Sicherheitsanforderungen und die vorhandenen CI-/Dokumentations-
Regeln; sie änderten keine Dateien. Übernommen wurden insbesondere der R2-Pfad
für 10-MiB-Originaltexte, D1-gestützte Sperren und der Erhalt der bisherigen
Belegprüfung. Codex schrieb und prüfte die Umsetzung durch TypeScript, ESLint,
lokale SQLite-kompatible Worker-Tests und einen Worker-Build. Diese Tests sind
keine externe D1-/R2- oder Live-Modellabnahme. Das bekannte Testpasswort wird
weder in Quellcode noch in öffentliche Assets eingebaut; Tests verwenden ein
anderes Passwort.

Codex übertrug die einzeln lokal geprüften Commits in den bestehenden
GitHub-PR und verglich jeden übertragenen Dateibaum mit dem lokalen Git-Baum.
Die Sites-Werkzeuge veröffentlichten den daraus gebauten Worker; die
produktive D1-Tabellenübersicht und die öffentliche Landingpage wurden gelesen.
Der Browserfund eines inhaltlich falschen Datenschutzhinweises führte zu einer
Korrektur in beiden Sprachfassungen. GitHub CI und CodeQL für den vorherigen
Stand waren erfolgreich; ein gehosteter Login oder Live-Modellaufruf wurde
nicht als geprüft ausgegeben.
Die korrigierte Fassung wurde als Sites-Version 2 erneut veröffentlicht,
im Browser angezeigt und durch GitHub CI 35834237603 und CodeQL 35834237634
für genau diesen Produktstand bestätigt.

## 2026-09-23 · Kontonamen, Anbieterdokumentation und bestehende D1-Daten

Codex überprüfte die OpenCode-Herstellerdokumente für Go, Zen, Console Inference
und die Modellliste. Übernommen wurden die präzisierten Namen `Huskynarr` und
`Everlast`, die Big-Pickle-Console-Konfiguration, der Hinweis zur begrenzten
Kostenfreiheit sowie die Angaben zu US-Hosting und möglicher Modellverbesserung.
Die Aussagen wurden mit den direkt verlinkten Anbieterseiten abgeglichen.
Codex prüfte die bestehende D1-Notebook-Eigentümerspalte lesend und schlug
eine idempotente Korrektur beim ersten authentifizierten Zugriff vor, damit das
vorhandene Notebook unter dem neuen Namen nicht verschwindet. Diese Recherche
und Dokumentationsänderung belegen keinen erfolgreichen Live-Modellaufruf,
keine semantisch korrekte Belegantwort und keine bereits ausgeführte
Datenkorrektur; die Ergebnisse weiterer Tests und des Deployments stehen
nach ihrem tatsächlichen Lauf in `docs/progress.md`.
Die generierte Implementierung wurde anschließend mit `pnpm verify` geprüft:
203 Unit-/Integrationstests und 10 Tooling-Tests bestanden. Der HTTP-Test für
Big Pickle benutzt einen Testserver-Ersatz; er belegt keinen erfolgreichen
Anbieteraufruf oder die Qualität der Modellantwort.
Codex glich den GitHub-Dateibaum der veröffentlichten Änderung mit dem lokalen
Commit ab, prüfte die erfolgreiche GitHub-CI und CodeQL, veröffentlichte die
Sites-Version 4 mit korrigierten serverseitigen Zugangsnamen und Big-Pickle-
Konfiguration und las die produktive D1 nur lesend. Dort ist der alte
Notebook-Eigentümer noch vorhanden; ein Login und echter Modellaufruf wurden
nicht ausgeführt und werden nicht als Abnahme gewertet.

## 2026-09-23 · Modellpräzisierung MiMo-V2.6-Flash Free

Auf die spätere Nutzervorgabe hin prüfte Codex erneut die offiziellen OpenCode-
Dokumente zu [Console-Modellen](https://opencode.ai/v2/docs/console/models/),
[Inference](https://opencode.ai/v2/docs/console/inference/),
[Zen](https://opencode.ai/docs/zen/) und [Go](https://opencode.ai/docs/go/).
Die exakte Modell-ID `mimo-v2.6-flash-free`, der OpenAI-kompatible
Chat-Completions-Endpunkt, die befristete Kostenfreiheit und die Ausnahmen zur
Modellverbesserung stammen aus diesen Quellen. Go bietet stattdessen
`mimo-v2.6-flash` ohne `-free` mit Tokenpreisen. Codex änderte die
Konfigurationsbeispiele und die deutschen und englischen Hinweise der
Landingpage. Die bereits veröffentlichte Big-Pickle-Version 4 und ihre
Prüfergebnisse bleiben als historischer Stand erhalten. Diese Dokumentenprüfung
und die automatisierten Testdoppel belegen keinen Live-Aufruf des MiMo-Modells
und keine geprüfte semantische Übereinstimmung von Antwort und Originalquelle.

## 2026-09-23 · Quellenbeispiel Everlast und Sites-Archivierung

Codex und zwei delegierte Agenten prüften Unternehmensimpressum, FAQ und einen
amtlichen Registertreffer, paraphrasierten die zwei Websitequellen für das
Startnotebook und schrieben einen konkreten Pfad für die weitere amtliche
Recherche. Aus dem Suchtreffer wurden keine Bilanzzahlen oder Beteiligungen
abgeleitet, da der Volltext nicht gelesen werden konnte. Die Tests und
Beispieltexte wurden auf die belegbare Frage nach Gesellschaft und Vertretung
ausgerichtet. Codex implementierte eine versionierte Beispiel-ID, damit beim
Wechsel von der alten fiktiven Prüfungsordnung zu Everlast Quellen- und
Notizdaten nicht gelöscht werden. Die ausführlichen Prüfergebnisse folgen
nach dem tatsächlichen Lauf in `docs/progress.md`.
Der vollständige lokale `pnpm verify`-Lauf bestand mit 205 Unit-/
Integrationstests und 10 Tooling-Tests; diese automatisierten Testdoppel
belegen weder einen gehosteten Login noch eine echte Modellantwort.

Codex trennte Modell- und Beispieländerung in zwei jeweils mit `pnpm verify`
geprüfte Commits (204 beziehungsweise 205 Unit-/Integrationstests, jeweils
10 Tooling-Tests). Über den GitHub-Connector wurden die Commit-Bäume exakt
mit den lokalen Bäumen verglichen; GitHub CI und CodeQL für den zweiten
Commit meldeten Erfolg. Über Sites wurde daraus Version 5 mit dem serverseitigen
MiMo-Free-Laufzeitwert veröffentlicht, die aktive Custom Domain wurde geprüft.
Ein produktiver Login oder Live-Modellaufruf bleibt ungetestet.
Sites-Version 6 wurde aus dem nachgeführten Dokumentationscommit veröffentlicht.
Ein direkter HTTPS-Abruf des produktiven Health-Endpunkts bestätigte die
MiMo-Free-Modell-ID; das ist noch kein Test einer echten KI-Antwort.
