# Produktdefinition

Stand: 2026-09-22 · eigenständiger NotebookLM-inspirierter Prototyp, keine Google-Anbindung.

## Zielgruppe und Nutzungssituation

Studierende, wissenschaftliche Mitarbeitende und Lehrende arbeiten allein mit einem
abgegrenzten Korpus aus Skripten, Seminarunterlagen, Protokollen oder eigenen Notizen.
Typischer Arbeitsumfang als Annahme: 3–30 Textdokumente. Entwicklung auf localhost;
später ein geschützter gemeinsamer Demo-Arbeitsraum unter notebook.sebastianselinger.de.
Feste Zugänge teilen denselben Arbeitsbereich, ohne Mehrbenutzer- oder Mandantentrennung.

## Zentrales Problem und kurze Produktanalyse

Eine flüssige Antwort reicht für wissenschaftliches Arbeiten nicht: Die Textstelle,
auf die sich eine Aussage bezieht, muss ohne langes Suchen überprüfbar sein. Der
Prototyp priorisiert deshalb die Verbindung von Aussage, Belegmarker und Originaltext.
Das ist die Produkthypothese, kein gemessenes Urteil über andere Produkte.

| Alternative | Nutzen | Bewusste Entscheidung dieses Prototyps |
|---|---|---|
| Allgemeiner KI-Chat | Freie Fragen, breites Modellwissen | Antworten auf ausgewählte eigene Quellen begrenzen |
| Volltextsuche | Direkte Originalstellen | Fundstellen und zitierte Modellformulierungen nebeneinander |
| Vollständige Wissensplattform | Mehrbenutzerbetrieb, viele Medien | Enger Textworkflow mit SQLite und festen Zugängen |

Es wurde kein vollständiger Wettbewerbsbenchmark durchgeführt. Erfolg wird zunächst
am Hauptablauf geprüft; Zeitersparnis und Modellqualität bleiben zu messen.

## Hauptablauf

1. Notebook öffnen oder anlegen.
2. Eigenen Text einfügen oder eine UTF-8-Datei (.txt/.md) hinzufügen.
3. Quellen für die Frage auswählen.
4. Frage stellen; passende Abschnitte werden nur aus dieser Auswahl abgerufen.
5. Belegmarker öffnen, hervorgehobene Originalstelle lesen, Aussage fachlich prüfen.
6. Ergebnis mit den Belegauszügen als editierbare Notiz speichern und exportieren.

## Vollständiger Pflichtumfang

| ID | Funktion | Abnahmekriterium |
|---|---|---|
| P1 | Notebook-Verwaltung | Öffnen, anlegen, umbenennen, löschen; Speicherung über Neustarts |
| P2 | Text-/Markdown-Import | Einfügen und Datei, Originaltext unverändert, höchstens 10 MiB UTF-8 |
| P3 | Text-/Markdown-Export | Vollständige Quellen, Notizen, Belegauszüge und Positionen in Markdown |
| P4 | Quellenwahl | Abgewählte oder notebookfremde Quellen gelangen nicht in den Modellkontext |
| P5 | Echte KI-Antworten | Konfigurierbarer kompatibler Backend-Anbieter; Live-Abnahme gesondert erforderlich |
| P6 | Überprüfbare Verweise | Marker → abgerufener Abschnitt → Originalposition; ungültige echte Antworten vollständig zurückhalten |
| P7 | Notizen | Anlegen, bearbeiten, löschen; Referenzen serverseitig prüfen; fehlende Originale kennzeichnen |
| P8 | Lokale Persistenz | SQLite-Datei auf dem API-Rechner, kein externer Datenbankdienst |
| P9 | Sofort nutzbares Beispiel | Fiktives Notebook, Quellen und Beispielfragen; Fundstellen ohne API-Schlüssel erkundbar |
| P10 | Einfacher Zugangsschutz | localhost Huskynar:admin; weitere Zugänge per Backend-Konfiguration; serverseitige Anmeldung, Token und verzögerte Wiederholung |
| P11 | Landingpage und Themes | Öffentliche Erklärung, Login oben rechts; Everlast, Huskynarr und bestehende Themes |
| P12 | Reproduzierbare Qualität | Typecheck, Lint, Build, Unit-/Integrationstests, E2E, Git-Hooks und GitHub CI/CD |

## Qualitätsanforderungen

- Striktes TypeScript und zentrale Tailwind-Tokens; lesbare Desktop- und Mobilansichten.
- Jede ausgelieferte echte Modellantwort wird auf gültige Marker und wiedergefundene
  Zitate geprüft. Mechanische Belegprüfung ist **kein Beweis semantischer Wahrheit**.
- Kein Modellwissen als heimlicher Ersatz für fehlende Quellen. Ohne Modell ein
  sichtbarer Offline-Modus, keine vorgetäuschte KI-Integration.
- Keine API-Schlüssel oder Administrationsgeheimnisse im Frontend; Sitzungstoken sind
  kurzlebige Zugangsdaten und bleiben im Sitzungsspeicher des Browsers.
- Nach drei Fehlanmeldungen serverseitig 30 Sekunden Wartezeit, danach exponentiell
  bis 15 Minuten. Die Oberfläche zeigt und respektiert dieselbe Wartezeit.
- Authentifizierte API-Routen, Größen-/Speicher-/Anfragebegrenzungen, sanitisierte Fehler.
- Tastaturfokus, beschriftete Eingaben, reduzierte Bewegung und gute Kontraste; vollständige
  Barrierefreiheitszertifizierung wird nicht behauptet.
- Abrufzeit und Modellqualität werden nur mit dokumentierten Messungen beziffert.

## Grenzen und Nicht-Ziele

Textbasierte PDFs sind eine optionale spätere Erweiterung; noch kein Import, keine OCR.
Registrierung, Kontoverwaltung, Rollen, Zusammenarbeit, Audio-/Videogenerierung,
Website-Import/Crawling und große Vektorinfrastruktur bleiben außerhalb dieser Version.
Die gesonderte GitHub-Pages-Browserdemo hat keinen Zugangsschutz und kein KI-Modell;
ihr Funktionsumfang ist kleiner als der vollständige API-Betrieb.

Demo-Budgets: 100 Notebooks, 100 Quellen und 100 Notizen pro Notebook, 200 MiB
Quelltext und 50 MiB Notizinhalte insgesamt. SQLite-Indizes, Chunks, WAL und Backups
brauchen zusätzlichen Platz. KI-Anfragen: zwei gleichzeitig, zehn pro Minute,
100 pro 24-Stunden-Fenster; Fehlversuche zählen mit. Kein SLA.

## Offene Annahmen

1. Absatz-Chunking und lexikalischer FTS5/BM25-Abruf reichen für deutsche Fachtexte;
   Synonyme, Komposita, Tabellen und Formeln sind nur begrenzt abgedeckt.
2. Ein passender Anbieterzugang und die Freigabe für übermittelte Quellen liegen vor.
   NVIDIA-Testkontingente sind keine Zusage für kostenlosen Dauerbetrieb.
3. Modellantworten halten das strenge JSON-/Belegformat zuverlässig ein. Die Testdoppel
   belegen den Softwarevertrag, nicht die Qualität eines laufenden Modells.
4. Die festen Zugänge zum gemeinsamen Arbeitsbereich reichen für eine abgegrenzte Demo. Ein zentraler Dienst mit
   persönlichen Daten benötigt später individuelle Konten und getrennte Arbeitsräume.
5. Everlast-/Huskynarr-Themes sind eigenständige Ableitungen beobachteter Farben;
   eine offizielle Corporate-Design-Abnahme liegt nicht vor.
6. Plesk-Rechte, DNS, TLS, Cloudflare und SSH-Deployment werden erst am Zielserver bestätigt.
