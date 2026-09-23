# ChatGPT Sites: Auslieferung und Grenzen

Der Sites-Build benutzt die vorhandene React-Oberfläche und `/v1` unter derselben
Domain. Lokal bleiben Fastify und die SQLite-Datei für `pnpm dev` erhalten. Der
Sites-Worker liest D1 (`DB`) und R2 (`BUCKET`), die in `.openai/hosting.json` als
logische Bindings deklariert sind. Die unveränderten UTF-8-Originaltexte liegen
in R2; D1 enthält Metadaten, Notizen, Offsets, FTS5-Index, Anmeldesperren und
API-/KI-Kontingente. Neue Installationen wenden `drizzle/0000_sites.sql` vor
dem Worker-Upload an. Die Sites-Daten sind **nicht** die lokale Plesk-Datenbank;
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
| `AUTH_USERNAME`, `AUTH_PASSWORD` | Zugang `Huskynar` mit eigenem langem Passwort |
| `AUTH_ADDITIONAL_USERS` | JSON-Liste für `everlabs` und weitere feste Testkonten |
| `AUTH_SECRET` | Stabiles zufälliges Signaturgeheimnis, mindestens 32 Zeichen |
| `LLM_PROVIDER` | `stub` (sichtbar markierter Offline-Modus) oder `openai` |
| `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY` | Serverseitiger OpenAI-kompatibler Modellendpunkt |

Produktionszugänge haben mindestens 16 Zeichen. Das aus dem Auftrag bekannte
`everlabs`-Testpasswort ist für einen öffentlichen Testzugang verwendbar, aber
keine Schutzmaßnahme für vertrauliche Daten. Der Worker trennt die Notebook-
Daten nach Konto. Für echte Universitätsquellen muss der Testzugang deaktiviert
oder mit einem neuen geheimen Passwort versehen werden. Ohne Modellschlüssel
werden **keine** echten Antworten behauptet: der Offline-Modus ist sichtbar.

## Öffentlichkeit und Domain

Eine neue Site ist zunächst nur für den Eigentümer erreichbar. Die öffentliche
Landingpage erfordert eine gesonderte Sites-Freigabe `public`; das eigene Login
schützt auch dann sämtliche `/v1`-Datenrouten serverseitig. Nach dem ersten
erfolgreichen Deployment lässt sich `notebook.sebastianselinger.de` an die Site
binden. Sites gibt dafür einen CNAME und zusätzliche DNS-Validierungseinträge
aus. Die Domain erst umschalten, wenn diese Einträge gesetzt und der Status
`active` ist; ein bestehender Plesk-Eintrag darf bis dahin bleiben.

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
