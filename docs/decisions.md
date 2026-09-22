# Entscheidungen

Neueste zuerst. Ein Eintrag wird nie umgeschrieben. Eine Umkehr bekommt einen neuen Eintrag,
der auf den alten verweist.

---

## D-007 · 2026-09-17 · Belege als Zeichen-Offsets, serverseitig validiert

**Entscheidung:** Ein Beleg ist ein Tripel aus Quell-ID, Start- und End-Zeichenoffset im
gespeicherten Originaltext. Das Modell wird angewiesen, Marker `[n]` zu setzen, die auf die
nummerierten Chunks des aktuellen Abrufs zeigen. Vor der Auslieferung prüft das Backend
jeden Marker gegen die tatsächlich abgerufenen Chunks; nicht auflösbare Marker werden
entfernt.

**Grund:** Der Produktkern ist die Prüfbarkeit einer einzelnen Aussage. Offsets erlauben
Hervorhebung exakt der belegenden Zeichen, unabhängig davon, wie das Frontend den Text
darstellt. Die Validierung verhindert, dass ein erfundener Marker wie ein Beleg aussieht.

**Verworfen:** Belege nur auf Dokumentebene (nicht prüfbar, das ist genau das Problem des
Marktstandards). Belege als vom Modell wiederholtes Zitat (Modelle verändern Zitate beim
Abschreiben; der Abgleich würde scheitern oder falsch positiv ausgehen).

---

## D-006 · 2026-09-17 · SQLite als Persistenz, Postgres-Adapter mitgeplant

**Entscheidung:** Persistenz über eine SQLite-Datei mit FTS5 für den lexikalischen Abruf.
Der Zugriff läuft über Repository-Interfaces, sodass ein Postgres-Adapter später ohne
Umbau der Domänenschicht ergänzt werden kann.

**Grund:** "Lokale Persistenz" und "keine umfangreiche Vektor-Infrastruktur" sind gesetzte
Anforderungen. SQLite braucht keinen Serverprozess, keinen Container und keine Ports. Die
Entwicklungsumgebung bleibt bei `pnpm install && pnpm dev`.

**Verworfen:** Postgres + pgvector (am 17.09. zunächst gewählt, am selben Tag revidiert,
nachdem "lokale Persistenz" und "keine umfangreiche Vektor-Infrastruktur" als Anforderungen
ergänzt wurden). Postgres hätte für Entwicklung und Test einen laufenden Datenbankserver
vorausgesetzt; auf der Zielumgebung stehen weder Docker noch Postgres noch Root-Rechte
zur Verfügung. Ersetzt insofern die frühere Festlegung; der Postgres-Adapter bleibt als
Erweiterungspunkt vorgesehen.

---

## D-005 · 2026-09-17 · Lexikalischer Abruf als Standard, Embeddings als Erweiterung

**Entscheidung:** Standard-Retrieval ist BM25 über FTS5 auf Absatz-Chunks. Ein
Embedding-basiertes Reranking ist hinter demselben Interface vorgesehen und per
Konfiguration abschaltbar; es ist in v0.1 nicht aktiv.

**Grund:** Lexikalische Treffer sind nachvollziehbar — man sieht, warum ein Chunk gefunden
wurde. Das stützt den Qualitätsfokus. Embeddings verlangen ein zweites Modell, einen
Indexaufbau und Speicher für Vektoren, ohne dass für den ersten Anwendungsfall belegt wäre,
dass sie nötig sind.

**Verworfen:** Vektorabruf als Standard (mehr Infrastruktur, keine erhobene Evidenz für
Mehrwert bei konkreten Fragen an einen kleinen Korpus). Offene Annahme 2 in
`docs/product.md` hält fest, dass das ungeprüft ist.

---

## D-004 · 2026-09-17 · OpenAI-kompatibler Provider-Adapter

**Entscheidung:** Das Backend spricht die OpenAI-Chat-Completions-Schnittstelle. Basis-URL,
Modellname und Schlüssel kommen aus Umgebungsvariablen des Backend-Prozesses.

**Grund:** Dieselbe Schnittstelle bedienen vLLM, Ollama, LiteLLM, Azure und OpenAI selbst.
Die Entscheidung, welches Modell die Universität betreibt, ist offen (offene Annahme 3) und
darf den Bau nicht blockieren.

**Verworfen:** Festlegung auf einen Anbieter (blockiert auf eine ungeklärte
Datenschutzfrage). Eine eigene Abstraktion über mehrere Anbieter-SDKs (mehr Code, kein
zusätzlicher Nutzen, solange alle Kandidaten OpenAI-kompatibel sprechen).

---

## D-003 · 2026-09-17 · Fester Zugang statt Nutzerverwaltung

**Entscheidung:** Ein einziges, per Umgebungsvariable konfigurierbares Zugangspaar
(Vorgabe `admin:admin`), Sitzung über ein signiertes Token. Keine Registrierung, keine
Rollen, keine Nutzertabelle.

**Grund:** Der Dienst läuft lokal für eine Person. Nutzerverwaltung ist ausdrückliches
Nicht-Ziel und wäre Infrastruktur ohne Anforderung.

**Verworfen:** OIDC gegen das Uni-Login (richtig für einen zentralen Betrieb, aber der ist
nicht das Ziel). Gar keine Absicherung (der Dienst gibt Dokumentinhalte aus; ein Riegel
gegen versehentliche Erreichbarkeit ist billig).

**Achtung:** Diese Entscheidung setzt voraus, dass der Dienst nicht im Netz erreichbar ist.
Siehe offene Annahme 7.

---

## D-002 · 2026-09-17 · Monorepo mit pnpm-Workspaces

**Entscheidung:** Ein Repository mit `apps/web`, `apps/api`, `packages/shared`.
Geteilte Typen und zod-Schemas liegen in `packages/shared` und sind die einzige Quelle der
Wahrheit für den API-Vertrag.

**Grund:** Frontend und Backend ändern sich gemeinsam. Ein geteiltes Schema-Paket macht
Vertragsbrüche zu Typfehlern statt zu Laufzeitfehlern.

**Verworfen:** Zwei Repositories (Vertragsdrift, doppelte Release-Koordination).
Generierter Client aus OpenAPI (zusätzlicher Generierungsschritt; bei einem gemeinsam
versionierten Monorepo kein Gewinn).

---

## D-001 · 2026-09-17 · Eigenes Design statt Komponentenbibliothek

**Entscheidung:** Eigene Komponenten auf Tailwind-Basis, mit semantischen Design-Tokens im
Tailwind-Theme. Für Verhalten ohne eigenes Aussehen (Dialog, Tabs, Fokusfallen) werden
unstyled Primitives verwendet.

**Grund:** "Eigenes Design" ist gesetzte Anforderung. Eine Bibliothek mit eigenem Theming
brächte eine zweite Styling-Ebene und damit einen Verstoß gegen Regel 3 in `AGENTS.md`.

**Verworfen:** Fertige Komponentenbibliothek mit Theme (schneller, aber erkennbar fremdes
Erscheinungsbild und doppelte Token-Haltung).

---

## D-008 · 2026-09-17 · SQLite aus Nodes Standardbibliothek statt `better-sqlite3`

**Entscheidung:** Datenbankzugriff über `node:sqlite` (in Node 22 vorhanden, dort noch als
experimentell gekennzeichnet). Keine Datenbank-Abhängigkeit in `package.json`.

**Grund:** `better-sqlite3` wird beim Installieren nativ übersetzt und lädt dafür
Node-Header nach. In der Zielumgebung schlug das fehl (HTTP 403 auf `nodejs.org` durch den
ausgehenden Proxy) — geprüft am 2026-09-17. Die eingebaute Variante bringt SQLite 3.51.3
samt FTS5 und `bm25()` mit; geprüft mit einem Testskript, das eine FTS5-Tabelle anlegt,
füllt und nach BM25 sortiert abfragt. Damit entfällt ein Übersetzungsschritt und eine
Abhängigkeit.

**Preis:** Node gibt beim Start eine `ExperimentalWarning` aus. Die Schnittstelle kann sich
in künftigen Node-Versionen ändern; der Zugriff ist deshalb in `db/database.ts` gekapselt.

**Verworfen:** `better-sqlite3` (ließ sich nicht installieren), `sql.js` (hält alles im
Speicher und schreibt die Datei am Stück — bei Dokumentkorpora riskant), ein
Datenbankserver (widerspricht der Anforderung "lokale Persistenz").

---

## D-009 · 2026-09-17 · Belegpräzision wird mit ausgeliefert

**Entscheidung:** Jeder Beleg trägt ein Feld `precision`. `exact` bedeutet, dass das
wörtliche Zitat des Modells im abgerufenen Abschnitt wiedergefunden wurde und die Offsets
genau diese Zeichen umfassen. `chunk` bedeutet, dass es nicht auffindbar war und die
Offsets den ganzen Abschnitt umfassen.

**Grund:** Andernfalls sähen beide Fälle im UI gleich aus und würden eine Genauigkeit
suggerieren, die im zweiten Fall nicht besteht — eine unmarkierte Simulation im Sinne von
Regel 5.

**Verworfen:** Belege ohne auffindbares Zitat verwerfen (verliert korrekte Belege, nur weil
das Modell beim Abschreiben ein Zeichen verändert hat). Immer den ganzen Abschnitt
markieren (verschenkt den Kern des Produkts).

---

## D-010 · 2026-09-17 · Auswahl wird optimistisch angezeigt, Serverantwort nicht übernommen

**Entscheidung:** Das Auswahlkästchen einer Quelle stellt sich sofort um; gespeichert wird
danach. Die Antwort des Servers wird im Erfolgsfall **nicht** in den Zustand übernommen, nur
im Fehlerfall wird die Anzeige zurückgenommen.

**Grund:** An den Serverzustand gebunden sprang das Kästchen nach dem Klick sichtbar zurück.
Die Antworten kommen zudem nicht zwingend in der Reihenfolge der Anfragen zurück — eine spät
eintreffende ältere Antwort stellte die Auswahl wieder um, sodass stillschweigend andere
Quellen abgefragt wurden, als angezeigt waren.

**Verworfen:** Kästchen während der Anfrage sperren (macht schnelles Ab- und Anwählen
unbenutzbar). Antworten über eine Folgenummer verwerfen (löst dasselbe Problem mit mehr
Zustand, ohne zusätzlichen Nutzen, solange nur ein Feld geändert wird).

---

## D-011 · 2026-09-17 · End-to-End-Prüfung gegen den Offline-Modus

**Entscheidung:** Der Playwright-Lauf startet Backend und Frontend selbst und läuft gegen
`LLM_PROVIDER=stub`. Kein Modell, keine Netzabhängigkeit.

**Grund:** Der Offline-Modus setzt echte Marker auf die tatsächlich abgerufenen Abschnitte.
Damit lässt sich die gesamte Belegkette prüfen — Abruf, Validierung, Klick, Hervorhebung —
ohne dass das Ergebnis von der Tagesform eines Modells abhängt.

**Preis, ausdrücklich benannt:** Die Qualität einer Modellantwort ist damit **nicht**
geprüft. Das steht als Kommentar in der Spezifikation und als offener Punkt in
`docs/progress.md`. Die Prüfung ersetzt keine Messung an einem echten Modell.

**Verworfen:** E2E gegen ein echtes Modell (kein Endpunkt vorhanden, und ein Testergebnis,
das vom Modell abhängt, ist als Regressionsprüfung wertlos).

---

## D-012 · 2026-09-18 · Corporate Design der Universität Freiburg übernommen

**Entscheidung:** Das eigene Farb- und Schriftsystem wird durch das CD der Universität
Freiburg (<https://cd.uni-freiburg.de>) ersetzt: Blau `#344A9A` als Bedienfarbe, Sand als
Flächenfarbe, Schwarz für Text, Hausschrift Social mit Arial als Zweitschrift, linksbündiger
Flattersatz. Die Belegmechanik behält eine eigene, ausschließlich ihr vorbehaltene Farbe —
dafür wird CD-Grün `#00a082` verwendet.

**Grund:** Die Anwendung wird an der Universität betrieben. Ein eigenes Erscheinungsbild
neben dem CD wäre für Nutzende ein Fremdkörper.

**Die eine Einschränkung, die den Zuschnitt bestimmt hat:** CD-Grün hält als **Textfarbe**
auf hellem Grund nur rund 3,3:1 und ist damit nicht barrierearm. Der Beleg ist deshalb eine
grüne **Fläche** mit schwarzer Schrift, nicht grüne Schrift. Gemessen: 6,35:1 im hellen und
7,93:1 im dunklen Thema.

**Verworfen:** Alles in Blau und den Beleg nur über Form unterscheiden (der Beleg fällt im
Fließtext dann spürbar weniger auf, und das ist der Produktkern). CD-Braun statt Grün
(ruhiger, aber auf Sand deutlich weniger auffällig). Das bisherige eigene Design behalten
(kein Bezug zur Universität).

**Nicht gedeckt vom CD** und daher in `docs/design-system.md` Abschnitt 10 einzeln
aufgeführt: die Zusatzfarbe als tragendes Element, das dunkle Thema, Rot für Fehler,
Grautöne für Metatext, das fehlende Logo. Vor einer förmlichen Abnahme mit
cd@zv.uni-freiburg.de abzustimmen.

---

## D-013 · 2026-09-18 · Hausschrift optional, Arial als ausgelieferte Schrift

**Entscheidung:** Die Schriftkaskade nennt zuerst `Social`, danach Arial. Die
`@font-face`-Regeln liegen in `apps/web/public/fonts/social.css`; die lizenzpflichtigen
Schriftdateien gehören in denselben Ordner und sind in `.gitignore` ausgeschlossen.

**Grund:** Social ist lizenzpflichtig und darf nicht im Repository liegen. Wer die Lizenz
hat, legt die Dateien ab und bekommt die Hausschrift ohne Bauschritt; alle anderen sehen
Arial — die vom CD selbst vorgesehene Zweitschrift. Geprüft, dass das trägt:
`document.fonts.check('16px Social')` ist `false`, und die gemessene Textbreite stimmt exakt
mit Arial überein.

**Warum in `public/` statt in `src/`:** Vite verarbeitet `public/` nicht. Lägen die Regeln in
`src/styles/theme.css`, meldete jeder Build sechs Warnungen über nicht auflösbare
Schriftpfade — Lärm, der echte Warnungen zudeckt.

**Verworfen:** Nur Arial (die Anwendung sähe auch mit Lizenz nicht nach Hausschrift aus).
Eine freie Schrift als Ersatz für Social (widerspricht dem Schriftsystem, ohne den
Lizenzweg zu ersparen).

---

## D-014 · 2026-09-18 · Quellenspalte zeigt während des Ladens keine Auswahl

**Entscheidung:** `sources` ist `null`, solange der Abruf läuft; die Spalte zeigt dann einen
Ladehinweis statt der Kästchen. Zusätzlich verwirft der Ladeeffekt seine Antwort, wenn
inzwischen das Notebook gewechselt wurde.

**Grund:** Wurde ein Kästchen umgestellt, bevor der erste Abruf zurückkam, überschrieb
dessen Antwort die Auswahl wieder — die Anwendung fragte dann andere Quellen ab, als
angezeigt waren. Der Fall trat erst zutage, nachdem das Entfernen der Schriftpakete den
Seitenaufbau beschleunigt hatte; vorher verdeckte die Ladezeit der Schriften das Zeitfenster.

**Verworfen:** Antworten über eine Folgenummer verwerfen (löst den Fall zwischen zwei
Umschaltungen, nicht den zwischen Laden und Umschalten). Kästchen während der Anfrage sperren
(macht schnelles Ab- und Anwählen unbenutzbar, siehe D-010).

---

## D-015 · 2026-09-18 · Designs sind Token-Sätze, umschaltbar in den Einstellungen

**Entscheidung:** Ein Design ist ausschließlich ein Satz von Token-Werten, gesetzt über
`data-design` am Wurzelelement. Drei Designs (`eigen`, `uni-freiburg`, `huskynarr`), je
hell und dunkel, wählbar in den Einstellungen; die Wahl liegt im `localStorage` und wird
vor dem ersten Zeichnen angewendet. Die Paletten stehen als Daten in
`tools/build-theme.py`, `theme.css` wird erzeugt.

**Grund:** Der Auftraggeber will die Designs nebeneinander ansehen — das ist der Zweck eines
Frontend-Tests. Ein Design pro Branch (D-012 wurde zunächst so umgesetzt) erlaubt das nicht.
Die Trennung „Komponenten kennen nur Rollen, Designs liefern nur Werte" war bereits angelegt;
die Umschaltung ist ihre Konsequenz.

**Verworfen:** Ein Design pro Branch (nicht vergleichbar). Bedingte Klassen in den
Komponenten (`design === 'uni' ? … : …`) — jede Komponente wüsste dann von jedem Design, und
ein viertes Design hieße, jede Komponente anzufassen. Von Hand geschriebene `theme.css` —
sechs Blöcke mit je vierzig Werten sind eine sichere Quelle für vergessene Tokens.

**Der Branch `design/uni-freiburg` bleibt** als Schnappschuss des Stands „CD allein, ohne
Umschalter" liegen und wird nicht weiterentwickelt.

---

## D-016 · 2026-09-18 · Vorschau ohne Backend statt statisches Frontend

**Entscheidung:** Für GitHub Pages wird das Frontend mit `VITE_PREVIEW=true` gebaut. Es
läuft dann gegen einen `PreviewClient` im Browser, der dieselbe Schnittstelle erfüllt wie der
API-Client, die Beispieltexte mit demselben `chunkText` zerlegt und zu einer Frage die
passenden Abschnitte findet. Ein dauerhaftes Banner, der Hinweis am Login und
`simulated: true` in jeder Antwort kennzeichnen den Zustand.

**Grund:** Pages liefert nur statische Dateien. Das nackte Frontend bliebe am Login hängen;
ein Besucher sähe genau einen Bildschirm. Für einen Frontend-Test ist die begehbare
Oberfläche der Zweck. Die Vorschau erfindet nichts: sie formuliert keine Antwort (kein
Modell, kein Schlüssel im Frontend — Regel 4), und die Belege zeigen auf echte
Zeichenpositionen in den Beispieltexten.

**Verworfen:** Nur das nackte Frontend (zeigt nichts). Eine Dokumentationsseite statt der
Anwendung (zeigt das Design nicht in Bewegung). Eine „Demo" mit vorformulierten Antworten
(eine unmarkierte Simulation im Sinne von Regel 5 — genau das, was das Produkt vermeiden
soll).

**Preis, ausdrücklich:** Die Vorschau ist ein zweiter Abrufpfad mit einer einfacheren
Bewertung als BM25. Sie darf nie als Beleg dafür gelten, wie der Server abruft.

---

## D-017 · 2026-09-18 · Demo statt Vorschau: die Anwendung selbst steht online

**Ersetzt D-016 in der Ausgestaltung, nicht im Prinzip.** Die Ausgabe auf GitHub Pages ist
ein Frontend-Test für eine Bewerbung; ein Prüfer soll die Anwendung bedienen, nicht eine
Vorführung ansehen. Die Zurückhaltung von D-016 — Warnbanner über der ganzen Seite,
Anmeldung als „Kulisse", keine Speicherung — war deshalb falsch justiert: sie erklärte an
jeder Stelle, was fehlt, statt zu zeigen, was da ist.

**Entscheidung:** Die Demo verhält sich wie der Server mit `LLM_PROVIDER=stub`. Die Anmeldung
prüft `admin:admin`. Notebooks, Quellen, Auswahl und Notizen liegen im `localStorage` und
überleben das Neuladen; die Sitzung liegt wie beim Server im `sessionStorage`. Belege
entstehen aus demselben `chunkText` und zeigen auf echte Zeichenpositionen.

**Was gekennzeichnet bleibt — und nur das:** Es ist kein Sprachmodell angebunden. Die
Plakette in der Kopfleiste und der Hinweis an jeder Antwort sagen es; `simulated: true`
steht in jeder Antwort. Das ist dieselbe Kennzeichnung wie beim Server ohne Modell — nicht
mehr, weil mehr die Bedienung überlagert, und nicht weniger, weil weniger Regel 5 verletzt.

**Verworfen:** Ein echtes Modell über einen vom Prüfer eingegebenen Schlüssel („bring your
own key") — möglich, aber nicht verlangt; wäre der nächste Schritt, wenn die Demo echte
Antworten zeigen soll.

---

## D-018 · 2026-09-18 · Zweisprachige Oberfläche ohne i18n-Bibliothek

**Entscheidung:** Alle sichtbaren Texte liegen in `apps/web/src/i18n/{de,en}.ts` unter einem
gemeinsamen Schlüsseltyp; `useT()` liefert die Funktion, Platzhalter stehen als `{name}` im
Text. Die Sprache kommt aus `localStorage` (`notebook.lang`), sonst aus
`navigator.language`; die Einführung beim ersten Start fragt sie ab. Die Antwortsprache
geht als `language` an die API und den Demo-Client, damit Offline-Antworten und Hinweise in
derselben Sprache erscheinen wie die Oberfläche.

**Grund:** Zwei Sprachen, keine Pluralregeln, keine Formate — eine Bibliothek brächte mehr
Konfiguration als Nutzen (Regel 6). Der Schlüsseltyp lässt `tsc` fehlende Texte finden;
ein Test prüft, dass beide Sprachen dieselben Platzhalter tragen.

**Verworfen:** `i18next`/`react-intl` (Gewicht ohne Bedarf). Texte im JSX belassen und nur
Englisch anbieten (der Auftraggeber wollte beides).

---

## D-019 · 2026-09-18 · Webseiten und Endpunkte als Quelle — der Server holt, die Demo sagt es ehrlich

**Ergänzt D-002 und hebt ein Nicht-Ziel aus `docs/product.md` teilweise auf.** Eine einzelne
Adresse als Quelle ist erlaubt; Crawling und Recherche bleiben ausgeschlossen.

**Entscheidung:** `POST /v1/notebooks/:id/sources` nimmt `kind: 'url'` an. Der Server ruft
die Adresse ab (nur `http(s)`, 15 s, 2 MB, höchstens 3 Weiterleitungen), verwirft private
und lokale Ziele nach der Namensauflösung (SSRF-Schutz), zieht aus HTML den Text ohne
Skripte, Navigation und Fußzeilen und speichert ihn als gewöhnliche Quelle mit `origin`. Der
Original-Link bleibt in der Quellansicht sichtbar. Belege zeigen auf den extrahierten
Text — was gespeichert ist, ist genau das, worauf verwiesen wird.

**Demo ohne Server:** Der Browser versucht den Abruf selbst. Sperrt die Zielseite ihn (CORS),
sagt der Dialog genau das und benennt den Unterschied zum Betrieb mit Backend. Ein
Proxy-Dienst zum Umgehen wäre Infrastruktur ohne Auftrag (Regel 6) — und würde die Grenze
der Demo verschleiern (Regel 5).

**Verworfen:** Ein öffentlicher CORS-Proxy in der Demo. Die Seite zu rendern statt den Text
zu extrahieren (Belege brauchen Zeichenpositionen in einem festen Text).

---

## D-020 · 2026-09-18 · Teilen als Export im Browser: Markdown, Word, PDF, PNG

**Entscheidung:** „Teilen" heißt hier Export in eine Datei — für das ganze Notebook (Kopf)
und für eine einzelne Antwort. Markdown entsteht aus den Daten; Word über `docx` ebenfalls
aus den Daten (Überschriften, Absätze, Belegliste); PDF über den Druckdialog des Browsers
mit einem eigenen Druck-Stylesheet, das genau das gewählte Element zeigt; PNG über
`html-to-image` vom Frage-Antwort-Block ohne Bedienelemente. Die beiden Bibliotheken liegen
in einem eigenen Chunk (~105 kB gzip) und laden erst beim ersten Teilen.

**Grund:** Der Auftraggeber wollte die vier Formate sichtbar an einem Knopf. Ein serverseitiger
PDF-Renderer wäre Infrastruktur (Regel 6); der Druckdialog liefert dasselbe Ergebnis mit
den Schriften der Anwendung. Datenbasierte Exporte (MD, DOCX) enthalten die Belegangaben
mit Zeichenpositionen und bleiben damit nachprüfbar; die Bildexporte sind Abbild, nicht
Beleg.

**Verworfen:** `jsPDF`/`pdfmake` (eigene Schriftbehandlung, zweite Typografie).
`react-to-print` (ein Stylesheet genügt). Ein „Teilen-Link" in der Demo — Daten liegen im
Browser des Betrachters; der Knopf kopiert die Adresse und sagt, dass Inhalte nicht mitgehen.

---

## D-021 · 2026-09-19 · Einwilligungsbanner ohne Cookies: zwei Klassen, Ablehnen wirkt

**Ausgangslage:** Die Anwendung setzt keine Cookies und kein Tracking; sie speichert nur im
Browser (Sitzung im `sessionStorage`, Demo-Daten und Einstellungen im `localStorage`).
Rechtlich verlangt das kein Banner. Der Auftraggeber wollte ein CMP; ein Banner, das
Kategorien zeigt, die es nicht gibt, wäre eine unmarkierte Simulation (Regel 5).

**Entscheidung:** Zwei Klassen, die es tatsächlich gibt. „Notwendig" (Sitzung; in der Demo
Notebooks, Quellen, Notizen) ist immer aktiv. „Einstellungen merken" (Sprache, Design,
Erscheinungsbild, Spaltenbreiten, Einführung gesehen) ist wählbar — und die Wahl wirkt:
ohne Zustimmung landen diese Schlüssel nur im `sessionStorage` und verschwinden mit dem
Tab; eine Ablehnung räumt vorhandene Schlüssel aus dem `localStorage`. Die Entscheidung
selbst liegt im `localStorage` (Klasse „Notwendig"), sonst fragte das Banner bei jedem
Start. Änderbar jederzeit in den Einstellungen. Das Banner ist nicht modal, „Alle
akzeptieren" und „Nur notwendige" sind gleich groß und gleich erreichbar.

**Reihenfolge beim ersten Start:** erst Einwilligung, dann Einführung — die Einführung
speichert bereits Einstellungen, und zwei Dialoge zugleich überfordern.

**Verworfen:** Eine Kategorie „Statistik" ohne Anbindung (zeigt CMP-Form, täuscht aber
Tracking vor). Eine Bibliothek (Klaro, CookieConsent): bringt Cookie-Logik und Skript-
Blockierung mit, die es hier nicht zu blockieren gibt (Regel 6).

---

## D-022 · 2026-09-19 · Repository-Hygiene: MIT, Community-Dateien, Releases aus Commits

**Entscheidung:** Lizenz MIT (Rechteinhaber Sebastian Selinger). `CONTRIBUTING.md` fasst
`AGENTS.md` für Menschen zusammen, `CODE_OF_CONDUCT.md` folgt dem Contributor Covenant 2.1,
`SECURITY.md` nennt den privaten Meldeweg und das Angriffsbild (SSRF-Schutz beim Abruf von
Adressen), `CODEOWNERS` und Issue-Vorlagen (Fehler, Vorschlag) kommen dazu.

**Pipeline:** CodeQL bei Push, PR und wöchentlich; Dependabot wöchentlich, gebündelt nach
minor/patch; Playwright-Bericht wird immer hochgeladen, nicht nur bei Fehlern; die
Bundle-Größe (roh und gzip, `tools/bundle-size.mjs`) steht in jeder Lauf-Zusammenfassung
und als fortgeschriebener Kommentar am PR; jeder PR bekommt die Demo als Artefakt.

**Releases:** `release-please` ersetzt den handgestarteten Release-Workflow. Es liest die
Commit-Präfixe, hält einen Release-PR mit `CHANGELOG.md` und Versionssprung offen und
erzeugt beim Merge Tag und GitHub-Release; die drei Paket-Versionen werden über
`extra-files` mitgezogen. Grund: Der alte Workflow verlangte die Wahl patch/minor/major von
Hand — genau die Information, die Conventional Commits schon tragen (Regel 2). Er braucht in
den Repository-Einstellungen „Allow GitHub Actions to create and approve pull requests".

**Nicht gemacht — Vorschau-Adresse je PR:** GitHub Pages kennt eine Seite je Repository;
eine eigene Adresse je PR bräuchte einen anderen Host (Netlify, Cloudflare Pages) und damit
Infrastruktur ohne Auftrag (Regel 6). Das Artefakt je PR ist der ehrliche Ersatz.


### 2026-09-22 · Entscheidung 01

build(ci): vereinheitliche Qualitätsprüfung und lokale Hooks. Codex bearbeitete die zugehörigen Dateien.
Prüfung dieses isolierten Zwischenstands: `pnpm verify` im verpflichtenden Commit-Hook.
Die nachfolgenden Produktänderungen sind in diesem Commit noch nicht enthalten.


### 2026-09-22 · Entscheidung 02

fix(api): validiere Zugangskonfiguration und API-Grenzen. Codex bearbeitete die zugehörigen Dateien.
Prüfung dieses isolierten Zwischenstands: `pnpm verify` im verpflichtenden Commit-Hook.
Die nachfolgenden Produktänderungen sind in diesem Commit noch nicht enthalten.


### 2026-09-22 · Entscheidung 03

fix(api): sichere Notizbelege und begrenze Dokumentexporte. Codex bearbeitete die zugehörigen Dateien.
Prüfung dieses isolierten Zwischenstands: `pnpm verify` im verpflichtenden Commit-Hook.
Die nachfolgenden Produktänderungen sind in diesem Commit noch nicht enthalten.


### 2026-09-22 · Entscheidung 04

fix(api): begrenze Anmeldeversuche und Quellenimporte. Codex bearbeitete die zugehörigen Dateien.
Prüfung dieses isolierten Zwischenstands: `pnpm verify` im verpflichtenden Commit-Hook.
Die nachfolgenden Produktänderungen sind in diesem Commit noch nicht enthalten.
