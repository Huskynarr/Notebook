# KI-Einsatz in diesem Projekt

Fortlaufendes Protokoll des tatsächlichen KI-Einsatzes bei der Entwicklung. Regel: Was hier
nicht steht, ist nicht passiert. Was hier steht, ist so passiert.

Spalte "Geprüft durch" nennt, wie das Ergebnis kontrolliert wurde. "Nicht geprüft" ist ein
zulässiger, aber sichtbarer Eintrag.

---

## 2026-09-17

| # | Werkzeug | Aufgabe | Übernommen | Geprüft durch |
|---|---|---|---|---|
| 1 | Claude (Opus 5, Cowork) | Klärung des Zuschnitts mit dem Auftraggeber, Aufbau des Repositories | Struktur, `AGENTS.md`, `docs/product.md`, `docs/decisions.md` | Inhaltliche Vorgaben stammen vom Auftraggeber; Formulierung von der KI. Widerspruch Persistenz (Postgres vs. lokal) wurde erkannt und rückgefragt statt selbst entschieden. |
| 2 | Claude (Sonnet, Teilagent) | Recherche zum Marktvorbild | Faktenlage in `docs/product-analysis.md` | Teilweise nachgeprüft: Die zentrale Aussage (Produktname "Gemini Notebook", Wortlaut zur Quellenbindung) wurde von mir selbst über `support.google.com/gemininotebook/answer/16164461` erneut abgerufen und bestätigt. Die übrigen Zahlen (Plan-Limits, Dateiformate) stammen aus dem Teilagenten-Bericht und sind **nicht einzeln nachgeprüft**. Die Websuche war während der Recherche blockiert; Nutzerkritik und deutsche Sprachqualität konnten nicht belegt werden und sind im Dokument als offen markiert. |

---

## Regeln für Einträge

- Jeder Eintrag nennt ein Datum, ein Werkzeug, eine Aufgabe und eine Prüfung.
- Generierter Code, der ungeprüft übernommen wurde, wird als solcher eingetragen.
- Modellaufrufe im laufenden Produkt (die RAG-Antworten der Anwendung) gehören **nicht**
  hierher — dies ist das Protokoll des Entwicklungsprozesses, nicht der Laufzeit.
