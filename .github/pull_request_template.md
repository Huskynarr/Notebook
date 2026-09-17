## Was ändert sich

<!-- Ein Satz. Passt es nicht in einen Satz, ist die Änderung zu groß (AGENTS.md Regel 1). -->

## Warum

<!-- Der Grund, nicht die Umsetzung. -->

## Überprüft durch

<!-- Konkreter Befehl und echtes Ergebnis, oder eine reproduzierbare Handprüfung.
     Keine Vermutung, keine aus dem Kopf zitierte Zahl (AGENTS.md Regel 6). -->

```
$ pnpm verify
```

## Abhaken

- [ ] Ein Commit = eine prüfbare Änderung; Refactoring und Verhalten getrennt
- [ ] Commit-Text nach Conventional Commits, Versionswirkung stimmt
- [ ] `pnpm verify` läuft durch, Ausgabe angesehen
- [ ] Keine Secrets im Frontend, keine unmarkierten Simulationen
- [ ] Belegmechanik unverändert — oder geändert **und** durch einen Test abgedeckt
- [ ] `docs/decisions.md` / `docs/progress.md` / `AI_usage.md` nachgezogen
