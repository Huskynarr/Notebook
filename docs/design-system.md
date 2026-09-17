# Design-System

Verbindliche Spezifikation. Das Tailwind-Theme in `apps/web/src/styles/theme.css` (Tailwind 4
setzt Tokens per `@theme` in CSS, nicht mehr in einer Konfigurationsdatei) ist die technische
Umsetzung dieses Dokuments; weicht es ab, ist das Theme falsch, nicht das Dokument.

Keine Komponente verwendet rohe Werte. In JSX steht `bg-surface-raised`, nie `bg-[#faf8f4]`.

---

## 0. Gestaltungshaltung

Drei Festlegungen, aus denen sich alles Weitere ergibt:

1. **Papier und Tinte, nicht Chrom.** Warme, leicht entsättigte Flächen und sehr dunkler
   Text. Der Arbeitsbereich soll wie ein Schreibtisch mit Dokumenten wirken, nicht wie ein
   Dashboard. Lange Lesestrecken sind der Normalfall.
2. **Die Akzentfarbe gehört dem Beleg.** `accent` markiert ausschließlich Belegmechanik:
   Zitatmarker, hervorgehobene Quellenstellen, die Verbindung zwischen Aussage und Original.
   Ein Speichern-Button ist nicht wichtiger als ein Beleg und bekommt daher keine
   Akzentfarbe. Diese Reservierung ist der Grund, warum ein Zitat im Layout sofort
   auffällt — sie darf nicht aufgeweicht werden.
3. **Dichte ohne Enge.** Drei Spalten mit viel Information. Die Ordnung entsteht durch
   Flächenwechsel und Abstand, nicht durch Rahmen und Linien. Trennlinien nur dort, wo zwei
   Flächen gleicher Höhe aneinanderstoßen.

---

## 1. Farbe

Semantische Namen, keine Farbnamen. Jeder Token existiert in beiden Themes; Komponenten
kennen nur den semantischen Namen. Umschaltung über `data-theme` bzw.
`prefers-color-scheme`.

### Flächen

| Token | Bedeutung | Light | Dark |
|---|---|---|---|
| `surface-sunken` | Hintergrund der Anwendung, unterste Ebene | `#f2efe9` | `#15171a` |
| `surface` | Standardfläche für Panels und Spalten | `#faf8f4` | `#1c1f23` |
| `surface-raised` | Karten, Eingabefelder, Chat-Blasen | `#ffffff` | `#24282d` |
| `surface-overlay` | Dialoge, Popover, Menüs | `#ffffff` | `#2b3036` |
| `surface-inset` | Codeblöcke, Quellentext-Vorschau | `#efece5` | `#141619` |

### Text

| Token | Verwendung | Light | Dark | Kontrast auf `surface` |
|---|---|---|---|---|
| `content-strong` | Überschriften, Antworttext | `#14171a` | `#f4f2ee` | 15,8:1 / 14,1:1 |
| `content` | Fließtext | `#2c3238` | `#d6d3cd` | 10,6:1 / 9,8:1 |
| `content-muted` | Metadaten, Zeitangaben, Hilfetext | `#5b6470` | `#9aa1a9` | 5,4:1 / 5,1:1 |
| `content-subtle` | Platzhalter, deaktivierte Beschriftung | `#7d8794` | `#6f767e` | 3,4:1 — **nur für Nichttext-Text**, nie für Inhalt |
| `content-inverted` | Text auf gefüllten dunklen Flächen | `#faf8f4` | `#14171a` | — |

Die angegebenen Kontrastwerte sind gerechnet, nicht gemessen. Sie sind vor Abnahme mit
einem Prüfwerkzeug gegen die tatsächlich gebaute Oberfläche zu verifizieren; bis dahin gilt
die Zusage "AA" als unbestätigt.

### Ränder

| Token | Verwendung | Light | Dark |
|---|---|---|---|
| `border-subtle` | Flächentrennung, kaum sichtbar | `#e4e0d8` | `#2f343a` |
| `border` | Eingabefelder, Karten in Ruhe | `#d3cec4` | `#3b4148` |
| `border-strong` | Hover auf interaktiven Rändern | `#b0a99c` | `#545c65` |

### Akzent — reserviert für Belege

| Token | Verwendung | Light | Dark |
|---|---|---|---|
| `accent` | Zitatmarker, Beleglinien, Fokus auf Belegelementen | `#7a4a12` | `#e0a95f` |
| `accent-hover` | Zeigerkontakt auf Belegelementen | `#5e380b` | `#f0bd78` |
| `accent-surface` | Fläche hinter hervorgehobener Quellenstelle | `#fbeed7` | `#453318` |
| `accent-border` | Rand eines aktiven Belegs | `#d9a55c` | `#8a6526` |

### Aktion — alles Übrige

| Token | Verwendung | Light | Dark |
|---|---|---|---|
| `action` | Primäre Schaltflächen | `#25405e` | `#b9cde6` |
| `action-hover` | Zeigerkontakt | `#1a2f47` | `#cfdff2` |
| `action-surface` | Ausgewählter Tab, aktive Auswahl | `#e6ecf3` | `#2a3a4c` |

### Status

| Token | Bedeutung | Light | Dark |
|---|---|---|---|
| `success` / `success-surface` | Abgeschlossen, Quelle indiziert | `#1f6b3f` / `#e2f1e7` | `#7cc79a` / `#1b3326` |
| `warning` / `warning-surface` | Teilweise belegt, Simulation aktiv | `#8a5a00` / `#fbf0d8` | `#e8bc63` / `#3a2e14` |
| `danger` / `danger-surface` | Fehler, Löschen | `#9b2226` / `#fae6e6` | `#f08d8f` / `#3a1d1e` |
| `info` / `info-surface` | Hinweis, Ladezustand | `#1f5a73` / `#e2eff4` | `#7fc0da` / `#16303b` |

Statusfarbe steht nie allein: jede Statusanzeige trägt zusätzlich ein Symbol und Text.

### Fokus

| Token | Wert |
|---|---|
| `focus-ring` | `action` (Light) / `#9fc2ea` (Dark); auf Belegelementen stattdessen `accent` |
| Darstellung | 2 px Ring, 2 px Abstand zum Element, immer sichtbar — nie `outline: none` ohne Ersatz |

---

## 2. Typografie

| Rolle | Familie | Begründung |
|---|---|---|
| `font-ui` | `Inter`, System-Sans | Oberfläche, Beschriftungen |
| `font-reading` | `Source Serif 4`, Serif-Fallback | Quellentext und KI-Antworten — Serife trennt gelesenen Inhalt optisch von Bedienoberfläche |
| `font-mono` | `JetBrains Mono`, Monospace | Offsets, IDs, Codeblöcke |

Schriften werden lokal ausgeliefert, nicht von einem CDN geladen.

| Token | Größe / Zeilenhöhe | Gewicht | Laufweite | Verwendung |
|---|---|---|---|---|
| `text-display` | 30 / 36 px | 600 | −0,02 em | Notebook-Titel |
| `text-title` | 22 / 30 px | 600 | −0,01 em | Panel-Überschriften |
| `text-heading` | 17 / 24 px | 600 | 0 | Quellenname, Abschnitt |
| `text-body` | 15 / 24 px | 400 | 0 | Oberflächentext |
| `text-reading` | 16 / 28 px | 400 | 0 | Antworten, Quellentext (`font-reading`) |
| `text-label` | 13 / 18 px | 500 | 0,01 em | Feldbeschriftung, Tab |
| `text-meta` | 12 / 16 px | 400 | 0,01 em | Zeit, Trefferzahl, Offsets |
| `text-micro` | 11 / 14 px | 600 | 0,04 em, Großbuchstaben | Statuskürzel, Spaltenkopf |

Zeilenlänge: Lesetext maximal 72 Zeichen. Silbentrennung für Deutsch aktiviert
(`hyphens-auto`, `lang="de"`) — deutsche Komposita erzeugen sonst Löcher im Flattersatz.

---

## 3. Abstand

Basis 4 px. Nur diese Stufen sind zulässig:

`space-0` 0 · `space-1` 4 · `space-2` 8 · `space-3` 12 · `space-4` 16 · `space-5` 24 ·
`space-6` 32 · `space-7` 48 · `space-8` 64

Anwendung:

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

| Token | Wert | Verwendung |
|---|---|---|
| `radius-xs` | 3 px | Zitatmarker, Statuskürzel |
| `radius-sm` | 5 px | Buttons, Eingaben, Tabs |
| `radius-md` | 8 px | Karten, Chat-Blasen |
| `radius-lg` | 12 px | Dialoge, Popover |
| `radius-full` | 9999 px | Rundsymbole, Zähler |

---

## 5. Schatten

Sparsam. Erhebung entsteht zuerst durch Flächenwechsel, Schatten nur bei echtem Schweben.
Im dunklen Theme zusätzlich ein heller Innenrand, weil Schatten dort kaum trägt.

| Token | Wert (Light) | Verwendung |
|---|---|---|
| `shadow-none` | keiner | Karten in Ruhe |
| `shadow-sm` | `0 1px 2px rgb(20 23 26 / .06)` | Karte bei Zeigerkontakt |
| `shadow-md` | `0 4px 12px rgb(20 23 26 / .10)` | Popover, Menü |
| `shadow-lg` | `0 16px 40px rgb(20 23 26 / .18)` | Dialog |

---

## 6. Inhaltsbereiche

| Token | Wert | Bedeutung |
|---|---|---|
| `layout-sources` | 300 px, veränderbar 240–420 px | linke Spalte: Quellen |
| `layout-chat` | flexibel, min. 420 px | mittlere Spalte: Dialog |
| `layout-notes` | 340 px, veränderbar 280–480 px | rechte Spalte: Notizen und Quellenansicht |
| `layout-reading` | 68 ch | maximale Breite von Lesetext innerhalb der Spalte |
| `layout-topbar` | 52 px | Kopfleiste |
| `layout-composer` | min. 76 px | Eingabebereich unten in der Chat-Spalte |

Umbruchpunkte:

- **≥ 1280 px:** drei Spalten nebeneinander.
- **880–1279 px:** rechte Spalte wird zur Schublade über dem Inhalt.
- **< 880 px:** eine Spalte, Wechsel über Tabs `Quellen · Chat · Notizen`. Ein Klick auf
  einen Zitatmarker wechselt dabei automatisch auf die Quellenansicht.

Scrollen: jede Spalte scrollt eigenständig; die Seite selbst scrollt nie.

---

## 7. Bewegung

| Token | Dauer | Kurve | Verwendung |
|---|---|---|---|
| `motion-instant` | 80 ms | `linear` | Farbwechsel bei Zeigerkontakt |
| `motion-fast` | 140 ms | `cubic-bezier(.2,0,.2,1)` | Tab-Wechsel, Aufklappen |
| `motion-base` | 200 ms | `cubic-bezier(.2,0,0,1)` | Dialog, Schublade |
| `motion-slow` | 420 ms | `cubic-bezier(.4,0,.2,1)` | Belegmarkierung nach dem Sprung |

`motion-slow` hat genau eine Aufgabe: nach dem Sprung zur Quellenstelle blitzt die
Hervorhebung einmal auf, damit das Auge sie findet. Sonst nichts.

Bei `prefers-reduced-motion: reduce` entfallen alle Bewegungen; Zustandswechsel bleiben,
Dauer 0. Die Belegmarkierung erscheint dann ohne Aufblitzen, aber sichtbar.

---

## 8. Komponenten

Für jede Komponente gelten durchgehend diese Zustände, auch wo unten nicht wiederholt:
**Ruhe · Zeigerkontakt · Tastaturfokus · gedrückt · aktiv/ausgewählt · deaktiviert · Ladezustand · Fehler.**

Deaktiviert heißt immer: `content-subtle`, keine Schatten, `cursor-not-allowed`,
`aria-disabled`, und ein Titel, der den Grund nennt.

### 8.1 Button

Varianten: `primary`, `secondary`, `ghost`, `danger`.
Größen: `sm` (28 px), `md` (36 px, Standard), `lg` (44 px).

| Zustand | primary | secondary | ghost | danger |
|---|---|---|---|---|
| Ruhe | Fläche `action`, Text `content-inverted` | `surface-raised`, Rand `border`, Text `content` | transparent, Text `content-muted` | Fläche `danger`, Text `content-inverted` |
| Zeigerkontakt | `action-hover` | Rand `border-strong` | Fläche `surface-sunken`, Text `content` | Farbe 8 % dunkler |
| Fokus | Ring `focus-ring` | Ring `focus-ring` | Ring `focus-ring` | Ring `danger` |
| Gedrückt | 96 % Skalierung, keine Bewegung bei reduzierter Bewegung | ebenso | ebenso | ebenso |
| Deaktiviert | `surface-inset`, Text `content-subtle` | ebenso | ebenso | ebenso |
| Ladezustand | Spinner ersetzt das Symbol, **Beschriftung bleibt stehen** (keine Breitenänderung), `aria-busy` | ebenso | ebenso | ebenso |

Regeln: höchstens ein `primary` pro sichtbarem Bereich. Ein Button, der etwas löscht,
ist `danger` und fragt nach. Kein Button trägt `accent` — die gehört dem Beleg.

### 8.2 Eingabe (Textfeld, Textbereich, Suchfeld)

Aufbau: Beschriftung (`text-label`, `content`) · Feld · Hilfetext oder Fehlertext
(`text-meta`). Beschriftung ist immer vorhanden; ist sie visuell unnötig, bleibt sie für
Hilfstechnik erhalten.

| Zustand | Darstellung |
|---|---|
| Ruhe | `surface-raised`, Rand `border`, `radius-sm`, Innenabstand `space-3`, `text-body` |
| Platzhalter | `content-subtle` — nie als Ersatz für die Beschriftung |
| Zeigerkontakt | Rand `border-strong` |
| Fokus | Rand `action`, Ring `focus-ring` |
| Ausgefüllt | wie Ruhe |
| Fehler | Rand `danger`, Fehlertext `danger` mit Symbol, `aria-invalid`, `aria-describedby` |
| Deaktiviert | `surface-inset`, Text `content-subtle` |
| Schreibgeschützt | `surface-inset`, Text `content`, kein Rand-Hover |

Der Frageeingabebereich wächst mit dem Inhalt bis 8 Zeilen, danach scrollt er.
`Enter` sendet, `Umschalt+Enter` erzeugt einen Zeilenumbruch; dieser Hinweis steht als
`text-meta` unter dem Feld.

### 8.3 Dialog

Fläche `surface-overlay`, `radius-lg`, `shadow-lg`, Breite 480 px (Standard) bzw. 720 px
(breit), maximale Höhe 85 vh mit scrollendem Rumpf. Hintergrund abgedunkelt
(`rgb(20 23 26 / .45)`, Light) bzw. (`rgb(0 0 0 / .6)`, Dark).

Aufbau: Titel (`text-title`) · optionaler Beschreibungstext (`content-muted`) · Rumpf ·
Fußzeile mit Aktionen rechtsbündig, abbrechende Aktion links davon.

Verhalten: Fokus wird beim Öffnen auf das erste Bedienelement gesetzt und im Dialog
gefangen; beim Schließen kehrt er zum auslösenden Element zurück. `Esc` schließt, außer es
gibt ungespeicherte Eingaben — dann erscheint eine Rückfrage. Klick auf den Hintergrund
schließt nur Dialoge ohne Eingabe. Öffnen: 200 ms, Fläche von 98 % auf 100 % und
Deckkraft 0 auf 1. `role="dialog"`, `aria-modal`, `aria-labelledby`.

Löschdialoge: der bestätigende Button ist `danger` und benennt die Handlung
("Notebook löschen"), nicht "OK".

### 8.4 Quellenkarte

Die Karte in der linken Spalte. Sie trägt zwei unabhängige Zustände, die nicht verwechselt
werden dürfen: **ausgewählt** (zählt für die nächste Frage) und **geöffnet** (wird rechts
angezeigt).

Aufbau: Auswahlkästchen · Typsymbol · Name (`text-heading`, zwei Zeilen, dann gekürzt) ·
Metazeile (`text-meta`: Typ · Wortzahl · Anzahl Abschnitte) · Statusanzeige · Menü.

| Zustand | Darstellung |
|---|---|
| Ruhe | `surface-raised`, Rand `border-subtle`, `radius-md`, Innenabstand `space-4` |
| Zeigerkontakt | Rand `border`, `shadow-sm`, Menü wird sichtbar |
| Fokus | Ring `focus-ring` um die gesamte Karte |
| Ausgewählt | Kästchen gesetzt, Rand `border-strong`, Fläche unverändert |
| Abgewählt | Deckkraft 0,6, Name `content-muted` — sichtbar, dass sie nicht zählt |
| Geöffnet | 3 px Balken links in `accent`, Fläche `accent-surface` mit 40 % Deckkraft |
| Wird verarbeitet | Fortschrittsbalken unter der Metazeile, Aktionen gesperrt |
| Fehler | Rand `danger`, Fehlergrund im Klartext, Schaltfläche "Erneut versuchen" |
| Trefferanzeige | wurde die Karte für die letzte Antwort herangezogen: Plakette `accent-surface` mit Trefferzahl |

### 8.5 Chatnachricht

Zwei Rollen, deutlich unterschieden — Nutzerfrage und Antwort dürfen nie verwechselbar sein.

**Frage:** rechtsbündig, maximale Breite 80 %, `surface-raised`, Rand `border-subtle`,
`radius-md`, `font-ui`, `text-body`. Darunter `text-meta` mit der Zahl der berücksichtigten
Quellen.

**Antwort:** volle Spaltenbreite bis `layout-reading`, keine Blase, kein Rand, `font-reading`,
`text-reading`, `content-strong`. Links ein 2 px breiter Balken in `border-subtle`, der auf
`accent` wechselt, sobald die Antwort mindestens einen gültigen Beleg trägt.

| Zustand | Darstellung |
|---|---|
| Abruf läuft | Zeile `text-meta`: "Durchsuche 7 Quellen" mit Pulsieren |
| Antwort strömt ein | Text erscheint fortlaufend, Cursorbalken am Ende; Zitatmarker werden erst gesetzt, **nachdem** der Server sie validiert hat |
| Fertig, belegt | Fußzeile mit Belegliste und den Aktionen "Als Notiz speichern", "Kopieren" |
| Fertig, unbelegt | Hinweisfläche `warning-surface`: "Die ausgewählten Quellen decken diese Frage nicht ab." Keine erfundene Antwort |
| Teilweise belegt | Sätze ohne Beleg tragen eine gepunktete Unterlinie in `warning`, Fußzeile nennt die Zahl |
| Simulation aktiv | Plakette `warning` mit Text "Simulierte Antwort — kein Modell verbunden", dauerhaft sichtbar, nicht schließbar |
| Fehler | `danger-surface`, Klartextgrund, "Erneut versuchen" |

### 8.6 Quellenverweis

Die wichtigste Komponente. Drei Erscheinungsformen.

**Marker im Fließtext.** Hochgestellte Zahl in eckigen Klammern, `font-mono`,
`text-micro`, Farbe `accent`, Fläche `accent-surface`, `radius-xs`, 2 px Innenabstand
seitlich. Ein echtes `<button>` — anklickbar, mit Tabulator erreichbar,
`aria-label="Beleg 3: pruefungsordnung.md, Abschnitt 3.2"`.

| Zustand | Darstellung |
|---|---|
| Ruhe | `accent` auf `accent-surface` |
| Zeigerkontakt | `accent-hover`, Unterstreichung; nach 400 ms erscheint das Vorschau-Popover |
| Fokus | Ring in `accent` |
| Aktiv | Farben getauscht: Fläche `accent`, Text `content-inverted` — solange die zugehörige Stelle rechts hervorgehoben ist |
| Mehrfachbeleg | `[2,5]` in einem Marker, öffnet eine Liste statt direkt zu springen |

**Vorschau-Popover.** `surface-overlay`, `radius-lg`, `shadow-md`, Breite 380 px. Enthält
Quellenname, Abschnittspfad, den Textausschnitt in `font-reading` mit der belegenden Stelle
in `accent-surface`, und die Offsets in `font-mono text-meta` (`Zeichen 1204–1268`).
Erscheint nach 400 ms Verweilen, verschwindet nach 150 ms — sofort bei `Esc`. Bei
Tastaturbedienung erscheint es beim Fokus ohne Verzögerung.

**Hervorhebung in der Quellenansicht.** Der Klick öffnet die Quelle rechts, scrollt die
Stelle in das mittlere Drittel und legt `accent-surface` mit 2 px Unterlinie in
`accent-border` darüber. Die Hervorhebung blitzt einmal auf (`motion-slow`) und bleibt
dann bestehen, bis ein anderer Beleg gewählt wird. Über der Quelle steht eine Leiste
"Beleg 3 von 5" mit Pfeilen zum Durchblättern.

Nicht verhandelbar: Ein Marker wird nur dargestellt, wenn der Server ihn gegen einen real
abgerufenen Abschnitt auflösen konnte. Ein Marker, der ins Leere zeigt, ist ein Fehler,
kein Gestaltungsfall.

### 8.7 Tabs

Verwendung: Wechsel der rechten Spalte (`Notizen · Quelle`) und die mobile Hauptnavigation.

Darstellung: waagerechte Leiste, Beschriftung `text-label`, Innenabstand `space-3`
waagerecht und `space-2` senkrecht, `radius-sm` oben. Unter der Leiste eine 1-px-Linie in
`border-subtle`.

| Zustand | Darstellung |
|---|---|
| Ruhe | Text `content-muted` |
| Zeigerkontakt | Text `content`, Fläche `surface-sunken` |
| Fokus | Ring `focus-ring` innerhalb des Tabs |
| Ausgewählt | Text `content-strong`, 2 px Unterstreichung in `action`, Fläche `action-surface` |
| Deaktiviert | `content-subtle`, nicht fokussierbar |
| Mit Zähler | Zahl als Plakette `radius-full`, `surface-inset`, `text-meta`; im ausgewählten Tab `action-surface` |

Tastatur: Pfeiltasten wechseln, `Pos1`/`Ende` springen an den Rand, `Tab` verlässt die
Leiste. `role="tablist"`, Inhalt mit `role="tabpanel"` und `aria-labelledby`.
Die Unterstreichung wandert in `motion-fast`; bei reduzierter Bewegung springt sie.

### 8.8 Statusanzeigen

Vier Formen, klar getrennt nach Reichweite:

**Plakette** — Zustand eines Objekts. Höhe 20 px, `radius-full`, `text-micro`,
Statusfläche und Statustext, Symbol links. Werte: `Bereit` (success), `Wird verarbeitet`
(info, mit Spinner), `Fehler` (danger), `Abgewählt` (neutral, `surface-inset`).

**Inline-Hinweis** — Zustand eines Bereichs. Volle Breite, `radius-md`, Innenabstand
`space-3`, Statusfläche, 3 px Balken links in der Statusfarbe, Symbol, Text, optional eine
Aktion rechts. Verwendung: "Simulierte Antwort", "Keine Quelle ausgewählt".

**Kurzmeldung** — Ergebnis einer Handlung. Unten rechts, `surface-overlay`, `shadow-md`,
`radius-md`, verschwindet nach 5 s (Fehler bleiben, bis geschlossen), höchstens drei
gleichzeitig, `aria-live="polite"` (Fehler `assertive`). Sie melden nur, was geschehen ist
— sie ersetzen nie eine Fehlermeldung am Ort des Fehlers.

**Fortschritt** — laufende Arbeit mit bekanntem Ende: 3 px Balken in `action` auf
`surface-inset`, `radius-full`. Ohne bekanntes Ende: Balken mit wanderndem Verlauf. Dauert
etwas über 400 ms, wird zusätzlich ein Text eingeblendet, der sagt, worauf gewartet wird.

**Leere Zustände** gelten als Statusanzeige: sie nennen immer den nächsten Schritt.
"Noch keine Quelle. Text einfügen oder Datei wählen." — nie nur "Keine Daten".

---

## 9. Zugänglichkeit

Prüfliste vor jeder Abnahme. Bis sie abgehakt ist, gilt keine Zusage als bestätigt:

- [ ] Jede Funktion ohne Zeigergerät bedienbar, Reihenfolge entspricht dem Layout
- [ ] Fokus überall sichtbar, auch auf `accent`-Flächen
- [ ] Kontrast gemessen: Text ab 4,5:1, Bedienelemente ab 3:1
- [ ] Zitatmarker als `button` mit aussagekräftigem `aria-label`
- [ ] Einströmende Antworten in einer `aria-live="polite"`-Region
- [ ] Ein Sprung zur Quellenstelle wird für Hilfstechnik angesagt
- [ ] `prefers-reduced-motion` respektiert
- [ ] Bedienbar bei 200 % Zoom ohne waagerechtes Scrollen
- [ ] Keine Information allein durch Farbe
