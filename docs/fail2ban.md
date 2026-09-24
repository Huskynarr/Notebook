# Fail2ban für Notebook

Die API drosselt Anmeldungen bereits nach drei Fehlern; dieser Zustand liegt in
SQLite. Fail2ban ist eine zusätzliche Betriebsschutzschicht. Der Filter zählt
`auth_failed` und `auth_rate_limited`; die Vorlage sperrt nach sechs solchen
Ereignissen innerhalb von zehn Minuten für eine Stunde. Gemeinsame Uni-/NAT-Adressen
teilen diese IP-Sperre. Die Jail bleibt mit `enabled = false` zunächst deaktiviert.

## Journal der Plesk-User-Service

`deploy/notebook.service` schreibt unveränderte Pino-JSON-Zeilen mit ISO-Zeitstempel
ins Journal (`SyslogIdentifier=notebook-api`). Fail2ban läuft als Systemdienst und
benötigt Zugriff auf dieses Journal sowie `python3-systemd`. Der Backend-Wert
`systemd[journalflags=1]` berücksichtigt auch Benutzerjournale; die Voreinstellung
würde diese ausschließen.

Auf dem Zielserver sind die Vorlagen nach `/etc/fail2ban/filter.d/notebook-auth.conf`
und `/etc/fail2ban/jail.d/notebook.local` zu übernehmen. Vor Aktivierung:

1. `REPLACE_WITH_SUBSCRIPTION_UID` durch die numerische Ausgabe von
   `id -u PLESK_SUBSCRIPTION_USER` ersetzen. Zusammen mit `_SYSTEMD_USER_UNIT` und
   `SYSLOG_IDENTIFIER` verhindert dies, dass gleichnamige Dienste anderer Plesk-Nutzer
   als Notebook-Logquelle gelten.
2. Die echte Besucher-IP und den Proxy-Vertrauenspfad gemäß [Deployment](deployment.md)
   prüfen. Die API darf fremde `X-Forwarded-For`-Header nicht ungeprüft übernehmen.
3. Die vorhandene Firewall prüfen; `nftables-multiport` ist eine Vorlage für einen
   direkt erreichbaren Origin. Erst nach den folgenden Prüfungen ist
   `enabled = true` sinnvoll; anschließend erfolgt ein gezielter Fail2ban-Reload
   durch die Serveradministration. Das Projekt aktiviert keine Firewall-Regeln.

```bash
# Als Serveradministration; UID passend einsetzen.
journalctl _SYSTEMD_USER_UNIT=notebook.service SYSLOG_IDENTIFIER=notebook-api _UID=12345 -n 20 -o cat
fail2ban-regex 'systemd-journal[journalflags=1]' /etc/fail2ban/filter.d/notebook-auth.conf --journalmatch '_SYSTEMD_USER_UNIT=notebook.service SYSLOG_IDENTIFIER=notebook-api _UID=12345'
fail2ban-client -t
# Nach bewusster Aktivierung und Reload:
fail2ban-client status notebook-auth
```

Der Filter erwartet die tatsächlich verwendete Feldreihenfolge und Meldung der
API. Pretty-Logging, umgeordnete JSON-Felder oder zusätzliche Log-Wrapper benötigen
eine Filteranpassung und einen erneuten Regressionstest. Weder Nutzernamen noch
Passwörter werden für das Matching benötigt.

## Alternative: rohe JSON-Logdatei

Bei bewusst eingerichteter Datei-Protokollierung sind `backend = polling` und der
richtige `logpath`, beispielsweise `/var/log/notebook/api.log`, statt des
Systemd-Backends einzutragen. `journalmatch` entfällt. Derselbe Filter verarbeitet
die unveränderten JSON-Zeilen. Datei, Verzeichnisrechte, Rotation und Wiederöffnung
nach Rotation gehören zur Betriebsintegration; die Anwendung legt diesen Beispielpfad
nicht selbst an. Journal- und Datei-Jail dürfen nicht dieselben Ereignisse doppelt zählen.

```bash
fail2ban-regex /var/log/notebook/api.log /etc/fail2ban/filter.d/notebook-auth.conf --usedns=no
```

## Cloudflare

Bei aktiviertem Cloudflare-Proxy kommt die TCP-Verbindung von Cloudflare. Ein
Origin-Firewall-Ban gegen die protokollierte Besucher-IP blockiert diesen Zugriff
daher nicht. Cloudflare-Proxy-Adressen dürfen niemals als Angreifer gesperrt werden;
das würde andere oder sämtliche Besucher aussperren. Die mitgelieferte nftables-Jail
bleibt in dieser Topologie deaktiviert. Die persistente API-Drosselung bleibt aktiv.
Zusätzliche Besuchersperren müssen am Cloudflare-Edge oder nach sicherer
IP-Wiederherstellung auf HTTP-Ebene durchgesetzt werden. Eine Cloudflare-Ban-Aktion
mit API-Token wird bewusst nicht automatisch eingerichtet.

## Verifikation

```bash
bash tools/test-fail2ban.sh
```

Der Test benötigt `fail2ban-regex` und Python 3. Er prüft fünf exakt extrahierte
IPv4-/IPv6-Adressen, sieben Nichttreffer einschließlich manipulierter JSON-Strings
und zwölf erkannte Zeitstempel. Mit dem echten `fail2ban-regex` aus Fail2ban **1.1.0**
lokal bestanden, einschließlich UTC-Auswertung bei `TZ=Europe/Berlin`. Vier reale
API-Logereignisse aus drei fehlgeschlagenen Anmeldungen und einer gedrosselten
Anfrage wurden ebenfalls korrekt erkannt. CI führt den Regressionstest mit dem Ubuntu-Paket aus. Echte
Journal-Zugriffsrechte, nftables-Sperren und Cloudflare-Regeln wurden in dieser
Entwicklungsumgebung nicht geprüft oder aktiviert.

Referenzen: [Fail2ban-Konfiguration und Systemd-Backend](https://manpages.debian.org/bookworm/fail2ban/jail.conf.5.en.html),
[Fail2ban-Regex-Werkzeug](https://github.com/fail2ban/fail2ban/blob/master/man/fail2ban-regex.1),
[Cloudflare: Besucher-IP wiederherstellen](https://developers.cloudflare.com/support/troubleshooting/restoring-visitor-ips/restoring-original-visitor-ips/).
