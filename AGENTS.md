# AGENTS.md — Verbindliche Arbeitsregeln

Diese Regeln gelten für jede Person und jeden Agenten, der in diesem Repository arbeitet.
Sie sind nicht Empfehlung, sondern Abnahmekriterium. Ein Beitrag, der gegen eine Regel
verstößt, wird zurückgewiesen — auch wenn er funktioniert.

## 1. Kleine, überprüfbare Änderungen

- Ein Commit = eine abgeschlossene, für sich prüfbare Änderung. Kein Sammelcommit.
- Richtwert: unter 400 geänderte Zeilen Produktivcode. Wird es mehr, ist die Änderung
  vorher zu teilen.
- Jeder Commit lässt das Repository in einem Zustand zurück, in dem
  `pnpm verify` (typecheck + lint + test + build) durchläuft.
- Refactoring und Verhaltensänderung nie im selben Commit.
- Jede Änderung muss überprüfbar sein: entweder durch einen Test, oder durch eine im
  Commit-Text genannte, reproduzierbare Handprüfung (Befehl + erwartete Ausgabe).

## 2. Commits: Conventional Commits + semantische Versionierung

Format:

```
<typ>(<scope>): <beschreibung im imperativ>

<warum, nicht was>

Verifiziert-durch: <konkreter Befehl oder Handprüfung>
```

Typen und ihre Wirkung auf die Version (SemVer, MAJOR.MINOR.PATCH):

| Typ | Bedeutung | Version |
|---|---|---|
| `feat` | neue Funktion für Nutzende | MINOR |
| `fix` | Fehlerbehebung | PATCH |
| `perf` | Verhalten gleich, messbar schneller | PATCH |
| `refactor` | kein beobachtbares Verhalten geändert | keine |
| `docs`, `test`, `build`, `ci`, `chore`, `style` | Begleitarbeit | keine |
| beliebiger Typ mit `!` oder `BREAKING CHANGE:` im Body | Bruch | MAJOR |

- Scopes: `web`, `api`, `shared`, `rag`, `db`, `docs`, `ci`.
- Vor `1.0.0` gilt: Brüche erhöhen MINOR, nicht MAJOR. Das Repo startet bei `0.1.0`.
- Versionsnummern werden nicht von Hand in `package.json` geschrieben, sondern über
  den Release-Workflow gesetzt. Tags lauten `v<MAJOR>.<MINOR>.<PATCH>`.

## 3. Technischer Rahmen

- **TypeScript im Strict-Modus**, überall. `strict: true`, dazu `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `noImplicitOverride`, `verbatimModuleSyntax`.
- **`any` ist verboten** (ESLint-Fehler, kein Warning). Wo eine Fremdbibliothek keine Typen
  liefert: `unknown` plus Validierung mit zod an der Systemgrenze.
- `@ts-expect-error` nur mit Begründung in derselben Zeile und einem Verfallsdatum im
  Kommentar. `@ts-ignore` ist verboten.
- **Tailwind CSS** für alles Visuelle. Keine zweite Styling-Ebene (kein CSS-in-JS, keine
  UI-Bibliothek mit eigenem Theming). Design-Tokens leben zentral im Tailwind-Theme, nicht
  als verstreute Hex-Werte in Komponenten.
- Externe Daten werden an der Grenze validiert (HTTP-Body, ENV, Datei-Inhalte, LLM-Antworten).
  Ungeprüfte Daten dürfen nie in die Domänenschicht.

## 4. Keine Secrets im Frontend

- Im Frontend-Bundle steht kein API-Schlüssel, kein Token, kein Passwort — auch nicht in
  `.env`-Dateien, die über `VITE_`-Variablen eingelesen werden. Alles, was mit `VITE_`
  beginnt, landet im Klartext im ausgelieferten JavaScript.
- Erlaubte öffentliche Build-Konfiguration: `VITE_API_BASE_URL`, `VITE_BASE_PATH` und
  `VITE_DEMO`. Letzteres ist ausschließlich die klar ungeschützte Browserdemo.
- LLM-Zugangsdaten leben ausschließlich im Backend-Prozess und verlassen ihn nie — auch
  nicht in Fehlermeldungen, Logs oder API-Antworten.
- Der Test `apps/web/src/__tests__/no-secrets.test.ts` prüft das gebaute Bundle auf
  Schlüsselmuster. Er darf nicht deaktiviert werden.

## 5. Keine unmarkierten Simulationen

- Platzhalter, Stubs, Mock-Daten und noch nicht implementierte Pfade sind im Code als
  solche gekennzeichnet und im UI sichtbar, wo Nutzende sie sonst für echt halten könnten.
- Eine Funktion, die so tut, als wäre sie fertig, ist ein Fehler — kein Fortschritt.
- Ein Modellaufruf wird nie durch eine feste Antwort ersetzt, ohne dass das im UI steht.
  Der Offline-/Demo-Modus des Backends (`LLM_PROVIDER=stub`) liefert seine Antworten mit
  einem `simulated: true`-Feld aus, und das Frontend zeigt dafür ein sichtbares Banner.
- Zwischenstände heißen im Text "nicht implementiert", nicht "kommt bald".

## 6. Keine erfundenen Testergebnisse

- Es wird nie behauptet, ein Test, ein Build oder eine Prüfung sei gelaufen, wenn sie nicht
  tatsächlich ausgeführt wurde. Kein "sollte durchlaufen", kein aus dem Kopf zitiertes
  Ergebnis.
- Berichtete Zahlen (Testanzahl, Coverage, Laufzeit) stammen aus echter Ausgabe.
- Wenn eine Prüfung in der Umgebung nicht laufen kann, wird das als **nicht ausgeführt**
  berichtet, mit Grund — nicht als bestanden und nicht als übersprungen weggelassen.
- Übersprungene Tests (`it.skip`, fehlende Datenbank) werden in `docs/progress.md` genannt,
  solange sie übersprungen sind.

## 7. Keine unnötige Infrastruktur

- Nichts wird eingeführt, was für ein aktuell benanntes Ziel nicht gebraucht wird:
  keine Container, keine Message-Queue, kein Cache-Layer, kein Kubernetes, kein
  zusätzlicher Datenbankserver, keine Feature-Flag-Plattform.
- Eine neue Laufzeitabhängigkeit braucht einen Eintrag in `docs/decisions.md` mit dem
  Grund und der verworfenen Alternative.
- Die Standard-Entwicklungsumgebung ist: Repo klonen, `pnpm install`, `pnpm dev`.
  Alles, was darüber hinaus nötig wäre, ist zu begründen oder zu entfernen.
- Abstraktion erst beim zweiten echten Anwendungsfall, nicht vorsorglich.

## 8. Quellenbindung ist nicht verhandelbar

Das ist der Produktkern; die Regeln dazu sind strenger als der Rest.

- Jede inhaltliche Aussage einer KI-Antwort trägt mindestens einen Beleg-Marker.
- Ein Marker zeigt auf einen Chunk, der in **diesem** Abruf tatsächlich zurückgegeben wurde,
  mit Quell-ID und Zeichen-Offsets in den Originaltext.
- Ungültige Marker, nicht auffindbare Zitate oder unbelegte Sätze führen bei echten
  Modellantworten zum Zurückhalten der gesamten Antwort. Bloßes Entfernen des Markers
  genügt nicht. Offline-Fundstellen bleiben als Simulation gekennzeichnet.
- Trägt keine Quelle die Frage, ist die korrekte Antwort die Auskunft, dass die ausgewählten
  Quellen das nicht hergeben — nicht eine Antwort aus Modellwissen.
- Änderungen an Chunking, Retrieval oder Zitat-Validierung brauchen einen Test, der den
  geänderten Fall abdeckt.

## 9. Dokumentationspflicht

Bei jeder inhaltlichen Änderung mitzuführen, knapp und ohne Prosa-Ballast:

- `docs/decisions.md` — jede Entscheidung mit Tragweite: Datum, Entscheidung, Grund,
  verworfene Alternative. Bestehende Einträge werden nicht umgeschrieben; eine Umkehr
  bekommt einen neuen Eintrag, der auf den alten verweist.
- `docs/progress.md` — was tatsächlich funktioniert, was nicht, was offen ist. Kein Plan,
  sondern Zustand.
- `AI_usage.md` — jeder tatsächliche KI-Einsatz bei der Entwicklung: Datum, Werkzeug,
  Aufgabe, was davon übernommen wurde und wie es geprüft wurde.

## 10. Ablauf pro Änderung

1. Ziel in einem Satz formulieren. Passt es nicht in einen Satz, ist es zu groß.
2. Test oder Handprüfung festlegen, die das Ziel überprüfbar macht.
3. Implementieren.
4. `pnpm verify` ausführen und die **echte** Ausgabe ansehen.
5. Doku nach Regel 9 nachziehen.
6. Committen nach Regel 2.

## 11. Betrieb und Missbrauchsgrenzen

- Kein öffentliches Deployment mit dem Standardpasswort admin; localhost bleibt die explizite Demo-Ausnahme.
- Jede Datenroute verlangt ein serverseitig geprüftes Token; Clientprüfungen ergänzen nur.
- Uploadgröße in UTF-8-Bytes auf beiden Seiten prüfen; Begrenzungen nie nur im UI.
- Forwarded-Header nur von konfigurierten vertrauenswürdigen Proxys akzeptieren.
- Kein neuer URL-Abruf, kein Crawling und kein zusätzliches Konto-/Rollenmodell ohne Auftrag.
- Ein wiedergefundenes Zitat ist kein Beweis für die inhaltliche Richtigkeit einer Aussage.
- Vor Push `pnpm check:all`; die Hooks sind eine Hilfe, CI bleibt verpflichtend.
- Deployment nur aus demselben geprüften Commit. Fehlende Modell-/Serverzugänge ehrlich
  als offen dokumentieren; keine ungetestete Veröffentlichung behaupten.
