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
| 7 | Bildschirmfotos in die README aufgenommen | `docs/bilder/`, Abschnitt „So sieht es aus" | README als HTML gerendert und im Browser aufgerufen: alle vier Bilder laden, keine fehlende Ressource. |
| 8 | Corporate Design der Universität umgesetzt | Farb- und Schriftsystem, `docs/design-system.md`, D-012 bis D-014 | Farbwerte selbst über `cd.uni-freiburg.de/farben/` und `/schrift/` abgerufen, nicht aus dem Gedächtnis. Kontraste an der gebauten Oberfläche in beiden Themes gemessen. Der Rückfall auf Arial wurde nicht angenommen, sondern mit `document.fonts.check` und einer Breitenmessung belegt. |

**Dabei aufgefallen, gehört zur Ehrlichkeit des Protokolls:** Die erste Fassung der
Belegfarbe war falsch. CD-Grün als Textfarbe hält auf hellem Grund nur rund 3,3:1 — das kam
nicht aus der Planung, sondern aus der Messung, und hat den Zuschnitt geändert (Beleg als
Fläche statt als Schrift). Zwei weitere Fehler fanden sich erst im laufenden Programm:
konkurrierende Textfarben am Marker (2,65:1 im dunklen Thema) und ein Wettlauf zwischen
Erstabruf und Quellenauswahl. Keiner der drei wäre durch Lesen des Codes aufgefallen.

---

## Regeln für Einträge

- Jeder Eintrag nennt Datum, Werkzeug, Aufgabe und Prüfung.
- Generierter Code, der ungeprüft übernommen wurde, wird als solcher eingetragen.
- Nicht ausgeführte Prüfungen werden als nicht ausgeführt eingetragen, nicht weggelassen.
