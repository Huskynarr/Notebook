# Fortschritt

Zustand, nicht Plan. Was hier als funktionierend steht, wurde ausgeführt und die Ausgabe
angesehen.

Stand: 2026-09-17

## Funktioniert

- Nichts. Es gibt bisher ausschließlich Dokumentation; es wurde kein Code geschrieben,
  gebaut oder getestet.

## In Arbeit

- Repository-Grundgerüst und Dokumentation (dieser Commit).

## Offen (Pflichtumfang P1–P10 aus docs/product.md)

Alle zehn Punkte sind offen.

## Bekannte Einschränkungen der Entwicklungsumgebung

Relevant, weil sie bestimmen, welche Prüfungen lokal überhaupt laufen können:

- Kein Docker, kein Postgres, keine Root-Rechte auf der Zielmaschine. Mitentscheidend für
  D-006 (SQLite statt Postgres).
- Im verbundenen Projektordner dürfen keine Dateien gelöscht werden. Git legt dort
  Sperrdateien an, die es anschließend nicht entfernen kann. Deshalb liegt das
  Git-Verzeichnis während der Arbeit außerhalb des Ordners; die Dateien werden
  hineingespiegelt.
- Im Ordner liegen aus einem fehlgeschlagenen ersten Versuch `.git-STALE-bitte-loeschen`
  und `.probe-stale`. Beide sind funktionslos und müssen von Hand gelöscht werden.

## Nicht ausgeführte Prüfungen

- `pnpm verify` — existiert noch nicht.
- Integrationstests gegen einen echten LLM-Endpunkt — kein Endpunkt konfiguriert
  (offene Annahme 3 in `docs/product.md`).
