# Fortschritt

Zustand, nicht Plan. Was hier als funktionierend steht, wurde ausgeführt und die Ausgabe
angesehen. Was nicht geprüft werden konnte, steht unter „Nicht geprüft" — nicht weggelassen.

Stand: 2026-09-18 · Version 0.1.0 (noch ohne Release-Tag)

## Funktioniert (geprüft)

Pflichtumfang aus `docs/product.md`:

| # | Anforderung | Stand | Wodurch belegt |
|---|---|---|---|
| P1 | Notebook-Verwaltung | funktioniert | `server.test.ts`, E2E |
| P2 | Text-/Markdown-Import (Einfügen und Datei) | funktioniert | `server.test.ts`, E2E („eigene Quelle hinzufügen") |
| P3 | Markdown-Export inkl. Notizen und Belegangaben | funktioniert | `server.test.ts` („exportiert das Notebook als Markdown") |
| P4 | Quellenwahl wirkt auf den Abruf | funktioniert | `server.test.ts`, `retrieval.test.ts`, E2E |
| P5 | Echte KI-Antworten | **nicht geprüft** — siehe unten | — |
| P6 | Überprüfbare Quellenverweise | funktioniert | `citations.test.ts`, `server.test.ts`, E2E |
| P7 | Notizen anlegen, ändern, löschen | funktioniert | `server.test.ts`, E2E |
| P8 | Lokale Persistenz ohne Datenbankserver | funktioniert | Server startet und antwortet mit `node:sqlite` |
| P9 | Sofort nutzbares Beispiel | funktioniert | E2E („Beispiel-Notebook ist nach dem Start sofort nutzbar") |
| P10 | Fester Zugang `admin:admin` | funktioniert | `auth.test.ts`, `server.test.ts` |

Darüber hinaus, nicht im Pflichtumfang:

- **Drei umschaltbare Designs** (eigen, Universität Freiburg, huskynarr), je hell und
  dunkel, in den Einstellungen; Auswahl überlebt das Neuladen ohne Aufblitzen.
- **Demo ohne Server** (`VITE_DEMO=true`) für GitHub Pages: Anmeldung `admin:admin` wird
  geprüft, Daten bleiben im Browser, Belege echt; nur das Sprachmodell fehlt und ist an der
  Antwort gekennzeichnet (D-017).
- **Oberfläche auf Deutsch und Englisch** (D-018); die Einführung beim ersten Start fragt
  Sprache und Design ab und erscheint danach nicht mehr (E2E-Test).
- **Adressen als Quelle** — der Server ruft Webseiten und Text-/JSON-Endpunkte ab und
  extrahiert den Text (D-019, `extract.test.ts`, `server.test.ts`); die Demo meldet eine
  CORS-Sperre als solche (im Browser gegen `example.org` gesehen).
- **Teilen** für Notebook und einzelne Antwort als Markdown, Word, PDF (Druck) und PNG
  (D-020). Alle Downloads im Browser ausgelöst und geöffnet: `.md` mit Belegliste, `.docx`
  mit Überschriften und Absätzen, PNG 1568×1220 px mit Frage und Antwort ohne Knöpfe.
- **Einwilligungsbanner** (D-021) mit den zwei Klassen, die es gibt; Ablehnen wirkt
  nachweislich: E2E-Test prüft, dass danach nur `notebook.consent.v1` im `localStorage`
  liegt, die Sprachwahl im `sessionStorage`, und dass kein Cookie gesetzt ist. Umschaltbar
  in den Einstellungen.
- **Verschiebbare Spalten** über Trenner (Maus, Pfeiltasten); Breiten überleben das
  Neuladen. Kopfbereich zeigt den vollen Notebook-Titel mit Menü statt eines schmalen
  Auswahlfelds.

Zuletzt tatsächlich ausgeführt (2026-09-18):

```
pnpm verify           typecheck, lint, format:check, 92 Tests in 12 Dateien, Build
pnpm --filter @notebook/web build   JS 400 kB (gzip 120 kB) + Export-Chunk 367 kB (gzip 105 kB), lädt erst beim Teilen
pnpm exec playwright test           9 Tests bestanden (locale de-DE)
```

Gemessen, nicht geschätzt:

- Kontrast in allen sechs Design-/Theme-Kombinationen an der gebauten Oberfläche:
  niedrigster Wert 5,47:1 (`docs/design-system.md`, Abschnitt 1).
- Rückfall auf Arial im Design `uni-freiburg` trägt: `document.fonts.check('16px Social')`
  ist `false`, gemessene Textbreite identisch mit Arial.
- Designwahl steht vor dem Bundle am Wurzelelement (geprüft mit `waitUntil: 'commit'`).
- Bei 390 px Breite kein waagerechtes Scrollen (E2E-Test).
- Keine Fehler in der Browserkonsole beim Hauptablauf.

Repository (2026-09-19, D-022): MIT-Lizenz, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`,
`SECURITY.md`, `CODEOWNERS`, Issue-Vorlagen; CodeQL, Dependabot, Bundle-Größe und
Demo-Artefakt je PR, Releases über `release-please`. Nach dem Push von `16ef1d0` gesehen:
CI, CodeQL und Pages grün; Dependabot öffnete sofort sechs PRs, an jedem hängen der
Bundle-Kommentar und das Demo-Artefakt; **der Release-Lauf scheiterte** — `release-please`
darf keinen PR öffnen, solange in den Einstellungen „Allow GitHub Actions to create and
approve pull requests" aus ist.

## Nicht geprüft

Diese Punkte sind offen, nicht „vermutlich in Ordnung":

- **P5, echte KI-Antworten.** Es stand kein OpenAI-kompatibler Endpunkt zur Verfügung. Der
  Adapter ist implementiert und typgeprüft, aber **nie gegen ein laufendes Modell
  ausgeführt**. Ungeprüft bleiben damit: ob Modelle die vorgegebene JSON-Form einhalten, ob
  sie Marker zuverlässig setzen, und wie oft ihre wörtlichen Zitate wiederauffindbar sind
  (`precision: exact` gegenüber `chunk`). Alle Tests laufen gegen den Offline-Modus oder ein
  Testdoppel.
- **Belegqualität deutschsprachiger Modelle.** Nicht gemessen, pro Modell zu prüfen.
- **Leistungszusage** aus `docs/product.md` (Abruf und Validierung unter 300 ms bei 30
  Quellen): nicht gemessen. Die einzige belastbare Zahl ist `elapsedMs` in der Antwort,
  im Beispielkorpus einstellig.
- **Barrierefreiheit:** Ränder und Fokusringe gegen ihre Umgebung (3:1), Bedienung bei
  200 % Zoom und vollständige Tastaturbedienung stehen weiter auf der Prüfliste in
  `docs/design-system.md`, Abschnitt 9.
- **CI-Workflows:** Der Job „Typen, Stil, Tests, Build" läuft seit dem vierten Lauf grün.
  Der Job „End-to-End" **ist in allen sechs Läufen gescheitert** — lokal nie. Ursache:
  `vite preview` lauschte auf `localhost`, das auf dem Runner zuerst nach `::1` auflöst;
  die Tests riefen `127.0.0.1` auf. Behoben durch feste Bindung an `127.0.0.1`
  (Commit `5605fe1`); ob der Lauf damit grün wird, zeigt der nächste Push.
- **GitHub Pages zeigte nicht die Anwendung, sondern die README.** Die Quelle steht auf
  „Deploy from a branch"; GitHub rendert dann die README mit Jekyll und überschreibt die
  Ausgabe des Pages-Workflows, der trotzdem Erfolg meldet. Die Prüfung vom Vormittag
  („Seitentitel wird ausgeliefert") war zu schwach — der Titel stimmte, der Inhalt nicht.
  Der Workflow scheitert jetzt laut, wenn die Quelle nicht „GitHub Actions" ist. Die
  Quelle wurde am 2026-09-18 vom Auftraggeber in den Repository-Einstellungen umgestellt;
  dieser Commit löst den ersten Pages-Lauf unter der neuen Quelle aus.
- **Corporate Design nicht abgestimmt.** Das Design `uni-freiburg` geht an zehn Stellen
  über das CD hinaus (`docs/design-system.md`, Abschnitt 10). Nicht mit
  cd@zv.uni-freiburg.de abgestimmt; Hausschrift nie gesehen; Logo-Frage offen.
- **Design `huskynarr` ist eine Näherung.** Belegt ist eine Farbe; alles andere ist
  Ableitung (Abschnitt 11).
- **Zweck der Ausgabe:** Frontend-Test für eine Bewerbung bei everlabs. `docs/product.md`
  beschreibt weiter den Universitätskontext; ob die Produktdefinition angepasst werden
  soll, ist nicht entschieden.

## Bekannte Grenzen

- **Deutsche Komposita im Abruf.** Der lexikalische Abruf findet „Widerspruchsfrist" nicht
  über die Anfrage „Frist", weil Präfixsuche nur nach vorn wirkt. Umgekehrt findet
  „Frist" das Wort „Fristen". Eine Zerlegung von Komposita gibt es nicht; ab wann das
  stört, ist nicht erhoben (offene Annahme 2 in `docs/product.md`).
- **Präfixsuche erst ab fünf Zeichen.** Kürzere Begriffe werden exakt gesucht. Das wurde
  eingeführt, weil `hoch*` über „Hochschule" eine fachfremde Frage scheinbar beantwortbar
  machte.
- **Kein Streaming.** Die Antwort erscheint am Stück. Bei langen Antworten großer Modelle
  wirkt das träge.
- **PDFs werden nicht angenommen.** Der Typ ist im Schema vorgesehen, die API lehnt ihn ab.
- **Der Offline-Modus formuliert nichts.** Ohne Modell listet er nur die gefundenen Stellen.
  Das ist Absicht, kann aber beim ersten Start wie ein Fehler wirken — das Banner sagt es.
- **Adressquellen in der Demo hängen von der Zielseite ab.** Ohne Server kann der Browser
  nur Seiten holen, die den Abruf per CORS erlauben; die meisten tun das nicht. Der Dialog
  sagt es, umgehen kann er es nicht (D-019).
- **PDF ist der Druckdialog.** Das Ergebnis hängt vom Browser ab (Kopf-/Fußzeilen,
  Seitenränder); geprüft wurde nur, dass das Druck-Stylesheet das gewählte Element isoliert,
  nicht die PDF-Datei selbst.
- **Der lange Titel wird auf schmalen Bildschirmen gekürzt** (Tooltip zeigt ihn ganz); auf
  Desktop-Breite steht er vollständig.

## Im Verlauf gefundene Fehler

Festgehalten, weil jeder davon zeigt, welche Prüfung ihn gefunden hat:

1. **Server startete nicht.** Node führt TypeScript nur per Type-Stripping aus und lehnt
   Parameter-Properties ab. Alle Unit-Tests blieben grün, weil vitest anders übersetzt.
   Gefunden erst beim tatsächlichen Start. Eine ESLint-Regel verhindert die Wiederkehr.
2. **CORS ließ PATCH und DELETE nicht durch.** Jede Änderung an Quellen und Notizen
   scheiterte im Browser am Preflight, während alle serverseitigen Tests grün blieben —
   `app.inject` sendet keinen Preflight. Gefunden im E2E-Lauf über die Browserkonsole.
3. **Auswahlkästchen sprang zurück,** weil es auf die Serverantwort wartete. Gefunden im
   E2E-Lauf.
4. **Wettlauf beim schnellen Umschalten:** eine spät eintreffende ältere Antwort stellte die
   Auswahl wieder um. Gefunden im E2E-Lauf, nur im Zusammenspiel zweier Tests.
5. **Kopfleiste lief bei 390 px aus dem Bild.** Gefunden beim Betrachten eines
   Bildschirmfotos, von keinem Test abgedeckt — jetzt schon.
6. **Fachfremde Frage wurde scheinbar beantwortet,** weil `hoch*` „Hochschule" traf.
   Gefunden durch einen Test, der bewusst nach etwas außerhalb des Korpus fragte.
7. **Zwei gleichrangige Textfarben am Zitatmarker.** Welche gewinnt, entscheidet die
   Reihenfolge im erzeugten CSS — im dunklen Thema fiel der Kontrast auf 2,65:1. Gefunden
   durch die Kontrastmessung, nicht durch einen Test.
8. **Ein später Erstabruf überschrieb die Quellenauswahl.** Die Anwendung fragte dann
   andere Quellen ab, als angezeigt waren. Gefunden im E2E-Lauf — erst sichtbar, nachdem
   ein schnellerer Seitenaufbau das Zeitfenster geöffnet hatte.
9. **`pnpm test` scheiterte auf einem frischen Checkout.** `@notebook/shared` zeigt auf
   `dist/`, das nur `pnpm verify` baute. Gefunden vom Auftraggeber beim ersten eigenen
   Aufruf — die CI hätte es nie gemerkt, weil sie das Paket in einem eigenen Schritt baute
   und damit einen anderen Weg ging als eine Person nach dem Klonen.

10. **Das Teilen-Menü wurde unten abgeschnitten,** weil es im Scrollbereich des Chats lag.
    Gefunden im Bildschirmfoto der Demo, von keinem Test. Jetzt am `document.body`, klappt
    bei Platzmangel nach oben.
11. **Der Belegsprung blieb aus, wenn die Quelle nach dem Beleg ankam.** Der Effekt hing nur
    am Beleg. Gefunden im Bildschirmfoto: die Quellansicht stand oben statt an der Stelle.
12. **Ein Sprachwechsel verwarf Chatverlauf und offene Quelle,** weil der API-Client an der
    Übersetzungsfunktion hing und mit ihr neu entstand. Gefunden im Mobil-Bildschirmfoto
    nach dem Umschalten („Keine Quelle geöffnet").
13. **Dateinamen mit Umlaut kamen als `download` an** (Blob-URL, Chromium). Gefunden beim
    tatsächlichen Herunterladen; Umlaute werden jetzt umschrieben.
14. **Die Kopfzeile lief bei 390 px über,** weil die deutsche Plakette „Kein Modell
    verbunden" plus drei Knöpfe breiter als der Bildschirm waren. Gefunden vom E2E-Test.
15. **Die E2E-Auswahlhilfe stellte nichts um,** weil sie die Kästchen zählte, bevor die
    Quellen ankamen — der Chat erscheint seit dem Umbau zuerst. Ein Testfehler, kein
    Anwendungsfehler; gefunden durch Mitschnitt der Netzwerkaufrufe (kein PATCH).

## Nächste sinnvolle Schritte

1. Einen echten Endpunkt anbinden und P5 prüfen — alles Übrige hängt daran.
2. Belegtreue von zwei bis drei Modellen an einem echten Korpus messen und die Quote
   `exact` gegenüber `chunk` festhalten.
3. CI einmal laufen lassen und die Workflows nachziehen.
4. Pages nach diesem Stand erneut ansehen; die Bildschirmfotos in der README zeigen noch
   den Kopfbereich vor dem Umbau.
5. CD-Umsetzung mit cd@zv.uni-freiburg.de abstimmen; huskynarr-Werte vom Besitzer der Seite
   erfragen und eintragen.
6. Erst danach PDFs als Erweiterung.

## Einschränkungen der Entwicklungsumgebung

Relevant, weil sie bestimmen, was lokal überhaupt geprüft werden konnte:

- Kein Docker, kein Postgres, keine Root-Rechte. Mitentscheidend für D-006.
- Der Playwright-Browser ließ sich nicht herunterladen; der E2E-Lauf nutzte über
  `CHROMIUM_PATH` einen vorhandenen Chromium.
- Im verbundenen Projektordner dürfen keine Dateien gelöscht werden. Git kann dort seine
  Sperrdateien nicht entfernen, weshalb während der Arbeit außerhalb des Ordners committet
  und hineingespiegelt wurde.
- Im Ordner liegen aus Zwischenschritten drei unversionierte Reste, die von Hand gelöscht
  werden müssen: `.transfer-tmp.tar`, `.tmp/` (Übertragungsarchive) und
  `apps/web/src/preview/previewClient.ts` — der Vorläufer des Demo-Clients aus D-016, der
  gegen die heutige Schnittstelle nicht mehr typprüft. Solange er dort liegt, schlägt
  `pnpm typecheck` in diesem Ordner fehl; im Repository ist er nicht enthalten.


### 2026-09-22 · Zwischenstand 01

build(ci): vereinheitliche Qualitätsprüfung und lokale Hooks. Codex bearbeitete die zugehörigen Dateien.
Prüfung dieses isolierten Zwischenstands: `pnpm verify` im verpflichtenden Commit-Hook.
Die nachfolgenden Produktänderungen sind in diesem Commit noch nicht enthalten.


### 2026-09-22 · Zwischenstand 02

fix(api): validiere Zugangskonfiguration und API-Grenzen. Codex bearbeitete die zugehörigen Dateien.
Prüfung dieses isolierten Zwischenstands: `pnpm verify` im verpflichtenden Commit-Hook.
Die nachfolgenden Produktänderungen sind in diesem Commit noch nicht enthalten.
