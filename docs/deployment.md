# Betrieb auf Plesk

Zieladresse: `https://notebook.sebastianselinger.de`. Diese Anleitung ist eine
Betriebsvorlage, keine Behauptung einer bereits erfolgten Veröffentlichung. Der genannte
Plesk-Server `panel.gardenpiratez.de` wurde nicht verändert.

## Kleine Architektur

Plesk/nginx liefert `apps/web/dist` aus und leitet `/v1/` an einen einzelnen Node-Prozess
auf `127.0.0.1:8787` weiter. SQLite liegt außerhalb des Document Roots. Kein Docker,
Redis oder Datenbankserver. Die Anleitung verwendet einen systemd-Benutzerdienst;
Plesks Passenger-Verwaltung wird für diesen Prozess nicht zusätzlich aktiviert.

Voraussetzungen: Linux, Node ab 22.18 (Node 24 LTS empfohlen), pnpm 9.15.9,
SSH für den Subscription-Benutzer, nginx-Konfiguration und einmalige Serveradministration
für den Benutzerdienst. Ohne diese Rechte muss die Serveradministration die Einrichtung
übernehmen. [Plesk dokumentiert](https://docs.plesk.com/en-US/obsidian/customer-guide/nodejs-support.76652/)
Document Root, Application Root und Umgebungsvariablen; der hier gewählte
systemd-Weg ist eine eigene Betriebsentscheidung.

## Dateien und Konfiguration

Beispielpfad unter dem Subscription-Home:

```text
notebook/
  current -> releases/<commit-sha>
  releases/<commit-sha>/
  shared/api.env
  shared/data/notebook.db
```

`shared/api.env` mit Modus `0600`, Verzeichnis `shared` mit `0700` anlegen.
Der Dienstbenutzer muss die Datenbank samt WAL-Dateien schreiben können.
Wesentliche Werte:

```ini
NODE_ENV=production
HOST=127.0.0.1
PORT=8787
CORS_ORIGIN=https://notebook.sebastianselinger.de
TRUST_PROXY=127.0.0.1,::1
DATABASE_PATH=./data/notebook.db
AUTH_USERNAME=Huskynarr
# Eigenes langes Passwort und ein zufälliges Geheimnis serverseitig eintragen:
AUTH_PASSWORD=
AUTH_SECRET=
AUTH_TOKEN_TTL_HOURS=2
LLM_PROVIDER=stub
SEED_ON_EMPTY=true
```

Der Produktionsstart lehnt das Standardpasswort `admin`, Passwörter unter 16 Zeichen und
Signaturgeheimnisse unter 32 Zeichen ab. `Huskynarr:admin` bleibt für localhost nutzbar.
Weitere Zugänge werden in `shared/api.env` über `AUTH_ADDITIONAL_USERS` als JSON-Liste
mit `username` und `password` eingerichtet, etwa für den gewünschten Namen `Everlast`;
auch deren Passwörter müssen in Produktion mindestens 16 Zeichen haben. Das lokale
Testpasswort gehört nur in die ignorierte Backend-Umgebung, nicht ins Frontend oder Git.
Ein zufälliges Geheimnis kann mit `openssl rand -hex 32` erzeugt werden; nicht ins Git
übernehmen. Für OpenCode Console/MiMo-V2.6-Flash Free serverseitig `LLM_PROVIDER=openai`,
`LLM_BASE_URL=https://opencode.ai/inference/openai/v1`, `LLM_MODEL=mimo-v2.6-flash-free` und
ein leeres `LLM_API_KEY` konfigurieren; [Kosten-, Datenschutz- und Abnahmegrenzen](providers.md)
beachten. OpenCode Go bietet die Variante `mimo-v2.6-flash` ohne `-free` mit Tokenpreisen.

Das Frontend wird für den gleichen Ursprung mit `VITE_API_BASE_URL=` gebaut. Für lokale
Entwicklung ist die Vorgabe `http://localhost:8787`; ein abweichender API-Ursprung ist
über diese Variable beim Build einstellbar. CORS muss den tatsächlichen Frontend-Ursprung
explizit erlauben. CORS ersetzt keine Anmeldung.

## Dienst

`deploy/notebook.service` nach `~/.config/systemd/user/notebook.service` kopieren,
absolute Pfade und Node-Binary anpassen. Als Subscription-Benutzer:

```bash
systemctl --user daemon-reload
systemctl --user enable notebook.service
```

Ein Administrator aktiviert einmalig `loginctl enable-linger SUBSCRIPTION_USER`, damit
der Dienst nach dem Abmelden weiterläuft. Der Dienst startet aus `current/apps/api`,
wo `.env` und `data` auf `shared/` zeigen. Seine Ausgabe geht ins Journal.
Der Dienst wird hier nur aktiviert: `current` existiert vor der ersten Bereitstellung
noch nicht. Der erste manuelle Plesk-Workflow mit Deploy-Schalter installiert das Release,
erstellt die Verknüpfungen und startet den Dienst. Anschließend
`systemctl --user status notebook.service` und die unten genannten Betriebsprüfungen
ausführen.

## Domain, TLS und nginx

1. In Plesk die Subdomain anlegen. Document Root auf
   `notebook/current/apps/web/dist` setzen. Niemals den Repository-Root freigeben.
2. Gültiges TLS-Zertifikat ausstellen und HTTP auf HTTPS umleiten.
3. Die Vorlage `deploy/nginx.conf` in den vHost integrieren. Bestehende Plesk-
   `location /`-Blöcke nicht doppeln; die SPA verwendet Hash-Navigation und benötigt
   keinen pauschalen Rewrite von API-Fehlern auf `index.html`.
4. Vor Reload `nginx -t` ausführen. Ohne Serverzugriff wurde diese vHost-Integration
   nicht getestet.

Die Datei begrenzt HTTP-Anfragen auf 21 MiB wegen JSON-Escaping; die API begrenzt
den dekodierten Quelltext gesondert auf **10 MiB (10.485.760 Bytes)**. Dieser
Unterschied verhindert, dass gültige Texte mit vielen Escape-Zeichen abgewiesen werden.
`/v1/` erhält keine Cache-Regel. Für die Landingpage und Assets gilt eine CSP mit
`connect-src 'self'`; bei getrenntem API-Ursprung muss dessen HTTPS-Origin ergänzt werden.

## Cloudflare später zuschalten

- DNS-Eintrag für `notebook` auf den tatsächlichen Plesk-Origin setzen; die IP wurde hier
  nicht ermittelt. TLS-Modus **Full (strict)** erst mit gültigem Origin-Zertifikat.
- Für `/v1/*` Cache umgehen; kein „Cache Everything“ für authentifizierte Antworten.
- nginx darf `CF-Connecting-IP` nur von aktuellen Cloudflare-Netzen übernehmen.
  [Offizielle Anleitung zur Original-IP](https://developers.cloudflare.com/support/troubleshooting/restoring-visitor-ips/restoring-original-visitor-ips/)
  und [Netzbereiche/Origin-Schutz](https://developers.cloudflare.com/fundamentals/concepts/cloudflare-ip-addresses/)
  beachten. Keine ungeprüften Forwarded-Header direkt vom Internet vertrauen.
- nginx überschreibt `X-Forwarded-For` mit der so verifizierten `$remote_addr`.
  Node vertraut nur dem lokalen nginx. Den Port 8787 nicht öffentlich freigeben.
- Fail2ban am Origin kann bei Cloudflare-Proxys nicht einfach die Besucher-IP auf
  TCP-Ebene sperren. WAF/Rate-Limits am Cloudflare-Rand oder eine ausdrücklich
  eingerichtete Cloudflare-Ban-Aktion verwenden; niemals pauschal Proxy-IP-Adressen bannen.

## CI/CD, Backup und Rückkehr

Die Workflow-Datei `plesk.yml` baut nach erfolgreichen Prüfungen ein Release-Artefakt.
Eine Veröffentlichung wird nur über den manuellen Deploy-Schalter und das GitHub-
Environment `plesk-production` ausgelöst. Benötigte Variablen:
`PLESK_HOST`, `PLESK_USER`, `PLESK_PORT`, `PLESK_RELEASE_ROOT`; Secrets:
`PLESK_SSH_KEY`, `PLESK_KNOWN_HOSTS`. Den Hostschlüssel unabhängig prüfen, nicht im
Workflow blind mit `ssh-keyscan` übernehmen. Der Deploy-Benutzer erhält nur Zugriff auf
diese Anwendung. Branch-/Environment-Schutz in GitHub gesondert konfigurieren.
Für automatische Release-PRs muss unter Actions → General die Option
„Allow GitHub Actions to create and approve pull requests“ aktiviert sein. Diese
Repository-Einstellung wurde hier nicht geändert; SemVer wird nicht manuell vorgezogen.

Vor Releases SQLite über die SQLite-Backup-Schnittstelle oder bei gestopptem Dienst
sichern. Bei laufendem WAL-Betrieb niemals nur `notebook.db` kopieren. Backups verschlüsselt,
außerhalb des Webroots aufbewahren und eine Wiederherstellung testen. Bei Änderungen am
Datenbankschema erfordert ein Rücksprung gegebenenfalls auch das passende Backup.

Der Deploy-Weg hält Versionsverzeichnisse und wechselt `current`; Startfehler führen
zum Rücksprung auf die vorherige Version. Alte Releases erst nach erfolgreicher
Betriebsprüfung manuell aufräumen. Die Migration arbeitet weiterhin auf derselben
Datenbank; ein Code-Rollback ersetzt deshalb kein Datenbank-Backup.

Nach Erstbetrieb prüfen: Landingpage öffentlich; `/v1/notebooks` ohne Token 401;
drei Fehlanmeldungen erzeugen 429/Countdown; Neustart hebt Sperre nicht auf;
Import knapp über 10 MiB wird abgewiesen; Belegsprung und Notiz funktionieren;
manipuliertes `X-Forwarded-For` ändert den verifizierten Besucher nicht.
