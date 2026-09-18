# Design-System

Verbindliche Spezifikation. Drei Designs, in den Einstellungen umschaltbar, je hell und
dunkel. Die **Paletten liegen als Daten in `tools/build-theme.py`**; daraus wird
`apps/web/src/styles/theme.css` erzeugt (`pnpm theme`). Weicht das Theme von diesem
Dokument ab, ist das Theme falsch, nicht das Dokument — und weicht `theme.css` vom Generator
ab, ist jemand von Hand hineingeraten (die CI prüft das).

Keine Komponente verwendet rohe Werte oder kennt ein Design. In JSX steht
`bg-surface-raised`, nie `bg-[#faf8f1]` und nie eine `dark:`-Variante. Ein Design ist
ausschließlich ein Satz von Token-Werten.

| Design | `data-design` | Herkunft | Verbindlichkeit |
|---|---|---|---|
| Papier und Tinte | `eigen` (Vorgabe) | eigener Entwurf | vollständig eigene Festlegung |
| Universität Freiburg | `uni-freiburg` | <https://cd.uni-freiburg.de> | CD-Werte; Abweichungen in Abschnitt 10 |
| huskynarr | `huskynarr` | <https://huskynarr.de> | **Näherung** — siehe Abschnitt 11 |

---

## 0. Gestaltungshaltung

Drei Festlegungen, die für alle Designs gelten:

1. **Ein Design gibt Farben, nicht Bedeutung.** Welche Rolle eine Farbe in der Anwendung
   spielt, legt dieses Dokument fest und hält es über alle Designs durch. Deshalb kann das
   Design gewechselt werden, ohne dass sich die Bedienung ändert.
2. **Die Akzentfarbe gehört dem Beleg.** `accent` markiert ausschließlich Belegmechanik:
   Zitatmarker, hervorgehobene Quellenstellen, die Verbindung zwischen Aussage und Original.
   Kein Button, keine Bestätigung, keine Plakette trägt sie. In jedem Design ist ein Zitat
   deshalb die einzige Stelle in dieser Farbe — und diese Reservierung ist nicht verhandelbar.
3. **Dichte ohne Enge.** Drei Spalten mit viel Information. Ordnung entsteht durch
   Flächenwechsel und Abstand, nicht durch Rahmen und Linien.

---

## 1. Farbe

Semantische Namen, keine Farbnamen. Die **Werte** stehen je Design und Erscheinungsbild in
`tools/build-theme.py` — hier stehen die **Rollen**, die in jedem Design gleich sind.

### Flächen

| Token | Bedeutung |
|---|---|
| `surface-sunken` | Anwendungshintergrund, unterste Ebene |
| `surface` | Panels und Spalten |
| `surface-raised` | Karten, Eingaben, Chat-Blasen |
| `surface-overlay` | Dialoge, Popover, Menüs |
| `surface-inset` | Vertiefungen, neutrale Plaketten, Codeblöcke |

### Text

| Token | Verwendung |
|---|---|
| `content-strong` | Überschriften, Antworttext |
| `content` | Fließtext |
| `content-muted` | Metadaten, Hilfetext |
| `content-subtle` | Platzhalter, Deaktiviertes — nie für Inhalt |
| `content-inverted` | Text auf dunklen Füllungen |

### Ränder

`border-subtle` (Flächentrennung) · `border` (Eingaben, Karten in Ruhe) · `border-strong`
(Zeigerkontakt).

### Beleg — reserviert

**`accent` ist eine Flächenfarbe, keine Textfarbe.** Text auf `accent` ist immer
`accent-contrast`. Das folgt aus dem Freiburger CD-Grün, das als Schrift auf hellem Grund
nur rund 3,3:1 hält — und gilt für alle Designs, damit die Komponenten gleich bleiben.

| Token | Verwendung |
|---|---|
| `accent` | aktiver Marker, Beleglinie neben einer belegten Antwort |
| `accent-hover` | Zeigerkontakt auf aktiven Elementen |
| `accent-surface` | Marker in Ruhe, hervorgehobene Fundstelle |
| `accent-surface-strong` | Zeigerkontakt, Trefferplakette |
| `accent-border` | Unterlinie der Fundstelle |
| `accent-contrast` | Text auf `accent` |

### Aktion — alles Übrige

`action` (primäre Schaltflächen, Fokus) · `action-hover` · `action-surface` (ausgewählter
Tab) · `action-contrast` (Text auf `action`).

### Status

Vier Töne. **Keine Erfolgsfarbe** — eine Bestätigung ist `info`, damit die Akzentfarbe dem
Beleg vorbehalten bleibt. Statustext ist **immer** `content-strong`, nie die Statusfarbe;
die Farbe liegt auf Fläche (`*-surface`), Balken (`warning-mark`) und Symbol — und nie
allein: jede Statusanzeige trägt zusätzlich ein Symbol und Text.

`info` · `warning` · `danger`, je mit `-surface`; `warning-mark` für Balken und Symbol.

### Fokus

`focus-ring`, 2 px Ring mit 2 px Abstand, immer sichtbar — nie `outline: none` ohne
Ersatz. Auf Belegelementen `accent`.

### Gemessene Kontraste

Am 2026-09-18 an der gebauten Oberfläche gemessen (berechnete Werte aus den tatsächlich
angewendeten Stilen, Chromium), alle drei Designs, hell und dunkel:

| Element | eigen hell | eigen dunkel | Uni hell | Uni dunkel | huskynarr hell | huskynarr dunkel |
|---|---|---|---|---|---|---|
| Überschrift | 15,68 | 14,79 | 19,76 | 19,11 | 18,92 | 16,74 |
| Metatext | 12,96 | 9,93 | 21,00 | 13,21 | 17,49 | 12,08 |
| Zitatmarker in Ruhe | 15,69 | 10,80 | 17,25 | 12,61 | 17,53 | 11,69 |
| Zitatmarker aktiv | 7,46 | 8,58 | 6,35 | 7,93 | **5,47** | 10,61 |
| Fundstelle | 15,69 | 10,80 | 17,25 | 12,61 | 17,53 | 11,69 |
| Primäre Schaltfläche | 10,64 | 11,08 | 8,10 | 9,19 | 14,52 | 18,11 |

Niedrigster Wert über alle Kombinationen: **5,47:1**, über der AA-Schwelle von 4,5:1.
**Nicht gemessen:** `content-subtle` (per Definition nur für nicht-inhaltlichen Text),
Ränder und Fokusringe gegen ihre Umgebung — offen in Abschnitt 9.

---

## 2. Typografie

Die Familien sind Teil des Designs und liegen als Tokens `font-ui`, `font-display`,
`font-reading`, `font-mono` im Generator:

| Design | Oberfläche | Lesetext | Bemerkung |
|---|---|---|---|
| eigen | Inter | Source Serif 4 | Serife trennt gelesenen Inhalt von Bedienoberfläche; mitgeliefert (@fontsource) |
| uni-freiburg | Social → Arial | Social → Arial | Social ist lizenzpflichtig und liegt nicht im Repo; Rückfall auf Arial ist die vom CD vorgesehene Zweitschrift. Ablageort: `apps/web/public/fonts/README.md` |
| huskynarr | Inter | Inter | Die Schrift der Vorlage ist nicht belegt (Abschnitt 11) |

Dicktengleich (`font-mono`) nur für Zeichenpositionen und IDs: JetBrains Mono, im Design
`uni-freiburg` ein Systemstack, weil das CD keine kennt.

| Token | Größe / Zeilenhöhe | Gewicht | Verwendung |
|---|---|---|---|
| `text-display` | 30 / 36 px | 500 | Notebook-Titel |
| `text-title` | 22 / 30 px | 500 | Panel-Überschriften |
| `text-heading` | 17 / 24 px | 700 | Quellenname, Abschnitt |
| `text-body` | 15 / 24 px | 400 | Oberflächentext |
| `text-reading` | 16 / 28 px | 400 | Antworten, Quellentext |
| `text-label` | 13 / 18 px | 700 | Feldbeschriftung, Tab |
| `text-meta` | 12 / 16 px | 400 | Zeit, Trefferzahl, Offsets |
| `text-micro` | 11 / 14 px | 700, Großbuchstaben | Statuskürzel |

**Ausschließlich linksbündiger Flattersatz** — eine Regel des Freiburger CD, für alle
Designs übernommen. Kein Blocksatz, keine zentrierte oder rechtsbündige Textausrichtung.
Umgesetzt als Grundregel für `body, p, h1–h4, li, td, th, label`.

Zeilenlänge: Lesetext maximal 68 Zeichen. Silbentrennung für Deutsch aktiviert
(`hyphens-auto`, `lang="de"`) — deutsche Komposita erzeugen sonst Löcher im Flattersatz.

---

## 3. Abstand

Basis 4 px. Nur diese Stufen sind zulässig:

`space-0` 0 · `space-1` 4 · `space-2` 8 · `space-3` 12 · `space-4` 16 · `space-5` 24 ·
`space-6` 32 · `space-7` 48 · `space-8` 64

| Fall | Stufe |
|---|---|
| Symbol zu Beschriftung | `space-2` |
| Innenabstand kompakter Steuerelemente | `space-2` / `space-3` |
| Innenabstand Karte | `space-4` |
| Zwischen Karten einer Liste | `space-2` |
| Zwischen Abschnitten eines Panels | `space-5` |
| Panel-Innenabstand | `space-4` (mobil `space-3`) |
| Zwischen Chatnachrichten | `space-5` |

---

## 4. Radien

Teil des Designs (Tokens `radius-xs` … `radius-lg`):

| Design | xs · Marker | sm · Buttons, Eingaben | md · Karten | lg · Dialoge |
|---|---|---|---|---|
| eigen | 3 px | 5 px | 8 px | 12 px |
| uni-freiburg | 2 px | 3 px | 4 px | 6 px — das CD arbeitet mit klaren, eckigen Flächen |
| huskynarr | 4 px | 6 px | 10 px | 14 px |

`radius-full` (9999 px) für Rundsymbole und Zähler in allen Designs.

---

## 5. Schatten

Sparsam. Erhebung entsteht zuerst durch Flächenwechsel, Schatten nur bei echtem Schweben.
Designübergreifend neutral:

| Token | Wert | Verwendung |
|---|---|---|
| `shadow-none` | keiner | Karten in Ruhe |
| `shadow-sm` | `0 1px 2px rgb(0 0 0 / .07)` | Karte bei Zeigerkontakt |
| `shadow-md` | `0 4px 12px rgb(0 0 0 / .12)` | Popover, Menü |
| `shadow-lg` | `0 16px 40px rgb(0 0 0 / .2)` | Dialog |

---

## 6. Inhaltsbereiche

| Token | Wert | Bedeutung |
|---|---|---|
| `layout-sources` | 300 px, veränderbar 240–420 px | linke Spalte: Quellen |
| `layout-chat` | flexibel, min. 420 px | mittlere Spalte: Dialog |
| `layout-notes` | 340 px, veränderbar 280–480 px | rechte Spalte: Notizen und Quelle |
| `layout-reading` | 68 ch | maximale Breite von Lesetext |
| `layout-topbar` | 52 px (umbricht unter 1280 px) | Kopfleiste |
| `layout-composer` | min. 76 px | Eingabebereich unten |

Umbruchpunkte:

- **≥ 1280 px:** drei Spalten nebeneinander.
- **< 1280 px:** eine Spalte, Wechsel über Tabs `Quellen · Chat · Notizen`; die Kopfleiste
  bricht um. Ein Klick auf einen Zitatmarker wechselt dabei automatisch auf die
  Quellenansicht.

Scrollen: jede Spalte scrollt eigenständig; die Seite selbst scrollt nie, auch nicht
waagerecht (E2E-Test bei 390 px).

---

## 7. Bewegung

| Token | Dauer | Kurve | Verwendung |
|---|---|---|---|
| `motion-instant` | 80 ms | `linear` | Farbwechsel bei Zeigerkontakt |
| `motion-fast` | 140 ms | `cubic-bezier(.2,0,.2,1)` | Tab-Wechsel, Aufklappen |
| `motion-base` | 200 ms | `cubic-bezier(.2,0,0,1)` | Dialog, Schublade |
| `motion-slow` | 420 ms | `cubic-bezier(.4,0,.2,1)` | Belegmarkierung nach dem Sprung |

`motion-slow` hat genau eine Aufgabe: nach dem Sprung zur Quellenstelle blitzt die
Hervorhebung einmal in `accent` auf, damit das Auge sie findet. Sonst nichts.

Bei `prefers-reduced-motion: reduce` entfallen alle Bewegungen; Zustandswechsel bleiben,
Dauer 0. Die Belegmarkierung erscheint dann ohne Aufblitzen, aber sichtbar.

---

## 8. Komponenten

Für jede Komponente gelten durchgehend diese Zustände, auch wo unten nicht wiederholt:
**Ruhe · Zeigerkontakt · Tastaturfokus · gedrückt · aktiv/ausgewählt · deaktiviert · Ladezustand · Fehler.**

Deaktiviert heißt immer: `content-subtle`, keine Schatten, `cursor-not-allowed`,
`aria-disabled`, und ein Titel, der den Grund nennt.

### 8.1 Button

Varianten: `primary`, `secondary`, `ghost`, `danger`. Größen: `sm` (28 px), `md` (36 px,
Standard), `lg` (44 px).

| Zustand | primary | secondary | ghost | danger |
|---|---|---|---|---|
| Ruhe | `action`, Text `action-contrast` | `surface-raised`, Rand `border`, Text `content` | transparent, Text `content-muted` | `danger`, Text `content-inverted` |
| Zeigerkontakt | `action-hover` | Rand `border-strong` | Fläche `surface-sunken` | 10 % heller |
| Fokus | Ring `focus-ring` | Ring `focus-ring` | Ring `focus-ring` | Ring `danger` |
| Gedrückt | 96 % Skalierung, entfällt bei reduzierter Bewegung | ebenso | ebenso | ebenso |
| Deaktiviert | `surface-inset`, Text `content-subtle` | ebenso | ebenso | ebenso |
| Ladezustand | Spinner ersetzt das Symbol, **Beschriftung bleibt stehen**, `aria-busy` | ebenso | ebenso | ebenso |

Regeln: höchstens ein `primary` pro sichtbarem Bereich. Ein Button, der etwas löscht, ist
`danger` und fragt nach. **Kein Button trägt `accent`** — Grün gehört dem Beleg.

### 8.2 Eingabe

Aufbau: Beschriftung (`text-label`, `content`) · Feld · Hilfetext oder Fehlertext
(`text-meta`). Die Beschriftung ist immer vorhanden; ist sie visuell unnötig, bleibt sie für
Hilfstechnik erhalten.

| Zustand | Darstellung |
|---|---|
| Ruhe | `surface-raised`, Rand `border`, `radius-sm`, Innenabstand `space-3`, `text-body` |
| Platzhalter | `content-subtle` — nie als Ersatz für die Beschriftung |
| Zeigerkontakt | Rand `border-strong` |
| Fokus | Rand `action`, Ring `focus-ring` |
| Fehler | Rand `danger`, Fehlertext `danger` mit Symbol, `aria-invalid`, `aria-describedby` |
| Deaktiviert | `surface-inset`, Text `content-subtle` |
| Schreibgeschützt | `surface-inset`, Text `content`, kein Rand-Hover |

Der Frageeingabebereich wächst bis 8 Zeilen, danach scrollt er. `Enter` sendet,
`Umschalt+Enter` erzeugt einen Zeilenumbruch; der Hinweis steht als `text-meta` darunter.

### 8.3 Dialog

Fläche `surface-overlay`, `radius-lg`, `shadow-lg`, Breite 480 px (Standard) bzw. 720 px
(breit), maximale Höhe 85 vh mit scrollendem Rumpf. Hintergrund abgedunkelt
(`rgb(0 0 74 / .5)` hell, `rgb(0 0 0 / .65)` dunkel).

Aufbau: Titel (`text-title`) · optionaler Beschreibungstext (`content-muted`) · Rumpf ·
Fußzeile mit Aktionen rechtsbündig, abbrechende Aktion links davon.

Verhalten: Fokus wird beim Öffnen auf das erste Bedienelement gesetzt und im Dialog
gefangen; beim Schließen kehrt er zum auslösenden Element zurück. `Esc` schließt, außer es
gibt ungespeicherte Eingaben. Klick auf den Hintergrund schließt nur Dialoge ohne Eingabe.
`role="dialog"`, `aria-modal`, `aria-labelledby`.

Löschdialoge: der bestätigende Button ist `danger` und benennt die Handlung
("Notebook löschen"), nicht "OK".

### 8.4 Quellenkarte

Zwei unabhängige Zustände, die nicht verwechselt werden dürfen: **ausgewählt** (zählt für
die nächste Frage) und **geöffnet** (wird rechts angezeigt).

Aufbau: Auswahlkästchen · Name (`text-heading`, zwei Zeilen, dann gekürzt) · Metazeile
(`text-meta`: Typ · Wortzahl · Anzahl Abschnitte) · Statusanzeige · Menü.

| Zustand | Darstellung |
|---|---|
| Ruhe | `surface-raised`, Rand `border-subtle`, `radius-md`, Innenabstand `space-4` |
| Zeigerkontakt | Rand `border`, `shadow-sm`, Menü wird sichtbar |
| Fokus | Ring `focus-ring` um die gesamte Karte |
| Ausgewählt | Kästchen gesetzt — **keine Plakette**: das ist der Normalfall |
| Abgewählt | Deckkraft 0,6, Name `content-muted`, Plakette „Abgewählt" (neutral) |
| Geöffnet | 3 px Balken links in `accent`, Fläche `accent-surface` mit 40 % Deckkraft |
| Wird geladen | Kästchen und Aktionen sind nicht vorhanden, bis der Abruf steht |
| Fehler | Rand `danger`, Grund im Klartext, „Erneut versuchen" |
| Trefferanzeige | wurde die Karte für die letzte Antwort herangezogen: Plakette `accent-surface-strong` mit Trefferzahl |

### 8.5 Chatnachricht

Zwei Rollen, deutlich unterschieden.

**Frage:** rechts positionierter Block, maximale Breite 80 %, `surface-raised`, Rand
`border-subtle`, `radius-md`, `text-body`. Der **Text darin ist linksbündig** (CD-Regel);
rechts steht der Block, nicht der Satz.

**Antwort:** volle Spaltenbreite bis `layout-reading`, keine Blase, kein Rand,
`font-reading`, `text-reading`, `content-strong`. Links ein 2 px breiter Balken in
`border-subtle`, der auf `accent` wechselt, sobald die Antwort mindestens einen gültigen
Beleg trägt.

| Zustand | Darstellung |
|---|---|
| Abruf läuft | Zeile `text-meta`: „Durchsuche 7 Quellen" mit Pulsieren |
| Fertig, belegt | Fußzeile mit Belegliste und den Aktionen „Als Notiz speichern", „Kopieren" |
| Fertig, unbelegt | Hinweisfläche `warning`: „Die ausgewählten Quellen decken diese Frage nicht ab." Keine erfundene Antwort |
| Teilweise belegt | Sätze ohne Beleg tragen eine gepunktete Unterlinie in `warning`, Fußzeile nennt die Zahl |
| Simulation aktiv | Hinweisfläche `warning`: „Simulierte Antwort — kein Modell verbunden", dauerhaft, nicht schließbar |
| Fehler | Hinweisfläche `danger`, Klartextgrund, „Erneut versuchen" |

### 8.6 Quellenverweis

Die wichtigste Komponente. Drei Erscheinungsformen.

**Marker im Fließtext.** Hochgestellte Zahl in eckigen Klammern, `font-mono`, `text-micro`,
`radius-xs`. Ein echtes `<button>` — anklickbar, mit Tabulator erreichbar,
`aria-label="Beleg 3: pruefungsordnung.md, Abschnitt 3.2"`.

| Zustand | Darstellung |
|---|---|
| Ruhe | Fläche `accent-surface`, Text `content-strong` |
| Zeigerkontakt | Fläche `accent-surface-strong`, Unterstreichung; nach 400 ms erscheint das Vorschau-Popover |
| Fokus | Ring in `accent` |
| Aktiv | Fläche `accent`, Text `accent-contrast` — solange die Stelle rechts hervorgehoben ist |
| Mehrfachbeleg | `[2,5]` in einem Marker, öffnet eine Liste statt direkt zu springen |

Die Textfarbe steht **ausschließlich** in den beiden Zweigen, nie zusätzlich im gemeinsamen
Teil: zwei gleichrangige Utilities konkurrieren, und welche gewinnt, entscheidet die
Reihenfolge im erzeugten CSS. Genau so fiel der Marker im dunklen Thema einmal auf 2,65:1.

**Vorschau-Popover.** `surface-overlay`, `radius-lg`, `shadow-md`, Breite 380 px. Enthält
Quellenname, Abschnittspfad, den Ausschnitt in `font-reading` mit der belegenden Stelle in
`accent-surface`, und die Offsets in `font-mono text-meta` (`Zeichen 1204–1268`). Erscheint
nach 400 ms Verweilen, verschwindet nach 150 ms — sofort bei `Esc`. Bei Tastaturbedienung
erscheint es beim Fokus ohne Verzögerung.

**Hervorhebung in der Quellenansicht.** Der Klick öffnet die Quelle rechts, scrollt die
Stelle in das mittlere Drittel und legt `accent-surface` mit 2 px Unterlinie in
`accent-border` darüber. Die Hervorhebung blitzt einmal auf (`motion-slow`) und bleibt, bis
ein anderer Beleg gewählt wird. Darüber eine Leiste „Beleg 3 von 5" mit Pfeilen.

Nicht verhandelbar: Ein Marker wird nur dargestellt, wenn der Server ihn gegen einen real
abgerufenen Abschnitt auflösen konnte. Ein Marker, der ins Leere zeigt, ist ein Fehler,
kein Gestaltungsfall.

### 8.7 Tabs

Verwendung: rechte Spalte (`Notizen · Quelle`) und die schmale Hauptnavigation.

Beschriftung `text-label`, Innenabstand `space-3` waagerecht, `space-2` senkrecht,
`radius-sm` oben, darunter eine 1-px-Linie in `border-subtle`.

| Zustand | Darstellung |
|---|---|
| Ruhe | Text `content-muted` |
| Zeigerkontakt | Text `content`, Fläche `surface-sunken` |
| Fokus | Ring `focus-ring` innerhalb des Tabs |
| Ausgewählt | Text `content-strong`, 2 px Unterstreichung in `action`, Fläche `action-surface` |
| Deaktiviert | `content-subtle`, nicht fokussierbar |
| Mit Zähler | Zahl als Plakette, `surface-inset`; im ausgewählten Tab `surface-raised` |

Tastatur: Pfeiltasten wechseln, `Pos1`/`Ende` springen an den Rand, `Tab` verlässt die
Leiste. `role="tablist"`, Inhalt mit `role="tabpanel"` und `aria-labelledby`. Die
Unterstreichung wandert in `motion-fast`; bei reduzierter Bewegung springt sie.

### 8.8 Statusanzeigen

Vier Formen, getrennt nach Reichweite. Alle tragen Fläche + Symbol + Text; die Statusfarbe
liegt nie auf der Schrift.

**Plakette** — Zustand eines Objekts. Höhe 20 px, `radius-xs`, `text-micro`, Statusfläche,
Text `content-strong`, Symbol links. Werte: `Abgewählt` (neutral), `Wird verarbeitet`
(info, mit Spinner), `Fehler` (danger). „Bereit" gibt es nicht — der Normalfall braucht
keine Plakette.

**Inline-Hinweis** — Zustand eines Bereichs. Volle Breite, `radius-md`, Innenabstand
`space-3`, Statusfläche, 3 px Balken links in der Statusfarbe, Symbol, Text, optional eine
Aktion rechts.

**Kurzmeldung** — Ergebnis einer Handlung. Unten rechts, Statusfläche, `shadow-md`,
`radius-md`, verschwindet nach 5 s (Fehler bleiben), höchstens drei gleichzeitig,
`aria-live="polite"` (Fehler `assertive`). Sie ersetzt nie eine Fehlermeldung am Ort des
Fehlers.

**Fortschritt** — laufende Arbeit mit bekanntem Ende: 3 px Balken in `action` auf
`surface-inset`. Ohne bekanntes Ende: wandernder Verlauf. Über 400 ms zusätzlich ein Text,
der sagt, worauf gewartet wird.

**Leere Zustände** gelten als Statusanzeige: sie nennen immer den nächsten Schritt.
„Noch keine Quelle. Text einfügen oder Datei wählen." — nie nur „Keine Daten".

---

## 9. Zugänglichkeit

Prüfliste vor jeder Abnahme:

- [x] Kontrast Text in allen sechs Kombinationen gemessen (Abschnitt 1), niedrigster Wert 5,47:1
- [ ] Kontrast Ränder und Fokusringe gegen ihre Umgebung (3:1) — **offen**
- [x] Kein waagerechtes Scrollen bei 390 px (E2E-Test)
- [ ] Bedienbar bei 200 % Zoom — **offen**
- [ ] Jede Funktion ohne Zeigergerät bedienbar, Reihenfolge entspricht dem Layout — **offen**
- [x] Zitatmarker als `button` mit aussagekräftigem `aria-label`
- [x] Einströmende Antworten in einer `aria-live="polite"`-Region
- [ ] Ein Sprung zur Quellenstelle wird für Hilfstechnik angesagt — **offen**
- [x] `prefers-reduced-motion` respektiert
- [x] Keine Information allein durch Farbe

---

## 10. Design `uni-freiburg`: Abweichungen vom Corporate Design

Vollständige Liste. Jede dieser Stellen ist bewusst gewählt und sollte bei einer förmlichen
Abnahme mit **cd@zv.uni-freiburg.de** abgestimmt werden.

| # | Abweichung | Begründung |
|---|---|---|
| A1 | **Zusatzfarbe Grün als tragendes Element.** Das CD nennt die Zusatzfarben „für den primären Einsatz in der externen Kommunikation" (Plakate, Magazine). | Der Produktkern ist die Prüfbarkeit einer Aussage. Ohne eine eigene, ausschließlich dafür reservierte Farbe verschwindet der Beleg im dichten Layout. Ein internes Werkzeug ist keine externe Kommunikation — die Zuordnung ist eine Auslegung, keine Deckung. |
| A2 | **Dunkles Thema.** Das CD kennt keines. | Aus CD-Farben abgeleitet (Dunkelblau als Grundfläche, aufgehellte Blau- und Grüntöne). Die Anwendung wird abends und in langen Sitzungen benutzt. |
| A10 | **Das CD ist eines von drei wählbaren Designs.** | Das CD ist für den Auftritt der Universität verbindlich, nicht für ein internes Werkzeug im Test. Wer die Anwendung an der Universität betreibt, sollte `uni-freiburg` als Vorgabe setzen (`VORGABE` in `lib/appearance.ts`). |
| A3 | **Rot für Fehler** (`#a4232b`, `#f7e6e7`). Keine CD-Farbe. | Das CD stellt keine Fehlerfarbe bereit. Blau oder Braun für einen Fehlerzustand wäre irreführend. |
| A4 | **Grautöne für Metatext** (`#5c5c5c`, `#6e6e6e`). | Das CD kennt für Text nur Schwarz. Metadaten in reinem Schwarz konkurrieren mit dem Inhalt. Die Töne sind neutral gehalten und gemessen. |
| A5 | **Dunkle Flächenwerte** (`#000033`, `#131a5c`, `#1a2270`, `#0a3a33`, `#0f5449`). | Zwischenstufen für das dunkle Thema, abgeleitet aus Dunkelblau und Grün. Folgt aus A2. |
| A6 | **Kein Universitätslogo.** | Das Logo unterliegt einer eigenen Policy (Schutzzone, zulässige Varianten). Es gehört in dieses Repository nur, wenn die Verwendung für ein internes Werkzeug ausdrücklich freigegeben ist. Bis dahin trägt die Anwendung nur den Wortlaut „Notebook". |
| A7 | **Rechts positionierter Frageblock.** Das CD verbietet rechtsbündigen Satz. | Der Text im Block ist linksbündig; rechts steht der Block, nicht der Satz. Die Unterscheidung Frage/Antwort geht sonst verloren. |
| A8 | **Zentrierte Beschriftung auf Schaltflächen.** | Die CD-Regel zum Flattersatz zielt auf Fließtext. Linksbündige Button-Beschriftungen wären in keiner Oberfläche üblich. |
| A9 | **Dicktengleiche Schrift** (Systemstack) für Zeichenpositionen und IDs. | Das CD kennt keine. Offsets wie `Zeichen 1204–1268` sind in einer Proportionalschrift schwer zu vergleichen. |


---

## 11. Design `huskynarr`: eine Näherung, keine Nachbildung

**Belegt ist genau ein Wert:** die Theme-Farbe `#0c0a09` aus dem `<meta name="theme-color">`
von <https://huskynarr.de>, abgerufen am 2026-09-18. Die Stylesheets der Seite ließen sich
mit den verfügbaren Werkzeugen nicht auslesen; Schriften, Akzentfarben und Abstände der
Vorlage sind **nicht bekannt**.

Alles Übrige ist Ableitung: `#0c0a09` entspricht exakt `stone-950` aus Tailwind, deshalb
baut das Design auf der Stone-Skala auf (warme Neutraltöne) und wählt für Belege Teal
(`#2dd4bf` dunkel, `#0f766e` hell) — als Kontrast zu den Neutraltönen, nicht weil die
Vorlage das so hätte. Das helle Erscheinungsbild ist eine Ableitung der Ableitung; die
Vorlage ist dunkel.

Der Hinweis in den Einstellungen sagt das („Angenähert an huskynarr.de — belegt ist nur die
Grundfarbe #0c0a09"). Wer die tatsächlichen Werte kennt, trägt sie in
`tools/build-theme.py` ein und erzeugt das Theme neu; dieser Abschnitt ist dann zu
aktualisieren.
