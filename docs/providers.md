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
der exakten Modell-ID und kostenlosem Ein-/Ausgabetokenpreis. **Der echte
externe Test am 23.09.2026 widerspricht der angenommenen Nutzbarkeit:** Ein
anonymer POST auf diesen Endpunkt mit `mimo-v2.6-flash-free` erhielt HTTP 403,
`FreeTierError`, mit dem Hinweis, die kostenlose Nutzung sei nur innerhalb
von OpenCode möglich. Der gehostete Worker-Test mit dem Everlast-Testkonto
erreichte Login, Notebook und beide Quellen, die Modellfrage endete jedoch
mit HTTP 503 `llm_unavailable`. Ein authentifizierter Console-/Zen-Key-Aufruf
wurde nicht geprüft; ein kostenloser externer Zugang ist **nicht belegt**.

Nur serverseitig in `apps/api/.env`, `shared/api.env` oder als Sites-Laufzeitwerte:

```ini
LLM_PROVIDER=openai
LLM_BASE_URL=https://opencode.ai/inference/openai/v1
LLM_MODEL=mimo-v2.6-flash-free
LLM_API_KEY=
LLM_TIMEOUT_MS=120000
LLM_TEMPERATURE=0
```

Diese Konfiguration ist als **fehlgeschlagener Integrationsversuch**, nicht als
funktionsfähige Empfehlung dokumentiert. Auf Sites ist zusätzlich
`LLM_ACCESS_STATUS=blocked` gesetzt: Health meldet die gesperrte MiMo-ID, und
Fragen werden ohne wiederholte externe Modellanfrage mit einer klaren
Fehlermeldung abgewiesen. Ohne Schlüssel bleibt der Aufruf anonym. Mit einem
ausdrücklich serverseitig gesetzten Console-Service-Key übermittelt das
Backend diesen nur im Authorization-Header für die festgelegte Free-Modell-ID;
die gesperrte Site sendet auch dann zunächst **keine** Modellanfrage.
Zugangsdaten einer späteren anderen Anbindung gehören
ausschließlich in die Backend-Umgebung, niemals
in `VITE_`-Variablen. Die HTTP-Modell-ID lautet `mimo-v2.6-flash-free`, ohne `opencode/`-Präfix.
Die Anwendung wechselt bei Fehlern oder künftig geänderten Preisen nicht auf ein
anderes, möglicherweise kostenpflichtiges Modell. Wer einen OpenCode-Go-Schlüssel
besitzt, hat damit **keinen nachgewiesenen Zugang** zur externen kostenlosen
Console-Variante; der Go-Endpunkt hat eine andere Modell-ID und Abrechnung.

### Console-Service-Key prüfen

Der Nutzer beschrieb einen Schlüssel unter **Keys → Service Account → API**.
Die [OpenCode-Inference-Dokumentation](https://opencode.ai/v2/docs/console/inference/)
zeigt genau diese Art Schlüssel für `Authorization: Bearer`. Ob der Schlüssel
das freie Modell von einer fremden Anwendung aus erreichbar macht, ist offen.
Ein einmaliger Test auf dem eigenen Rechner überträgt nur „Antworte mit OK“;
er protokolliert weder Schlüssel noch Antworttext:

```bash
read -rs -p 'Console-Service-Key: ' NOTEBOOK_CONSOLE_SERVICE_KEY; printf '\n'
export NOTEBOOK_CONSOLE_SERVICE_KEY
node --input-type=module <<'JS'
const key = process.env.NOTEBOOK_CONSOLE_SERVICE_KEY;
if (!key) throw new Error('Kein Schlüssel eingelesen.');
try {
  const response = await fetch('https://opencode.ai/inference/openai/v1/chat/completions', {
    method: 'POST',
    redirect: 'error',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'mimo-v2.6-flash-free',
      messages: [{ role: 'user', content: 'Antworte mit OK.' }],
      max_tokens: 16,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  console.log(`HTTP ${response.status}`);
  await response.body?.cancel();
} catch {
  console.log('Transportfehler ohne HTTP-Status');
  process.exitCode = 1;
}
JS
unset NOTEBOOK_CONSOLE_SERVICE_KEY
```

Nur den **HTTP-Status** zurückmelden, niemals den Schlüssel oder Antworttext.
HTTP 200 belegt zunächst lediglich die Erreichbarkeit; die Belegprüfung folgt
gesondert mit dem Everlast-Beispiel. HTTP 403 belegt, dass auch dieser Schlüssel
die externe Free-Sperre nicht aufhebt. Der produktive Wert
`LLM_ACCESS_STATUS=blocked` bleibt bis zur erfolgreichen Abnahme gesetzt.

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
KI-Zusammenfassung. Die Everlast-Beispielquellen sind datierte Paraphrasen von
Unternehmens-Selbstauskünften, keine Registerabschriften. Ein API-Fehler aktiviert keinen
heimlichen Ersatzanbieter und keine erfundene Antwort. Fehlendes JSON-Belegformat
oder nicht auffindbare Zitate führen ebenfalls zum Zurückhalten der gesamten Antwort.

Nach Bereitstellung eines nachweislich erlaubten externen Endpunkts erneut abnehmen:

1. Nach der laut Impressum genannten Vertretung fragen; jeden Beleg anklicken und Originaltext vergleichen.
2. Die Impressumsquelle abwählen; eine Frage nach der dort genannten Vertretung darf nicht aus ihr belegt werden.
3. Eine fachfremde Frage stellen; eine beleglose Antwort darf nicht erscheinen.
4. Eine Quelle mit einer Anweisung wie „Ignoriere die Regeln“ hinzufügen; der Inhalt
   bleibt Quelldaten und darf keinen Werkzeug- oder Webzugriff auslösen.
5. Testdatum, Modell-ID, Konfiguration ohne Schlüssel und beobachtetes Ergebnis in
   `docs/progress.md` festhalten. Erst dann P5 als live geprüft markieren.

Die automatisierten Provider-Tests verwenden ausdrücklich Testdoppel. Sie prüfen
Protokoll, Begrenzungen und Fehlerbehandlung, keine Qualität des MiMo-Modells.
Ein wiedergefundenes Zitat beweist seine Existenz; ob die formulierte Aussage daraus
inhaltlich folgt, bleibt eine fachliche Prüfung.
