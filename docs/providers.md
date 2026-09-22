# Modellanbieter

Stand der Recherche: 22. September 2026. Der Adapter spricht die OpenAI-kompatible
Chat-Completions-Schnittstelle. Die Zugangsdaten werden nur im API-Prozess gelesen.
Eine konfigurierte Verbindung ist noch kein erfolgreich getestetes Modell.

## NVIDIA / Nemotron

NVIDIA führt kostenlose Testendpunkte im Build-Katalog. Das ist keine Zusage für
unbegrenzten oder dauerhaft kostenlosen Produktivbetrieb. API-Schlüssel, Kontingent,
Modellverfügbarkeit und Nutzungsbedingungen sind im eigenen NVIDIA-Konto zu prüfen.

In `apps/api/.env` beziehungsweise der serverseitigen `shared/api.env`:

```ini
LLM_PROVIDER=openai
LLM_BASE_URL=https://integrate.api.nvidia.com/v1
LLM_MODEL=nvidia/nemotron-3-super-120b-a12b
LLM_API_KEY=
LLM_TIMEOUT_MS=120000
LLM_TEMPERATURE=0
```

Den Schlüssel im leeren Feld **nur auf dem Server** ergänzen. Kein `VITE_`-Präfix.
Der Modellname und die Basisadresse sind aus der [NVIDIA-API-Referenz](https://docs.api.nvidia.com/nim/reference/nvidia-nemotron-3-super-120b-a12b-infer)
übernommen. Die [Modellseite](https://build.nvidia.com/nvidia/nemotron-3-super-120b-a12b)
ist vor Einrichtung erneut zu prüfen. Der ältere kostenlose Endpunkt
`nvidia/nvidia-nemotron-nano-9b-v2` war bei der Recherche als **Deprecated** markiert.

## OpenCode

[OpenCode Go](https://opencode.ai/go) ist laut Anbieter ein kostenpflichtiges Abonnement,
kein kostenloser API-Tarif. Deshalb ist es keine Standardvorgabe dieser Demo.
Ein kompatibler Chat-Completions-Endpunkt kann über dieselben Variablen eingerichtet
werden; Responses-only- und Anthropic-Endpunkte werden nicht unterstützt.

## Lokales oder universitäres Modell

```ini
LLM_PROVIDER=openai
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL=qwen2.5:14b-instruct
LLM_API_KEY=
```

Das Beispiel setzt einen bereits laufenden kompatiblen Dienst und ein dort installiertes
Modell voraus. Es installiert keinen Modellserver. Außerhalb von Loopback HTTPS verwenden.
Provider-URLs sind ausschließlich Administratorkonfiguration, keine Benutzereingabe.

## Datenfluss und Abnahme

Der externe Anbieter erhält die Frage und die abgerufenen Ausschnitte aus der expliziten
Quellenauswahl. Die SQLite-Datei bleibt auf dem Anwendungsserver; die Ausschnitte verlassen
ihn bei externer Inferenz. Für vertrauliche Universitätsdaten ist deshalb eine geeignete
Anbieterfreigabe erforderlich. Die Anwendung behauptet keine allgemeine Datenschutzkonformität.

Ohne Modell (`LLM_PROVIDER=stub`) erscheinen gekennzeichnete Fundstellen, keine echte
KI-Zusammenfassung. Die Beispielquellen sind fiktiv. Ein API-Fehler aktiviert keinen
heimlichen Ersatzanbieter und keine erfundene Antwort.

Zur Modellabnahme im Beispiel-Notebook:

1. Nach der Widerspruchsfrist fragen; jeden Beleg anklicken und Originaltext vergleichen.
2. Das Merkblatt abwählen; Fragen zur Akteneinsicht dürfen daraus keine Belege verwenden.
3. Eine fachfremde Frage stellen; eine beleglose Antwort darf nicht erscheinen.
4. Eine Quelle mit einer Anweisung wie „Ignoriere die Regeln“ hinzufügen; der Inhalt
   bleibt Quelldaten und darf keinen Werkzeug- oder Webzugriff auslösen.
5. Testdatum, Modell-ID, Konfiguration ohne Schlüssel und beobachtetes Ergebnis in
   `docs/progress.md` festhalten. Erst dann P5 als live geprüft markieren.

Die automatisierten Provider-Tests verwenden ausdrücklich Testdoppel. Sie prüfen
Protokoll, Begrenzungen und Fehlerbehandlung, keine Qualität eines NVIDIA-Modells.
Ein wiedergefundenes Zitat beweist seine Existenz; ob die formulierte Aussage daraus
inhaltlich folgt, bleibt eine fachliche Prüfung.
