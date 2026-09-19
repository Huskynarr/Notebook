# Sicherheit

## Unterstützte Versionen

Nur der aktuelle Stand von `main` und das jeweils letzte Release erhalten Korrekturen.

## Eine Lücke melden

Bitte **nicht** als öffentliches Issue. Stattdessen:

- über GitHub: *Security › Report a vulnerability* (private Meldung), oder
- per E-Mail an <sebastian.selinger@math.uni-freiburg.de>.

Bitte beschreibe, was betroffen ist, wie es sich reproduzieren lässt und welche Wirkung du
siehst. Eine Antwort kommt innerhalb von sieben Tagen; eine Korrektur, sobald sie geprüft ist.
Wer eine Lücke verantwortungsvoll meldet, wird — auf Wunsch — im Release genannt.

## Was zum Angriffsbild gehört

- Der Server nimmt fremde Adressen als Quelle an (`kind: 'url'`). Private und lokale Ziele
  werden nach der Namensauflösung verworfen, Größe und Zeit sind begrenzt; siehe
  `apps/api/src/domain/fetchSource.ts` und D-019 in `docs/decisions.md`. Umgehungen dieses
  Schutzes sind ausdrücklich meldewürdig.
- Der feste Zugang `admin:admin` ist für den Betrieb auf dem eigenen Rechner gedacht und
  muss vor einer Erreichbarkeit im Netz über `AUTH_PASSWORD` und `AUTH_SECRET` geändert
  werden. Das ist dokumentiert, keine Lücke.
- Das Frontend enthält keine Geheimnisse; ein Test und ein CI-Schritt prüfen das Bundle auf
  bekannte Muster.
