# Produktdefinition

Stand: 2026-09-17 · Version 0.1.0 (in Entwicklung)

## Zielgruppe

Primär: Studierende und wissenschaftliche Mitarbeitende der Universität Freiburg, die mit
einem abgegrenzten, selbst zusammengestellten Textkorpus arbeiten — Vorlesungsskripte,
Seminarliteratur, Prüfungsordnungen, Protokolle, eigene Notizen.

Sekundär: Lehrende, die einen Materialstand für eine Veranstaltung durchsuchbar machen wollen.

Ausdrücklich nicht adressiert: Nutzende, die eine allgemeine Websuche oder einen
Allzweck-Chatbot suchen. Das Produkt antwortet nur aus den Quellen, die die Person selbst
hinzugefügt hat.

## Nutzungssituation

Eine Person hat zwischen 3 und 30 Textdokumenten zu einem Thema und eine konkrete Frage
dazu. Sie arbeitet allein, am Laptop, meist unter Zeitdruck, und muss das Ergebnis
weiterverwenden können — in einer Hausarbeit, einer Prüfungsvorbereitung, einer Mail an
das Prüfungsamt. Die Antwort muss belegbar sein, weil sie zitiert oder gegenüber Dritten
vertreten wird.

Das Frontend läuft lokal (`localhost`), die Backend-API-Adresse ist konfigurierbar. Die
Daten liegen lokal in einer Datei; es gibt keinen geteilten Serverzustand.

## Zentrales Problem

Allgemeine KI-Assistenten beantworten Fragen zu hochgeladenen Dokumenten flüssig, aber die
Antwort lässt sich nicht in vertretbarer Zeit gegen das Original prüfen. Entweder fehlt der
Beleg ganz, oder er nennt nur einen Dateinamen. Wer die Aussage zitieren muss, liest die
Quelle am Ende doch selbst — der Zeitgewinn ist ein Scheingewinn, und das Risiko einer
unbemerkt falschen Aussage bleibt bei der Person.

**Das Produkt löst genau das:** Jede Aussage ist in einem Klick auf die Textstelle
zurückführbar, aus der sie stammt. Nicht auf das Dokument — auf die Stelle.

## Hauptablauf

1. **Notebook öffnen** — ein Notebook ist ein abgegrenzter Arbeitsbereich mit eigenem
   Quellenbestand. Ein Beispiel-Notebook ist nach der Installation sofort vorhanden.
2. **Eigene Quelle hinzufügen** — Text einfügen oder eine `.txt`/`.md`-Datei hochladen.
   Die Quelle wird in Absatz-Chunks zerlegt, jeder Chunk behält Zeichen-Offsets in den
   Originaltext.
3. **Quellen auswählen** — pro Frage wird bestimmt, welche Quellen gelten. Die Auswahl ist
   sichtbar und wirkt sich unmittelbar auf den Abruf aus.
4. **Frage stellen** — das Backend ruft passende Chunks ab und lässt das Modell
   ausschließlich daraus antworten.
5. **Antwortbelege prüfen** — jede Aussage trägt Marker. Ein Klick öffnet die Quelle,
   springt zur Passage und hebt die belegenden Zeichen hervor.
6. **Ergebnis als Notiz speichern** — die Antwort wird mitsamt ihren Belegen ins Notebook
   übernommen und bleibt prüfbar, auch nachdem der Chat weitergelaufen ist.

## Pflichtumfang v0.1

Ohne diese Punkte ist die Version nicht abgenommen:

| # | Anforderung | Abnahmekriterium |
|---|---|---|
| P1 | Notebook-Verwaltung | Anlegen, umbenennen, löschen, öffnen; Liste überlebt Neustart |
| P2 | Text-/Markdown-Import | Einfügen und Datei-Upload `.txt`/`.md`; Original bleibt unverändert gespeichert |
| P3 | Text-/Markdown-Export | Notebook als Markdown exportierbar, inkl. Notizen und Belegangaben |
| P4 | Quellenwahl | Pro Anfrage aktivierbar/deaktivierbar; abgewählte Quellen erscheinen nachweislich nicht im Abruf |
| P5 | Echte KI-Antworten | Aufruf eines real konfigurierten, OpenAI-kompatiblen Endpunkts; kein fest verdrahteter Text |
| P6 | Überprüfbare Quellenverweise | Marker → Quell-ID + Zeichen-Offsets; Klick hebt die Stelle hervor; ungültige Marker werden serverseitig verworfen |
| P7 | Notizen | Antwort samt Belegen speicherbar, wiederauffindbar, bearbeitbar, löschbar |
| P8 | Lokale Persistenz | SQLite-Datei; kein Datenbankserver für Entwicklung oder Betrieb nötig |
| P9 | Sofort nutzbares Beispiel | Nach `pnpm install && pnpm dev` existiert ein Notebook mit Quellen und einer Beispielfrage |
| P10 | Einfache Zugangssicherung | Fester Zugang `admin:admin`, konfigurierbar; keine Nutzerverwaltung |

## Optionale Erweiterung

- **Textbasierte PDFs** als Quelltyp. Nur PDFs mit eingebetteter Textebene; keine OCR.
  Wird erst begonnen, wenn P1–P10 abgenommen sind, und muss dieselbe Offset-Genauigkeit
  liefern wie Text-Quellen — sonst wird es nicht ausgeliefert.

## Nicht-Ziele

Bewusst ausgeschlossen, nicht vergessen:

- Nutzerkonten, Registrierung, Rollen, Rechteverwaltung
- Zusammenarbeit, Teilen, Kommentare, Mehrbenutzerbetrieb
- Audio- oder Videogenerierung
- Beliebiges Website-Crawling oder Web-Recherche
- Umfangreiche Vektor-Infrastruktur (eigener Vektordatenbank-Dienst, Cluster, Index-Tuning)

## Qualitätsanforderungen

| Bereich | Anforderung | Prüfung |
|---|---|---|
| Nachvollziehbarkeit | 100 % der ausgelieferten Marker lösen auf einen real abgerufenen Chunk auf | automatisierter Test über die Validierungsschicht |
| Nachvollziehbarkeit | Klick auf Marker führt zur hervorgehobenen Originalstelle | End-to-End-Test |
| Ehrlichkeit | Decken die ausgewählten Quellen die Frage nicht, wird das gesagt, statt geraten | Test mit einer Frage außerhalb des Korpus |
| Sicherheit | Kein Geheimnis im ausgelieferten Frontend-Bundle | Test gegen den Build |
| Typsicherheit | `tsc --noEmit` fehlerfrei im Strict-Modus, kein `any` | CI |
| Bedienbarkeit | Tastaturbedienbar, sichtbarer Fokus, Kontrast mindestens AA | manuelle Prüfliste, dokumentiert |
| Betrieb | Start ohne Datenbankserver und ohne Container | CI baut und startet ohne Zusatzdienste |
| Leistung | Abruf und Zitatvalidierung unter 300 ms bei 30 Quellen (ohne Modellzeit) | Messung, Zahl wird nur berichtet, wenn gemessen |

## Offene Annahmen

Ungeprüft. Jede davon kann den Zuschnitt ändern; keine darf als Tatsache behandelt werden.

1. **Absatz-Chunking reicht.** Angenommen, Absätze sind für Skripte und Ordnungen die
   richtige Belegeinheit. Ungeprüft für Tabellen, Formelblöcke und Gesetzestexte mit
   Paragraphenstruktur.
2. **Lexikalischer Abruf trägt den Großteil.** Angenommen, BM25 auf deutschem Fachtext
   liefert für konkrete Fragen brauchbare Treffer. Ungeprüft, ab welcher Frage-Abstraktion
   Embeddings nötig werden.
3. **Ein OpenAI-kompatibler Endpunkt ist verfügbar.** Welcher (Uni-vLLM, Ollama lokal,
   externer Anbieter), ist nicht entschieden. Datenschutzfreigabe für externe Anbieter
   liegt nicht vor.
4. **Deutschsprachige Belegtreue der verfügbaren Modelle** ist nicht gemessen. Ob ein
   Modell Marker zuverlässig setzt, statt sie zu erfinden, muss pro Modell geprüft werden.
5. **30 Quellen sind die realistische Obergrenze** je Notebook. Nicht erhoben.
6. **Einzelnutzung auf dem eigenen Rechner** ist der Normalfall. Falls doch ein zentraler
   Betrieb gewünscht wird, fallen Nutzerkonten und Mandantentrennung an — beides ist
   aktuell Nicht-Ziel und nicht vorbereitet.
7. **`admin:admin` ist ausreichend**, weil der Dienst nur lokal erreichbar ist. Bei
   Erreichbarkeit im Netz ist diese Annahme sofort ungültig.
8. **Markdown-Export genügt** als Weiterverwendungsformat. Ob DOCX oder PDF verlangt wird,
   ist nicht erhoben.
