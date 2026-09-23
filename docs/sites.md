# ChatGPT Sites: Auslieferung und Grenzen

Der Sites-Build benutzt die vorhandene React-Oberfläche und `/v1` unter derselben
Domain. Lokal bleiben Fastify und die SQLite-Datei für `pnpm dev` erhalten. Der
Sites-Worker liest D1 (`DB`) und R2 (`BUCKET`), die in `.openai/hosting.json` als
logische Bindings deklariert sind. Die unveränderten UTF-8-Originaltexte liegen
in R2; D1 enthält Metadaten, Notizen, Offsets, FTS5-Index, Anmeldesperren und
API-/KI-Kontingente. Neue Installationen wenden `drizzle/0000_sites.sql` vor
dem Worker-Upload an. Der veröffentlichte Datenbestand mit einem Notebook unter
dem bisherigen Namen `Huskynar` benötigt bei der Umstellung auf `Huskynarr`
eine eng begrenzte Eigentümerkorrektur. Sie erfolgt idempotent im Worker beim
ersten authentifizierten Zugriff des korrigierten Kontos, nicht per D1-Schema-
Migration; Quellen und Notizen bleiben über ihre Notebook-IDs zugeordnet.
Die Sites-Daten sind **nicht** die lokale Plesk-Datenbank;
eine automatische Übernahme bestehender Daten gibt es nicht.

## Bauen und verifizieren

```bash
pnpm install --frozen-lockfile
pnpm verify
pnpm test:e2e
pnpm sites:build
node tools/check-sites-output.mjs
```

`pnpm sites:build` setzt die öffentliche API-Basis auf denselben Ursprung,
deaktiviert den Browser-Demomodus, erstellt `dist/client` und ein Worker-Modul
unter `dist/server/index.js`. Die normalen E2E-Tests laufen bislang gegen das
lokale Fastify-Backend; die Tests in `apps/api/src/sites/worker.test.ts` prüfen
das neue API-Format und die SQLite-kompatiblen SQL-Operationen. Ein lokaler
D1/R2-Emulator und ein tatsächlicher Modellaufruf sind zusätzliche Abnahmen,
die vor der Verarbeitung vertraulicher Universitätsdaten nötig sind.

## Laufzeitwerte

Geheimnisse gehören als **Site-Secrets** in die Sites-Umgebung und dürfen
niemals in Git, `VITE_`-Variablen, `.openai/hosting.json` oder den Client-Build:

| Name | Zweck |
|---|---|
| `AUTH_USERNAME`, `AUTH_PASSWORD` | Zugang `Huskynarr` mit eigenem langem Passwort |
| `AUTH_ADDITIONAL_USERS` | Serverseitige JSON-Liste für `Everlast` und weitere feste Testkonten |
| `AUTH_SECRET` | Stabiles zufälliges Signaturgeheimnis, mindestens 32 Zeichen |
| `LLM_PROVIDER` | `stub` (sichtbar markierter Offline-Modus) oder `openai` |
| `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY` | Serverseitiger Modellendpunkt; für das kostenlose MiMo-V2.6-Flash-Free-Console-Profil bleibt der Schlüssel leer |

Produktionszugänge haben mindestens 16 Zeichen. Das aus dem Auftrag bekannte
`Everlast`-Testpasswort ist für einen öffentlichen Testzugang verwendbar, aber
keine Schutzmaßnahme für vertrauliche Daten. Der Worker trennt die Notebook-
Daten nach Konto. Für echte Universitätsquellen muss der Testzugang deaktiviert
oder mit einem neuen geheimen Passwort versehen werden. Ohne Modellschlüssel
ist der kostenlose Console-Endpunkt gemäß Anbieter-Dokumentation für kostenlose
Chatmodelle vorgesehen; ob MiMo-V2.6-Flash Free hier tatsächlich antwortet, muss ein
Live-Aufruf zeigen. `LLM_PROVIDER=stub` bleibt sichtbar als Simulation markiert.

Für die gewünschte Modellwahl ausschließlich folgende Sites-Laufzeitwerte
serverseitig setzen; keine `VITE_`-Variablen und keine automatische Ausweichroute:

```ini
LLM_PROVIDER=openai
LLM_BASE_URL=https://opencode.ai/inference/openai/v1
LLM_MODEL=mimo-v2.6-flash-free
LLM_API_KEY=
```

OpenCode Go listet `mimo-v2.6-flash` ohne `-free` mit Tokenpreisen; das
gewählte Free-Modell steht in der Console-Liste. Sein kostenloser Tarif ist nach
[Anbieterangaben](https://opencode.ai/v2/docs/console/models/)
befristet; Console-Auto-Reload deaktivieren und vertrauliche Universitätsquellen
bis zur Freigabe nicht übertragen. Der Anbieter hostet in den USA und kann
MiMo-V2.6-Flash-Free-Daten in der kostenlosen Phase zur Modellverbesserung nutzen.
[Details und Abnahme](providers.md).

## Öffentlichkeit und Domain

Die Site ist öffentlich und `notebook.sebastianselinger.de` ist als aktive Domain
mit TLS gebunden. Die öffentliche Landingpage benötigt kein Konto; das eigene
Login schützt sämtliche `/v1`-Datenrouten serverseitig. Nach Änderung der
Sites-Umgebung eine neue Version aus dem geprüften Commit veröffentlichen und
den Domain- und Loginstatus erneut prüfen. Der alternative Plesk-Betriebsweg
nutzt dieselbe Zieladresse und kann nicht gleichzeitig deren DNS-Ziel sein.

Der Worker erzwingt pro IP 120 geschützte Anfragen pro Minute, global 300,
pro Zugang 10 KI-Fragen pro Minute und 100 pro Tag. Anmeldung: nach drei
Fehlversuchen 30 Sekunden Wartezeit, danach steigend bis 15 Minuten, in D1
gespeichert. Das bisherige Prozesslimit von zwei **gleichzeitigen** Modellaufrufen
ist auf Sites nicht vorhanden; das Tages-/Minutenkontingent ersetzt es für
die Testumgebung. Zusätzliche WAF-Limits am Edge sind für stärkeren Schutz
zweckmäßig. Fail2Ban auf Plesk filtert den Sites-Traffic nicht; die Regeln in
`docs/fail2ban.md` betreffen nur den Plesk-Betriebsweg.

Die 10-MiB-Grenze bezieht sich auf den dekodierten UTF-8-Quellentext. Für
ungewöhnlich viele sehr kurze Abschnitte kann die D1-Abfragegrenze bereits
früher greifen; in diesem Fall lehnt der Import die Quelle ab, statt einen
teilweise durchsuchbaren Zustand zu hinterlassen. Der gesamte Quellentext
ist pro Konto auf 200 MiB, Notiztext auf 50 MiB begrenzt. D1 und R2 benötigen
separate Backup- und Wiederherstellungswege; SQLite-Dateikopien des Plesk-
Pfades sichern den Sites-Bestand nicht.

## CI und Auslieferung

GitHub-CI prüft TypeScript, Stil, Unit-/Integrationstests, den lokalen Browser-
Hauptablauf und zusätzlich den Sites-Worker-Build. Sites führt ein eigenes
Quellrepository; die Veröffentlichung erfolgt mit einem kurzlebigen Sites-
Credential aus dem **geprüften Commit**. Ein Push nach GitHub allein stellt
keine neue Site-Version online. Die Plesk-Pipeline bleibt als alternativer,
manuell ausgelöster Betriebsweg erhalten.
