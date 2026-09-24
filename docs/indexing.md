# Warum der Quellenindex so aufgebaut ist

Der Index soll vor allem **vom Antwortmarker zur tatsächlichen Stelle im
hochgeladenen Originaltext führen**. `packages/shared/src/chunking.ts` erzeugt
Abschnitte; `apps/api/src/db/schema.sql` und `drizzle/0000_sites.sql` indexieren
sie; `apps/api/src/domain/retrieval.ts` wählt Treffer aus. Die Worker-Variante
liegt in `apps/api/src/sites/sources.ts` und `sites/ask.ts`.

## 1. Das unveränderliche Original ist die Referenz

Für jeden Abschnitt gilt `original.slice(startOffset, endOffset) === text`.
Offsets sind **UTF-16-Codeeinheiten von JavaScript**, keine UTF-8-Bytes und
keine Zeilennummern. UTF-8-Bytes bestimmen nur Upload- und Transportlimits.
Das Original wird nach dem Import nicht umgeschrieben; sonst markiert ein
vormals gültiger Beleg die falsche Stelle. Leere Zeilen zwischen vereinigten
Absätzen gehören deshalb zum Chunk. Überschriften sind Metadaten des Pfads,
kein erfundener Teil der Textstelle.

## 2. Absatz und Abschnitt vor starrer Fenstergröße

Markdown-Überschriften setzen den `headingPath`; Fließtext ohne Markdown bleibt
ebenfalls importierbar. Benachbarte Absätze im selben Überschriftenbereich
werden bis ungefähr **1.200 Zeichen** zusammengefasst. Das hält einen kurzen
Gedanken als zusammenhängenden Kontext und vermeidet Treffer, die mitten in
einem Satz beginnen. Ein Einzelblock jenseits **2.400 Zeichen** wird nach
Möglichkeit an Satzzeichen geteilt. Diese Werte sind **Startheuristiken**, kein
empirisch optimiertes Fenster und keine harte Garantie: ein Absatz ohne
geeignete Satzgrenze kann länger bleiben. Sites teilt extrem große Stücke für
den D1-Transport nochmals, unter Erhalt der Originaloffsets und ohne
Trennung zwischen UTF-16-Surrogathälften. Die Reihenfolge (`ordinal`) dient
der Anzeige und reproduzierbaren Zuordnung, nicht als Quellenbeweis.

Keine Überlappung: Derselbe Originalsatz soll nicht wegen doppelter Fenster
mehrfach als scheinbar unabhängiger Beleg auftauchen. Die Kehrseite ist, dass
ein Gedanke über Abschnittsgrenzen verteilt sein kann. Überschriften helfen
bei der Einordnung, ersetzen aber keinen Wortlaut im Original.

## 3. Warum FTS5 mit externem Inhalt?

`chunks` hält Text, Quell-ID, Reihenfolge, Offsets und Überschriftenpfad.
`chunks_fts` nutzt `content='chunks'` und `content_rowid='rowid'`, damit die
Volltextsuche nicht noch eine eigenständige Kopie des Abschnittstextes
verwaltet. Insert-/Delete-Trigger halten den Index synchron; lokal gibt es
auch einen Update-Trigger, während die Sites-Quelle unveränderlich importiert
wird. Die Quell-ID wird in der SQL-Abfrage gefiltert: Eine abgewählte Quelle
darf auch bei hohem Score keinen Modellkontext liefern.

`unicode61 remove_diacritics 2` und Präfix-Indizes für 2–4 Zeichen helfen bei
Unicode-Text und kurzen Suchanfängen. Die Anfrage entfernt Sonderzeichen und
häufige deutsche/englische Füllwörter; höchstens 24 unterschiedliche relevante
Wörter werden über `OR` verknüpft. Wörter ab fünf Zeichen werden als Präfix
gesucht, vierstellige Wörter exakt. Der kürzere Präfix `hoch*` ergab einen
fachfremden Treffer in „Hochschule“; die Prüfung steht in
`domain/retrieval.test.ts`. Präfixsuche ist keine sprachliche Lemmatisierung.

`-bm25(chunks_fts, 1.0, 0.4)` sortiert Treffer absteigend: Texttreffer zählen
stärker als Überschriftenpfade. Die Gewichte und **12 Treffer** im
Standardabruf begrenzen den Modellkontext pragmatisch, wurden aber nicht gegen
eine Goldstandard-Datenmenge optimiert. Ein hoher Score beweist weder die
Richtigkeit einer Quelle noch die inhaltliche Antwort auf die Frage.

## 4. Vom Treffer zum überprüfbaren Zitat

Der Prompt nummeriert ausschließlich die abgerufenen Treffer. Jede echte
inhaltliche Aussage benötigt einen Marker und ein wörtliches Zitat. Die API
prüft Marker gegen diesen Abruf und sucht Zitate im betreffenden Chunk; bei
typografischer Normalisierung rechnet sie die Position auf das unveränderte
Original zurück. Ist eine Referenz erfunden oder nicht auffindbar, hält die
API **die ganze echte Modellantwort** zurück. Die Offline-Fundstellen sind
sichtbar simuliert. Gespeicherte Notizen bewahren Belegauszüge; bei gelöschtem
Original wird dessen Fehlen kenntlich gemacht.

Diese technische Prüfung kann **nicht** entscheiden, ob ein Zitat eine
Interpretation wirklich trägt. Für Unternehmensdaten oder Prüfungsrecht sind
Originaldokument, Datum, Zuständigkeit und fachliche Prüfung entscheidend.

## Grenzen und Nachweise

### Optional: NVIDIA-Suchvektoren über OpenRouter

Der Server kann mit `EMBEDDING_PROVIDER=openrouter` und dem ausschließlich
serverseitig gesetzten `OPENROUTER_EMBEDDING_KEY` die ersten maximal 18
lexikalischen Treffer durch `nvidia/llama-nemotron-embed-vl-1b-v2:free`
neu sortieren; die 12 besten gehen in den Prompt. Der feste Endpunkt ist
`POST https://openrouter.ai/api/v1/embeddings`. Frage und Kandidatentexte
werden als `query:` und `passage:` kodiert und per Kosinusähnlichkeit
verglichen. Ohne FTS5-Treffer findet diese zweite Stufe keine Synonyme; sie
ist keine vollständige Vektorsuche. Quellfilter, Originaloffsets und
Zitierprüfung bleiben erhalten. Bei Providerfehlern wird die Anfrage mit
einer Fehlermeldung abgebrochen. Ein LLM für formulierte Antworten wird
dadurch nicht angeschlossen.

Der Free-Endpunkt protokolliert laut [OpenRouter-Modellkarte](https://openrouter.ai/nvidia/llama-nemotron-embed-vl-1b-v2:free)
alle Eingaben und Ausgaben zur Verbesserung des Dienstes und ist nur für
Tests mit öffentlichen, unkritischen Beispieldaten geeignet. Diese Funktion
bleibt standardmäßig aus; die Site benötigt einen gesonderten
OpenRouter-Schlüssel als Secret und eine bewusste Aktivierung. Tests prüfen
die Schnittstelle mit Antwort-Doubles, nicht die tatsächliche externe
Verfügbarkeit oder eine messbare Steigerung der Suchqualität.


Synonyme, fehlerhafte OCR, Tabellen, Komposita und mehrdeutige Aussagen können
Treffer verhindern oder irreführende Treffer erzeugen. Text-PDFs und OCR sind
noch kein Bestandteil des Imports. Tests in `packages/shared/src/chunking.test.ts`,
`apps/api/src/domain/retrieval.test.ts`, `domain/citations.test.ts` und
`sites/worker.test.ts` prüfen Originaloffsets, Quellenwahl und Ablehnung
ungültiger Zitate. Sie messen **nicht** die Antwortqualität eines externen
Modells. Änderungen an Chunker, Suche oder Belegprüfung benötigen dafür
konkrete zusätzliche Fälle.
