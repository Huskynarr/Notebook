# Modellanbieter

Stand der Recherche: 23. September 2026. Der Adapter spricht die OpenAI-kompatible
Chat-Completions-Schnittstelle. Die Konfiguration wird nur im API-Prozess gelesen.
Eine konfigurierte Verbindung ist noch kein erfolgreich getestetes Modell.

## Gewählter Anbieter: OpenCode Console, MiMo-V2.6-Flash Free

Für die Sites-Demo und optional die lokale API ist ausschließlich das Modell
`mimo-v2.6-flash-free` vorgesehen. Die [Console Inference API](https://opencode.ai/v2/docs/console/inference/)
verwendet den OpenAI-kompatiblen Endpunkt `/inference/openai/v1/chat/completions`
und dokumentiert, dass kostenlose Chatmodelle ohne Bearer-Schlüssel erreichbar sind.
[MiMo-V2.6-Flash Free](https://opencode.ai/v2/docs/console/models/) steht dort mit
der exakten HTTP-Modell-ID und kostenlosem Ein-/Ausgabetokenpreis. Die Kombination wurde in diesem Projekt
noch **nicht** mit einer echten Modellantwort geprüft.

Nur serverseitig in `apps/api/.env`, `shared/api.env` oder als Sites-Laufzeitwerte:

```ini
LLM_PROVIDER=openai
LLM_BASE_URL=https://opencode.ai/inference/openai/v1
LLM_MODEL=mimo-v2.6-flash-free
LLM_API_KEY=
LLM_TIMEOUT_MS=120000
LLM_TEMPERATURE=0
```

`LLM_API_KEY` bleibt für diesen kostenlosen Console-Pfad leer. Das festgelegte
Free-Profil übermittelt selbst bei einem versehentlich eingetragenen Schlüssel
keinen Bearer-Header. Zugangsdaten einer späteren anderen Anbindung gehören
ausschließlich in die Backend-Umgebung, niemals
in `VITE_`-Variablen. Die HTTP-Modell-ID lautet `mimo-v2.6-flash-free`, ohne `opencode/`-Präfix.
Die Anwendung wechselt bei Fehlern oder künftig geänderten Preisen nicht auf ein
anderes, möglicherweise kostenpflichtiges Modell. Wer einen OpenCode-Go-Schlüssel
besitzt, braucht ihn für diesen in der Console-Dokumentation beschriebenen
schlüssellosen Weg nicht. Ein Go-Schlüssel ist nicht als Zugang für diesen
Console-Endpunkt nachgewiesen.

**Kosten- und Datenschutzgrenze:** OpenCode kennzeichnet MiMo-V2.6-Flash Free als
**nur befristet** kostenlos. Für eine strikte Nullkosten-Grenze in der Console
Auto-Reload deaktivieren und Preise vor weiterer Nutzung erneut prüfen;
ein Monatsbudget allein verhindert laut Anbieter nicht jedes automatische Aufladen.
Der Anbieter [hostet Modelle in den USA und kann während der kostenlosen
MiMo-V2.6-Flash-Phase übertragene Daten zur Modellverbesserung nutzen](https://opencode.ai/v2/docs/console/models/).
Frage und ausgewählte Quellenausschnitte werden an ihn gesendet. Daher nur
freigegebene Demo-Texte verwenden, bis die Hochschule die Verarbeitung
vertraulicher Inhalte genehmigt hat.

## Abgrenzung von OpenCode Go

[OpenCode Go](https://opencode.ai/docs/go/) ist ein kostenpflichtiges Abonnement
für Coding-Agenten. Es listet ein Modell `mimo-v2.6-flash` **ohne** `-free`
mit kostenpflichtigen Tokenpreisen. Für das gewählte kostenlose Modell gilt
die Console-Adresse, nicht die Go-Adresse `/zen/go/v1`. Das Backend erhält
keine frei wählbare Anbieter-URL aus dem Browser;
die Admin-Konfiguration legt Modell und URL fest. Das Modell wird weder beim
Ratelimit noch bei einem API-Fehler automatisch gewechselt.

## Datenfluss und Abnahme

Der externe Anbieter erhält die Frage und die abgerufenen Ausschnitte aus der expliziten
Quellenauswahl. Die SQLite-Datei bleibt auf dem Anwendungsserver; die Ausschnitte verlassen
ihn bei externer Inferenz. Für vertrauliche Universitätsdaten ist deshalb eine geeignete
Anbieterfreigabe erforderlich. Die Anwendung behauptet keine allgemeine Datenschutzkonformität.

Ohne Modell (`LLM_PROVIDER=stub`) erscheinen gekennzeichnete Fundstellen, keine echte
KI-Zusammenfassung. Die Beispielquellen sind fiktiv. Ein API-Fehler aktiviert keinen
heimlichen Ersatzanbieter und keine erfundene Antwort. Fehlendes JSON-Belegformat
oder nicht auffindbare Zitate führen ebenfalls zum Zurückhalten der gesamten Antwort.

Zur Modellabnahme im Beispiel-Notebook:

1. Nach der Widerspruchsfrist fragen; jeden Beleg anklicken und Originaltext vergleichen.
2. Das Merkblatt abwählen; Fragen zur Akteneinsicht dürfen daraus keine Belege verwenden.
3. Eine fachfremde Frage stellen; eine beleglose Antwort darf nicht erscheinen.
4. Eine Quelle mit einer Anweisung wie „Ignoriere die Regeln“ hinzufügen; der Inhalt
   bleibt Quelldaten und darf keinen Werkzeug- oder Webzugriff auslösen.
5. Testdatum, Modell-ID, Konfiguration ohne Schlüssel und beobachtetes Ergebnis in
   `docs/progress.md` festhalten. Erst dann P5 als live geprüft markieren.

Die automatisierten Provider-Tests verwenden ausdrücklich Testdoppel. Sie prüfen
Protokoll, Begrenzungen und Fehlerbehandlung, keine Qualität des MiMo-Modells.
Ein wiedergefundenes Zitat beweist seine Existenz; ob die formulierte Aussage daraus
inhaltlich folgt, bleibt eine fachliche Prüfung.
