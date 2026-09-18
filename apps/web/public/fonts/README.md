# Hausschrift „Social"

Die Hausschrift der Universität Freiburg ist **lizenzpflichtig** und liegt deshalb
**nicht** in diesem Repository. Ohne die Dateien fällt die Anwendung auf **Arial**
zurück — die vom Corporate Design selbst vorgesehene Zweitschrift. Es fehlt dann
nichts außer dem Schriftbild; nichts bricht.

## Lizenz anfordern

Die Lizenz für das Schriftpaket wird bei Marketing und Events angefragt:
**cd@zv.uni-freiburg.de** (siehe <https://cd.uni-freiburg.de/schrift/>). Die Lizenz
gilt jeweils ein Jahr und ist verlängerbar.

## Dateien ablegen

Die Web-Schnitte in **genau diesen Namen** in diesen Ordner legen:

```
public/fonts/Social-Book.woff2              (und .woff)
public/fonts/Social-Book-Italic.woff2       (und .woff)
public/fonts/Social-Extended-Medium.woff2   (und .woff)
```

Die `@font-face`-Regeln stehen in `social.css` in diesem Ordner und erwarten genau
diese Namen; `index.html` bindet die Datei ein.
Nach dem Ablegen genügt ein Neuladen; es ist kein Bauschritt nötig.

`.gitignore` schließt `*.woff` und `*.woff2` in diesem Ordner aus, damit lizenzierte
Dateien nicht versehentlich committet werden. Diese Sperre bitte nicht aufheben.
