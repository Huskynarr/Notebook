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
