# Design-System

Umsetzung des **Corporate Design der Universität Freiburg**
(<https://cd.uni-freiburg.de>, verbindlich seit 1. März 2023).

Verbindliche Spezifikation. Das Tailwind-Theme in `apps/web/src/styles/theme.css` (Tailwind 4
setzt Tokens per `@theme` in CSS, nicht in einer Konfigurationsdatei) ist die technische
Umsetzung dieses Dokuments; weicht es ab, ist das Theme falsch, nicht das Dokument.

Keine Komponente verwendet rohe Werte. In JSX steht `bg-surface-raised`, nie `bg-[#faf8f1]`.

**Abschnitt 10 listet jede Stelle, an der dieses Dokument über das CD hinausgeht oder von
ihm abweicht.** Wer das CD prüft, muss nur dort nachsehen.

---

## 0. Gestaltungshaltung

Drei Festlegungen, aus denen sich alles Weitere ergibt:

1. **Das CD gibt die Farben, nicht die Bedeutung.** Das CD legt Blau, Sand, Schwarz und die
   Zusatzfarben fest, sagt aber nichts darüber, was in einer Anwendung welche Rolle spielt.
   Diese Zuordnung trifft dieses Dokument — und hält sie durch.
2. **Grün gehört dem Beleg.** CD-Grün markiert ausschließlich Belegmechanik: Zitatmarker,
   hervorgehobene Quellenstellen, die Verbindung zwischen Aussage und Original. Kein Button,
   keine Erfolgsmeldung, keine Plakette trägt Grün. Deshalb fällt ein Zitat im dichten
   Dreispaltenlayout sofort auf, ohne zusätzliche Hervorhebung — und deshalb ist diese
   Reservierung nicht verhandelbar.
3. **Dichte ohne Enge.** Drei Spalten mit viel Information. Ordnung entsteht durch
   Flächenwechsel und Abstand, nicht durch Rahmen und Linien. Trennlinien nur dort, wo zwei
   Flächen gleicher Höhe aneinanderstoßen.

---

## 1. Farbe

Semantische Namen, keine Farbnamen. Jeder Token existiert in beiden Themes; Komponenten
kennen nur den semantischen Namen. Umschaltung über `data-theme` bzw.
`prefers-color-scheme`.

Die CD-Bezeichnung steht in Klammern. Werte ohne CD-Bezeichnung sind abgeleitet und in
Abschnitt 10 begründet.

### Flächen

| Token | Bedeutung | Hell | Dunkel |
|---|---|---|---|
| `surface-sunken` | Anwendungshintergrund | `#f6f1e3` (Sand 100 %) | `#000033` |
| `surface` | Panels und Spalten | `#faf8f1` (Sand 50 %) | `#00004a` (Dunkelblau) |
| `surface-raised` | Karten, Eingaben, Blasen | `#ffffff` (Weiß) | `#131a5c` |
| `surface-overlay` | Dialoge, Popover, Menüs | `#ffffff` (Weiß) | `#1a2270` |
| `surface-inset` | Vertiefungen, neutrale Plaketten | `#f6f1e3` (Sand 100 %) | `#000033` |

### Text

| Token | Verwendung | Hell | Dunkel |
|---|---|---|---|
| `content-strong` | Überschriften, Antworttext | `#000000` (Schwarz) | `#ffffff` (Weiß) |
| `content` | Fließtext | `#000000` (Schwarz) | `#e9eaf6` |
| `content-muted` | Metadaten, Hilfetext | `#5c5c5c` | `#b6b9dd` |
| `content-subtle` | Platzhalter, Deaktiviertes | `#6e6e6e` | `#8b8fc4` |
| `content-inverted` | Text auf dunklen Füllungen | `#ffffff` | `#000000` |

Hierarchie entsteht über Größe und Gewicht, nicht über Grauabstufungen: das CD kennt für
Text nur Schwarz.

### Ränder

| Token | Verwendung | Hell | Dunkel |
|---|---|---|---|
| `border-subtle` | Flächentrennung | `#d7d8ec` (Blau 20 %) | `#1c2470` |
| `border` | Eingaben, Karten in Ruhe | `#afb1d8` (Blau 40 %) | `#2e3792` |
| `border-strong` | Zeigerkontakt | `#868dc2` (Blau 60 %) | `#5d6bad` (Blau 80 %) |

### Beleg — reserviert

**`accent` ist eine Flächenfarbe, keine Textfarbe.** CD-Grün hält als Schrift auf hellem
Grund nur rund 3,3:1 und wäre damit nicht barrierearm. Text auf `accent` ist immer
`accent-contrast`.

| Token | Verwendung | Hell | Dunkel |
|---|---|---|---|
| `accent` | aktiver Marker, Beleglinie | `#00a082` (Grün 100 %) | `#27b29b` (Grün 80 %) |
| `accent-hover` | Zeigerkontakt | `#27b29b` (Grün 80 %) | `#7bc6b4` (Grün 60 %) |
| `accent-surface` | Marker in Ruhe, Fundstelle | `#daede7` (Grün 20 %) | `#0a3a33` |
| `accent-surface-strong` | Zeigerkontakt, Trefferplakette | `#afdace` (Grün 40 %) | `#0f5449` |
| `accent-border` | Unterlinie der Fundstelle | `#00a082` | `#27b29b` |
| `accent-contrast` | Text auf `accent` | `#000000` | `#000000` |

### Aktion — alles Übrige

| Token | Verwendung | Hell | Dunkel |
|---|---|---|---|
| `action` | primäre Schaltflächen, Fokus | `#344a9a` (Blau 100 %) | `#afb1d8` (Blau 40 %) |
| `action-hover` | Zeigerkontakt | `#00004a` (Dunkelblau) | `#d7d8ec` (Blau 20 %) |
| `action-surface` | ausgewählter Tab | `#d7d8ec` (Blau 20 %) | `#2e3792` |
| `action-contrast` | Text auf `action` | `#ffffff` | `#00004a` |

### Status

Vier Töne, **kein Grün** — eine Bestätigung ist blau, damit ein Zitat die einzige grüne
Stelle im Bild bleibt.

| Token | Bedeutung | Hell | Dunkel |
|---|---|---|---|
| `info` / `info-surface` | Hinweis, Bestätigung | `#344a9a` / `#d7d8ec` (Blau 100/20 %) | `#afb1d8` / `#1c2470` |
| `warning` / `warning-surface` / `warning-mark` | Simulation, fehlende Deckung | `#8f6b30` (Braun) / `#fffae0` (Gelb 20 %) / `#ffe863` (Gelb 100 %) | `#ffe863` / `#3a3410` / `#ffe863` |
| `danger` / `danger-surface` | Fehler, Löschen | `#a4232b` / `#f7e6e7` | `#f08d8f` / `#3a1d1e` |

Statustext ist **immer** `content-strong`, nie die Statusfarbe: CD-Gelb trägt als Schrift
keinen ausreichenden Kontrast. Die Farbe liegt auf Fläche, Balken und Symbol — und nie
allein: jede Statusanzeige trägt zusätzlich ein Symbol und Text.

### Fokus

| Token | Wert |
|---|---|
| `focus-ring` | `#344a9a` (hell) / `#d7d8ec` (dunkel); auf Belegelementen `accent` |
| Darstellung | 2 px Ring, 2 px Abstand, immer sichtbar — nie `outline: none` ohne Ersatz |

### Gemessene Kontraste

Am 2026-09-18 an der gebauten Oberfläche gemessen (berechnete Werte aus den tatsächlich
angewendeten Stilen, Chromium, beide Themes):

| Element | Hell | Dunkel |
|---|---|---|
| Überschrift auf Anwendungshintergrund | 19,76:1 | 19,11:1 |
| Metatext | 21,00:1 | 13,21:1 |
| Zitatmarker in Ruhe | 17,25:1 | 12,61:1 |
| Zitatmarker aktiv (Schwarz auf Grün) | 6,35:1 | 7,93:1 |
| Hervorgehobene Fundstelle | 17,25:1 | 12,61:1 |
| Primäre Schaltfläche | 8,10:1 | 9,19:1 |
| Hinweisfläche | 20,00:1 | 10,46:1 |

Niedrigster gemessener Wert: **6,35:1**, deutlich über der AA-Schwelle von 4,5:1.
**Nicht gemessen** wurden `content-subtle` (per Definition nur für nicht-inhaltlichen Text)
sowie Ränder und Fokusringe gegen ihre Umgebung — diese stehen weiter auf der Prüfliste in
Abschnitt 9.

---

## 2. Typografie

Das CD nennt zwei Schriften: die Hausschrift **Social** und, für den Alltag, **Arial**.

| Rolle | Familie | Bemerkung |
|---|---|---|
| `font-ui` | `Social`, Arial, Helvetica | Oberfläche und Fließtext |
| `font-display` | `Social Extended`, `Social`, Arial | Überschriften (CD: Extended Medium für Headlines) |
| `font-reading` | `Social`, Arial | Quellentext und Antworten — dieselbe Familie, größere Zeilenhöhe |
| `font-mono` | Systemstack | nur für Zeichenpositionen und IDs |

**Social ist lizenzpflichtig und liegt nicht im Repository.** Die Lizenz wird bei Marketing
und Events angefragt (cd@zv.uni-freiburg.de). Fehlen die Dateien, fällt die Anwendung auf
Arial zurück — die vom CD selbst vorgesehene Zweitschrift. Wohin die Dateien gehören, steht
in `apps/web/public/fonts/README.md`.

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

**CD-Layoutregel: ausschließlich linksbündiger Flattersatz.** Kein Blocksatz, keine
zentrierte oder rechtsbündige Textausrichtung. Umgesetzt als Grundregel für
`body, p, h1–h4, li, td, th, label`.

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

Das CD arbeitet mit klaren, eckigen Flächen. Die Radien sind entsprechend knapp.

| Token | Wert | Verwendung |
|---|---|---|
| `radius-xs` | 2 px | Zitatmarker, Statuskürzel |
| `radius-sm` | 3 px | Buttons, Eingaben, Tabs |
| `radius-md` | 4 px | Karten, Chat-Blasen |
| `radius-lg` | 6 px | Dialoge, Popover |
| `radius-full` | 9999 px | Rundsymbole, Zähler |

---

## 5. Schatten

Sparsam. Erhebung entsteht zuerst durch Flächenwechsel. Der Schattenton ist Dunkelblau,
nicht Neutralgrau — auf Sand wirkt ein grauer Schatten schmutzig.

| Token | Wert (hell) | Verwendung |
|---|---|---|
| `shadow-none` | keiner | Karten in Ruhe |
| `shadow-sm` | `0 1px 2px rgb(0 0 74 / .08)` | Karte bei Zeigerkontakt |
| `shadow-md` | `0 4px 12px rgb(0 0 74 / .14)` | Popover, Menü |
| `shadow-lg` | `0 16px 40px rgb(0 0 74 / .22)` | Dialog |

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

- [x] Kontrast Text gemessen (Abschnitt 1), niedrigster Wert 6,35:1
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

## 10. Abweichungen vom Corporate Design

Vollständige Liste. Jede dieser Stellen ist bewusst gewählt und sollte bei einer förmlichen
Abnahme mit **cd@zv.uni-freiburg.de** abgestimmt werden.

| # | Abweichung | Begründung |
|---|---|---|
| A1 | **Zusatzfarbe Grün als tragendes Element.** Das CD nennt die Zusatzfarben „für den primären Einsatz in der externen Kommunikation" (Plakate, Magazine). | Der Produktkern ist die Prüfbarkeit einer Aussage. Ohne eine eigene, ausschließlich dafür reservierte Farbe verschwindet der Beleg im dichten Layout. Ein internes Werkzeug ist keine externe Kommunikation — die Zuordnung ist eine Auslegung, keine Deckung. |
| A2 | **Dunkles Thema.** Das CD kennt keines. | Aus CD-Farben abgeleitet (Dunkelblau als Grundfläche, aufgehellte Blau- und Grüntöne). Die Anwendung wird abends und in langen Sitzungen benutzt. |
| A3 | **Rot für Fehler** (`#a4232b`, `#f7e6e7`). Keine CD-Farbe. | Das CD stellt keine Fehlerfarbe bereit. Blau oder Braun für einen Fehlerzustand wäre irreführend. |
| A4 | **Grautöne für Metatext** (`#5c5c5c`, `#6e6e6e`). | Das CD kennt für Text nur Schwarz. Metadaten in reinem Schwarz konkurrieren mit dem Inhalt. Die Töne sind neutral gehalten und gemessen. |
| A5 | **Dunkle Flächenwerte** (`#000033`, `#131a5c`, `#1a2270`, `#0a3a33`, `#0f5449`). | Zwischenstufen für das dunkle Thema, abgeleitet aus Dunkelblau und Grün. Folgt aus A2. |
| A6 | **Kein Universitätslogo.** | Das Logo unterliegt einer eigenen Policy (Schutzzone, zulässige Varianten). Es gehört in dieses Repository nur, wenn die Verwendung für ein internes Werkzeug ausdrücklich freigegeben ist. Bis dahin trägt die Anwendung nur den Wortlaut „Notebook". |
| A7 | **Rechts positionierter Frageblock.** Das CD verbietet rechtsbündigen Satz. | Der Text im Block ist linksbündig; rechts steht der Block, nicht der Satz. Die Unterscheidung Frage/Antwort geht sonst verloren. |
| A8 | **Zentrierte Beschriftung auf Schaltflächen.** | Die CD-Regel zum Flattersatz zielt auf Fließtext. Linksbündige Button-Beschriftungen wären in keiner Oberfläche üblich. |
| A9 | **Dicktengleiche Schrift** (Systemstack) für Zeichenpositionen und IDs. | Das CD kennt keine. Offsets wie `Zeichen 1204–1268` sind in einer Proportionalschrift schwer zu vergleichen. |
