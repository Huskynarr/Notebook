# Mitwirken

Danke, dass du dir das Projekt ansiehst. Es ist klein und hat feste Regeln — sie stehen in
[`AGENTS.md`](AGENTS.md) und gelten für Menschen und Werkzeuge gleichermaßen. Das Wichtigste
in Kürze:

## Bevor du anfängst

- **Ein Issue zuerst**, außer bei Tippfehlern und offensichtlichen Kleinigkeiten. Beschreibe
  das Problem, nicht die Lösung — die Vorlagen unter `.github/ISSUE_TEMPLATE` helfen.
- Lies [`docs/product.md`](docs/product.md): was das Produkt ist, was es bewusst nicht ist.
  Änderungen an den Nicht-Zielen brauchen einen Eintrag in `docs/decisions.md`.

## Einrichtung

```
pnpm install          # baut das geteilte Paket mit (prepare)
pnpm dev              # Frontend http://localhost:5173, Backend http://localhost:8787
pnpm verify           # das, was die CI prüft: Typen, Stil, Formatierung, Tests, Build
pnpm test:e2e         # Hauptablauf im Browser (Playwright, Chromium)
```

Node ≥ 20.11 und pnpm 9 (`corepack enable`). Ohne Sprachmodell läuft das Backend mit
`LLM_PROVIDER=stub` — Antworten sind dann gekennzeichnet simuliert, die Belege echt. Details
in der [README](README.md#ein-echtes-modell-verbinden).

## Regeln, die ein Pull Request einhalten muss

1. **Eine Änderung je Commit**, prüfbar für sich. Refactoring und Verhalten getrennt.
2. **Conventional Commits** (`feat:`, `fix:`, `docs:`, `test:`, `ci:`, `chore:`, `refactor:`,
   `perf:`; Scope frei, z. B. `feat(web): …`). Ein `!` oder `BREAKING CHANGE:` markiert einen
   Bruch. Daraus entsteht das Release automatisch — falsche Präfixe ergeben falsche Versionen.
3. **TypeScript strict, Tailwind über Tokens.** Keine Farb-, Abstands- oder Schriftwerte
   direkt im JSX; alles kommt aus `styles/theme.css` (erzeugt aus `tools/build-theme.py`).
4. **Keine Secrets im Frontend.** Alles, was mit `VITE_` beginnt, steht im Klartext im
   Bundle; ein Test (`no-secrets.test.ts`) und ein CI-Schritt prüfen das.
5. **Keine unmarkierten Simulationen.** Was nicht echt ist (kein Modell, Demo ohne Server),
   trägt `simulated: true` und ist in der Oberfläche gekennzeichnet.
6. **Keine erfundenen Prüfergebnisse.** Im PR steht der tatsächlich ausgeführte Befehl mit
   seinem Ergebnis. „Sollte funktionieren" ist keine Prüfung.
7. **Belegmechanik ist geschützt.** Änderungen an `chunkText`, `citations.ts` oder den
   Offsets brauchen einen Test, der die Änderung zeigt.
8. **Doku mitziehen:** eine Entscheidung → `docs/decisions.md`; ein neuer Stand →
   `docs/progress.md`; KI-Einsatz → `AI_usage.md`, ehrlich, mit dem, was geprüft wurde.

## Ablauf

1. Fork oder Branch von `main`: `feat/<kurz>`, `fix/<kurz>`, `docs/<kurz>`.
2. Ändern, `pnpm verify` grün, bei Oberflächenänderungen auch `pnpm test:e2e`.
3. Pull Request nach der Vorlage. Die CI führt Typen, Stil, Tests, E2E und CodeQL aus und
   hängt einen Kommentar mit der Bundle-Größe und ein Demo-Artefakt an.
4. Review. Kleine PRs werden schnell gemerged; große werden um Aufteilung gebeten.

## Releases

Releases entstehen aus den Commit-Präfixen: `release-please` hält einen Release-PR mit
`CHANGELOG.md` und Versionssprung offen; sein Merge erzeugt Tag und GitHub-Release. Niemand
setzt Versionsnummern von Hand.

## Fragen

Ein Issue mit dem Label `question` reicht. Sicherheitslücken bitte nicht öffentlich melden —
siehe [`SECURITY.md`](SECURITY.md).
