# Fortschritt

Zustand, nicht Plan. Was hier als funktionierend steht, wurde ausgeführt und die Ausgabe
angesehen. Was nicht geprüft werden konnte, steht unter „Nicht geprüft" — nicht weggelassen.

Stand: 2026-09-17 · Version 0.1.0 (noch ohne Release-Tag)

## Funktioniert (geprüft)

Pflichtumfang aus `docs/product.md`:

| # | Anforderung | Stand | Wodurch belegt |
|---|---|---|---|
| P1 | Notebook-Verwaltung | funktioniert | `server.test.ts`, E2E |
| P2 | Text-/Markdown-Import (Einfügen und Datei) | funktioniert | `server.test.ts`, E2E („eigene Quelle hinzufügen") |
| P3 | Markdown-Export inkl. Notizen und Belegangaben | funktioniert | `server.test.ts` („exportiert das Notebook als Markdown") |
| P4 | Quellenwahl wirkt auf den Abruf | funktioniert | `server.test.ts`, `retrieval.test.ts`, E2E |
| P5 | Echte KI-Antworten | **nicht geprüft** — siehe unten | — |
| P6 | Überprüfbare Quellenverweise | funktioniert | `citations.test.ts`, `server.test.ts`, E2E |
| P7 | Notizen anlegen, ändern, löschen | funktioniert | `server.test.ts`, E2E |
| P8 | Lokale Persistenz ohne Datenbankserver | funktioniert | Server startet und antwortet mit `node:sqlite` |
| P9 | Sofort nutzbares Beispiel | funktioniert | E2E („Beispiel-Notebook ist nach dem Start sofort nutzbar") |
| P10 | Fester Zugang `admin:admin` | funktioniert | `auth.test.ts`, `server.test.ts` |

Zuletzt tatsächlich ausgeführt (2026-09-17):

```
pnpm typecheck        5 Projekte, keine Ausgabe
pnpm lint             keine Ausgabe
pnpm format:check     alle Dateien konform
pnpm test             61 Tests in 7 Dateien bestanden
pnpm --filter @notebook/web build   erfolgreich, JS 345 kB (gzip 104 kB)
pnpm exec playwright test           7 Tests bestanden
```

Gemessen, nicht geschätzt:

- Kontrast in beiden Themes an der gebauten Oberfläche: niedrigster Wert 5,24:1
  (`docs/design-system.md`, Abschnitt 1).
- Bei 390 px Breite kein waagerechtes Scrollen (E2E-Test).
- Keine Fehler in der Browserkonsole beim Hauptablauf.

## Nicht geprüft

Diese Punkte sind offen, nicht „vermutlich in Ordnung":

- **P5, echte KI-Antworten.** Es stand kein OpenAI-kompatibler Endpunkt zur Verfügung. Der
  Adapter ist implementiert und typgeprüft, aber **nie gegen ein laufendes Modell
  ausgeführt**. Ungeprüft bleiben damit: ob Modelle die vorgegebene JSON-Form einhalten, ob
  sie Marker zuverlässig setzen, und wie oft ihre wörtlichen Zitate wiederauffindbar sind
  (`precision: exact` gegenüber `chunk`). Alle Tests laufen gegen den Offline-Modus oder ein
  Testdoppel.
- **Belegqualität deutschsprachiger Modelle.** Nicht gemessen, pro Modell zu prüfen.
- **Leistungszusage** aus `docs/product.md` (Abruf und Validierung unter 300 ms bei 30
  Quellen): nicht gemessen. Die einzige belastbare Zahl ist `elapsedMs` in der Antwort,
  im Beispielkorpus einstellig.
- **Barrierefreiheit:** Ränder und Fokusringe gegen ihre Umgebung (3:1) sowie Bedienung bei
  200 % Zoom stehen weiter auf der Prüfliste in `docs/design-system.md`, Abschnitt 9.
- **Die CI-Workflows sind nie gelaufen.** Sie sind geschrieben, aber bis zum ersten Push
  ungetestet. Erwartbare Stolperstellen: `pnpm exec playwright install` und das Verhalten
  des Release-Laufs beim allerersten Tag.

## Bekannte Grenzen

- **Deutsche Komposita im Abruf.** Der lexikalische Abruf findet „Widerspruchsfrist" nicht
  über die Anfrage „Frist", weil Präfixsuche nur nach vorn wirkt. Umgekehrt findet
  „Frist" das Wort „Fristen". Eine Zerlegung von Komposita gibt es nicht; ab wann das
  stört, ist nicht erhoben (offene Annahme 2 in `docs/product.md`).
- **Präfixsuche erst ab fünf Zeichen.** Kürzere Begriffe werden exakt gesucht. Das wurde
  eingeführt, weil `hoch*` über „Hochschule" eine fachfremde Frage scheinbar beantwortbar
  machte.
- **Kein Streaming.** Die Antwort erscheint am Stück. Bei langen Antworten großer Modelle
  wirkt das träge.
- **PDFs werden nicht angenommen.** Der Typ ist im Schema vorgesehen, die API lehnt ihn ab.
- **Der Offline-Modus formuliert nichts.** Ohne Modell listet er nur die gefundenen Stellen.
  Das ist Absicht, kann aber beim ersten Start wie ein Fehler wirken — das Banner sagt es.

## Im Verlauf gefundene Fehler

Festgehalten, weil jeder davon zeigt, welche Prüfung ihn gefunden hat:

1. **Server startete nicht.** Node führt TypeScript nur per Type-Stripping aus und lehnt
   Parameter-Properties ab. Alle Unit-Tests blieben grün, weil vitest anders übersetzt.
   Gefunden erst beim tatsächlichen Start. Eine ESLint-Regel verhindert die Wiederkehr.
2. **CORS ließ PATCH und DELETE nicht durch.** Jede Änderung an Quellen und Notizen
   scheiterte im Browser am Preflight, während alle serverseitigen Tests grün blieben —
   `app.inject` sendet keinen Preflight. Gefunden im E2E-Lauf über die Browserkonsole.
3. **Auswahlkästchen sprang zurück,** weil es auf die Serverantwort wartete. Gefunden im
   E2E-Lauf.
4. **Wettlauf beim schnellen Umschalten:** eine spät eintreffende ältere Antwort stellte die
   Auswahl wieder um. Gefunden im E2E-Lauf, nur im Zusammenspiel zweier Tests.
5. **Kopfleiste lief bei 390 px aus dem Bild.** Gefunden beim Betrachten eines
   Bildschirmfotos, von keinem Test abgedeckt — jetzt schon.
6. **Fachfremde Frage wurde scheinbar beantwortet,** weil `hoch*` „Hochschule" traf.
   Gefunden durch einen Test, der bewusst nach etwas außerhalb des Korpus fragte.

## Nächste sinnvolle Schritte

1. Einen echten Endpunkt anbinden und P5 prüfen — alles Übrige hängt daran.
2. Belegtreue von zwei bis drei Modellen an einem echten Korpus messen und die Quote
   `exact` gegenüber `chunk` festhalten.
3. CI einmal laufen lassen und die Workflows nachziehen.
4. Erst danach PDFs als Erweiterung.

## Einschränkungen der Entwicklungsumgebung

Relevant, weil sie bestimmen, was lokal überhaupt geprüft werden konnte:

- Kein Docker, kein Postgres, keine Root-Rechte. Mitentscheidend für D-006.
- Der Playwright-Browser ließ sich nicht herunterladen; der E2E-Lauf nutzte über
  `CHROMIUM_PATH` einen vorhandenen Chromium.
- Im verbundenen Projektordner dürfen keine Dateien gelöscht werden. Git kann dort seine
  Sperrdateien nicht entfernen, weshalb während der Arbeit außerhalb des Ordners committet
  und hineingespiegelt wurde.
- Im Ordner liegen aus fehlgeschlagenen Zwischenschritten `.git-STALE-bitte-loeschen`,
  `.probe-stale` und `.transfer-tmp.tar`. Alle drei sind funktionslos und müssen von Hand
  gelöscht werden.
