# Produktanalyse: Marktvorbild und Abgrenzung

Stand: 2026-09-17. Recherche über direktes Abrufen der unten genannten Seiten.
Belegte Angaben tragen eine Quelle. Alles ohne Quelle ist als Einschätzung markiert und
darf nicht als Tatsache weiterverwendet werden.

## 0. Namenslage

Das Vorbild heißt in Googles aktueller Dokumentation **Gemini Notebook**; "NotebookLM" ist
der Vorgängername. Selbst geprüft: die Hilfeseite `support.google.com/gemininotebook/answer/16164461`
führt das Produkt als "Gemini Notebook". Im Projekt wird weiter vom "NotebookLM-Klon"
gesprochen, weil das der eingeführte Begriff ist.

## 1. Der Produktkern in einem Satz

Nicht ein Chatbot mit Dateianhang, sondern ein Arbeitsbereich, der jede Antwort zwingend an
vom Nutzenden kuratierte Quellen bindet und diese Bindung sichtbar macht.

Belegt: "Chat with your notebook to get grounded information based on your sources with
clear in-line citations for accuracy, transparency, and trust" und "designed to answer
questions based on the information provided in your uploaded sources"
(support.google.com/gemininotebook/answer/16164461, am 2026-09-17 selbst abgerufen).

## 2. Funktionsumfang des Vorbilds (belegt)

- **Quelltypen:** PDF, DOCX, TXT, Markdown, CSV, PPTX, ePub; Audio; Bilder; Google Docs,
  Slides (max. 100 Folien), Sheets (max. 100.000 Tokens); URLs (nur Text); öffentliche
  YouTube-Links mit Untertiteln; eingefügter Text. Grenze je Quelle: 500.000 Wörter oder
  200 MB. (answer/16215270)
- **Grenzen je Plan:** kostenlos 100 Notebooks / 50 Quellen je Notebook / 50 Chat-Anfragen
  pro Tag; höchste Stufe 500 Notebooks / 600 Quellen / 5.000 Anfragen. Google kennzeichnet
  die Tabelle selbst als änderbar. (answer/16213268)
- **Oberfläche:** drei Spalten — Quellen links, Chat in der Mitte, "Studio" mit erzeugten
  Artefakten rechts. (answer/16206563)
- **Erzeugte Artefakte:** Notizen, Audio Overview (4 Stile), Video Overview (3 Formate),
  Mind Map, Reports, Flashcards, Quizze, Infografiken, Foliensätze, Datentabelle.
- **Verhalten ohne Deckung:** "If the answer isn't in the source material, it won't provide
  a response." Als Ablehnungsgründe nennt die FAQ zusätzlich Sicherheitsfilter und zu vage
  Fragen. (answer/16269187)
- **Abgrenzung zwischen Notebooks:** ein Notebook greift nicht auf Quellen eines anderen zu.
  Notebooks lassen sich nicht duplizieren. (answer/16206563)
- **Selbst eingeräumte Fehlbarkeit:** Für Video Overviews und Reports warnt Google
  ausdrücklich vor Ungenauigkeiten. (answer/16454555, answer/18323649)

## 3. Was das Vorbild nicht dokumentiert

Für den eigenen Bau relevant, aber in den geprüften Seiten **nicht belegt**:

- Wie ein Klick auf ein Inline-Zitat visuell reagiert (Sprung, Hervorhebung, Genauigkeit
  der Markierung). Aus Produkterfahrung bekannt, aber nicht dokumentiert — daher für die
  eigene Spezifikation nicht als Vorbild zitierbar.
- Ob und wann allgemeines Modellwissen zusätzlich einfließt.
- Belegqualität im Deutschen.

Diese Lücken sind der Grund, warum die eigene Belegmechanik in `docs/decisions.md` (D-007)
eigenständig festgelegt und nicht aus dem Vorbild abgeleitet wurde.

## 4. Kritik am Vorbild (belegt)

- Audio Overviews pressen Inhalte in ein standardisiertes, US-geprägtes Gesprächsformat und
  fügen teils kulturell unpassende Inhalte hinzu (Wikipedia-Artikel "NotebookLM", zitiert
  Rettberg 2026).
- 2026 Klage eines Journalisten wegen angeblicher Reproduktion seiner Stimme im
  Audio-Feature; Google bestreitet (ebenda).
- Mind Map fehlt in der mobilen App; Notebooks nicht duplizierbar.

Nicht belegbar in dieser Recherche: breite Nutzerkritik und deutschsprachige Sprachqualität.
Die Websuche war während der Recherche blockiert, es konnten nur bekannte URLs direkt
abgerufen werden. Diese Punkte bleiben offen.

## 5. Open-Source-Umfeld (belegt über die jeweiligen README)

| Projekt | Ansatz | Abgrenzung zu uns |
|---|---|---|
| Open Notebook (lfnovo) | 1:1-Nachbau, selbst gehostet, 18+ Anbieter, FastAPI + Next.js + SurrealDB | Voller Funktionsumfang inkl. Podcasts; wir schneiden bewusst kleiner |
| SurfSense | Fokus auf Live-Web-Connectoren und Agenten, FastAPI/LangGraph | Web-Crawling ist bei uns Nicht-Ziel |
| Onyx | Unternehmens-KI-Plattform mit RBAC, SSO, Agenten | Nutzerverwaltung ist bei uns Nicht-Ziel |
| RAGFlow | RAG-Engine mit tiefem Dokumentverständnis, Elasticsearch/Infinity | Deutlich mehr Infrastruktur als zulässig |
| Verba (Weaviate) | schlanke RAG-Referenz | Seit Juni 2026 archiviert, kein aktiver Kandidat |

**Beobachtung:** Alle betrachteten Projekte lösen Belege auf Dokument- oder Chunk-Ebene.
Keines der geprüften README beschreibt eine serverseitige Verwerfung nicht auflösbarer
Zitatmarker. Ob das anderswo existiert, wurde nicht erschöpfend geprüft — die Aussage gilt
nur für die fünf genannten README.

## 6. Ableitung für v0.1

Übernommen: Notebook als abgegrenzter Quellenraum; Dreispalten-Aufteilung; Zwang zur
Quellenbindung; ausdrückliche Auskunft statt Antwort, wenn die Quellen nicht tragen.

Bewusst nicht übernommen: Medienerzeugung, Web-Quellen, Mind Maps, Pläne und Kontingente,
Mehrbenutzerbetrieb.

Weiter getrieben als das Vorbild: Belege auf Zeichenebene mit Hervorhebung der genau
belegenden Stelle und serverseitiger Verwerfung unauflösbarer Marker. Das ist die eine
Eigenschaft, in der der Klon besser sein soll als das Original — und der Grund, warum der
Funktionsumfang sonst klein bleibt.

## Quellen

- https://support.google.com/gemininotebook/answer/16164461 — Learn about Gemini Notebook (selbst abgerufen 2026-09-17)
- https://support.google.com/gemininotebook/answer/16206563 — Create a notebook
- https://support.google.com/gemininotebook/answer/16215270 — Add or discover sources
- https://support.google.com/gemininotebook/answer/16213268 — Plan-Limits
- https://support.google.com/gemininotebook/answer/16269187 — FAQ
- https://support.google.com/gemininotebook/answer/16454555 — Video Overviews
- https://support.google.com/gemininotebook/answer/18323649 — Reports
- https://en.wikipedia.org/wiki/NotebookLM — Timeline, Kritik, Rechtsstreit
- https://github.com/lfnovo/open-notebook · https://github.com/MODSetter/SurfSense · https://github.com/onyx-dot-app/onyx · https://github.com/infiniflow/ragflow · https://github.com/weaviate/Verba
