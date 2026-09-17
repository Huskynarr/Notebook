# Entscheidungen

Neueste zuerst. Ein Eintrag wird nie umgeschrieben. Eine Umkehr bekommt einen neuen Eintrag,
der auf den alten verweist.

---

## D-007 · 2026-09-17 · Belege als Zeichen-Offsets, serverseitig validiert

**Entscheidung:** Ein Beleg ist ein Tripel aus Quell-ID, Start- und End-Zeichenoffset im
gespeicherten Originaltext. Das Modell wird angewiesen, Marker `[n]` zu setzen, die auf die
nummerierten Chunks des aktuellen Abrufs zeigen. Vor der Auslieferung prüft das Backend
jeden Marker gegen die tatsächlich abgerufenen Chunks; nicht auflösbare Marker werden
entfernt.

**Grund:** Der Produktkern ist die Prüfbarkeit einer einzelnen Aussage. Offsets erlauben
Hervorhebung exakt der belegenden Zeichen, unabhängig davon, wie das Frontend den Text
darstellt. Die Validierung verhindert, dass ein erfundener Marker wie ein Beleg aussieht.

**Verworfen:** Belege nur auf Dokumentebene (nicht prüfbar, das ist genau das Problem des
Marktstandards). Belege als vom Modell wiederholtes Zitat (Modelle verändern Zitate beim
Abschreiben; der Abgleich würde scheitern oder falsch positiv ausgehen).

---

## D-006 · 2026-09-17 · SQLite als Persistenz, Postgres-Adapter mitgeplant

**Entscheidung:** Persistenz über eine SQLite-Datei mit FTS5 für den lexikalischen Abruf.
Der Zugriff läuft über Repository-Interfaces, sodass ein Postgres-Adapter später ohne
Umbau der Domänenschicht ergänzt werden kann.

**Grund:** "Lokale Persistenz" und "keine umfangreiche Vektor-Infrastruktur" sind gesetzte
Anforderungen. SQLite braucht keinen Serverprozess, keinen Container und keine Ports. Die
Entwicklungsumgebung bleibt bei `pnpm install && pnpm dev`.

**Verworfen:** Postgres + pgvector (am 17.09. zunächst gewählt, am selben Tag revidiert,
nachdem "lokale Persistenz" und "keine umfangreiche Vektor-Infrastruktur" als Anforderungen
ergänzt wurden). Postgres hätte für Entwicklung und Test einen laufenden Datenbankserver
vorausgesetzt; auf der Zielumgebung stehen weder Docker noch Postgres noch Root-Rechte
zur Verfügung. Ersetzt insofern die frühere Festlegung; der Postgres-Adapter bleibt als
Erweiterungspunkt vorgesehen.

---

## D-005 · 2026-09-17 · Lexikalischer Abruf als Standard, Embeddings als Erweiterung

**Entscheidung:** Standard-Retrieval ist BM25 über FTS5 auf Absatz-Chunks. Ein
Embedding-basiertes Reranking ist hinter demselben Interface vorgesehen und per
Konfiguration abschaltbar; es ist in v0.1 nicht aktiv.

**Grund:** Lexikalische Treffer sind nachvollziehbar — man sieht, warum ein Chunk gefunden
wurde. Das stützt den Qualitätsfokus. Embeddings verlangen ein zweites Modell, einen
Indexaufbau und Speicher für Vektoren, ohne dass für den ersten Anwendungsfall belegt wäre,
dass sie nötig sind.

**Verworfen:** Vektorabruf als Standard (mehr Infrastruktur, keine erhobene Evidenz für
Mehrwert bei konkreten Fragen an einen kleinen Korpus). Offene Annahme 2 in
`docs/product.md` hält fest, dass das ungeprüft ist.

---

## D-004 · 2026-09-17 · OpenAI-kompatibler Provider-Adapter

**Entscheidung:** Das Backend spricht die OpenAI-Chat-Completions-Schnittstelle. Basis-URL,
Modellname und Schlüssel kommen aus Umgebungsvariablen des Backend-Prozesses.

**Grund:** Dieselbe Schnittstelle bedienen vLLM, Ollama, LiteLLM, Azure und OpenAI selbst.
Die Entscheidung, welches Modell die Universität betreibt, ist offen (offene Annahme 3) und
darf den Bau nicht blockieren.

**Verworfen:** Festlegung auf einen Anbieter (blockiert auf eine ungeklärte
Datenschutzfrage). Eine eigene Abstraktion über mehrere Anbieter-SDKs (mehr Code, kein
zusätzlicher Nutzen, solange alle Kandidaten OpenAI-kompatibel sprechen).

---

## D-003 · 2026-09-17 · Fester Zugang statt Nutzerverwaltung

**Entscheidung:** Ein einziges, per Umgebungsvariable konfigurierbares Zugangspaar
(Vorgabe `admin:admin`), Sitzung über ein signiertes Token. Keine Registrierung, keine
Rollen, keine Nutzertabelle.

**Grund:** Der Dienst läuft lokal für eine Person. Nutzerverwaltung ist ausdrückliches
Nicht-Ziel und wäre Infrastruktur ohne Anforderung.

**Verworfen:** OIDC gegen das Uni-Login (richtig für einen zentralen Betrieb, aber der ist
nicht das Ziel). Gar keine Absicherung (der Dienst gibt Dokumentinhalte aus; ein Riegel
gegen versehentliche Erreichbarkeit ist billig).

**Achtung:** Diese Entscheidung setzt voraus, dass der Dienst nicht im Netz erreichbar ist.
Siehe offene Annahme 7.

---

## D-002 · 2026-09-17 · Monorepo mit pnpm-Workspaces

**Entscheidung:** Ein Repository mit `apps/web`, `apps/api`, `packages/shared`.
Geteilte Typen und zod-Schemas liegen in `packages/shared` und sind die einzige Quelle der
Wahrheit für den API-Vertrag.

**Grund:** Frontend und Backend ändern sich gemeinsam. Ein geteiltes Schema-Paket macht
Vertragsbrüche zu Typfehlern statt zu Laufzeitfehlern.

**Verworfen:** Zwei Repositories (Vertragsdrift, doppelte Release-Koordination).
Generierter Client aus OpenAPI (zusätzlicher Generierungsschritt; bei einem gemeinsam
versionierten Monorepo kein Gewinn).

---

## D-001 · 2026-09-17 · Eigenes Design statt Komponentenbibliothek

**Entscheidung:** Eigene Komponenten auf Tailwind-Basis, mit semantischen Design-Tokens im
Tailwind-Theme. Für Verhalten ohne eigenes Aussehen (Dialog, Tabs, Fokusfallen) werden
unstyled Primitives verwendet.

**Grund:** "Eigenes Design" ist gesetzte Anforderung. Eine Bibliothek mit eigenem Theming
brächte eine zweite Styling-Ebene und damit einen Verstoß gegen Regel 3 in `AGENTS.md`.

**Verworfen:** Fertige Komponentenbibliothek mit Theme (schneller, aber erkennbar fremdes
Erscheinungsbild und doppelte Token-Haltung).
