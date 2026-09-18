#!/usr/bin/env python3
"""Ersetzt ASCII-gefaltete Umlaute in STRING-LITERALEN sichtbarer Texte.

Kommentare und Bezeichner bleiben unangetastet: dort ist ASCII Konvention
dieses Repos. Nur was in Anfuehrungszeichen oder Backticks steht, wird
angefasst - und dort nur Woerter aus der Liste unten, keine Heuristik.
Aufruf: python3 tools/umlaute.py <dateien...>   (--check: nur melden)
"""
import re, sys

WOERTER = {
    'Pruefungsordnung': 'Prüfungsordnung', 'pruefungsordnung': 'prüfungsordnung',
    'Pruefungsamts': 'Prüfungsamts', 'Pruefungsamt': 'Prüfungsamt', 'pruefungsamt': 'prüfungsamt',
    'Pruefungsleistung': 'Prüfungsleistung', 'Pruefungstermin': 'Prüfungstermin',
    'Pruefungsportal': 'Prüfungsportal', 'Pruefungsakte': 'Prüfungsakte',
    'Pruefungsausschuss': 'Prüfungsausschuss', 'Pruefungsrecht': 'Prüfungsrecht',
    'Modulpruefung': 'Modulprüfung', 'Modulpruefungen': 'Modulprüfungen', 'Pruefung': 'Prüfung',
    'fuer': 'für', 'Fuer': 'Für', 'ueber': 'über', 'Ueber': 'Über',
    'betraegt': 'beträgt', 'traegt': 'trägt', 'zusaetzlich': 'zusätzlich',
    'zurueck': 'zurück', 'moeglich': 'möglich', 'Moeglich': 'Möglich',
    'ausgewaehlten': 'ausgewählten', 'ausgewaehlt': 'ausgewählt', 'Waehle': 'Wähle',
    'Begruendung': 'Begründung', 'woertliches': 'wörtliches', 'woertlich': 'wörtlich',
    'waere': 'wäre', 'spaetestens': 'spätestens', 'laeuft': 'läuft', 'haelt': 'hält',
    'zwoelf': 'zwölf', 'zulaessig': 'zulässig', 'verlaengern': 'verlängern',
    'verlaengert': 'verlängert', 'aerztlichen': 'ärztlichen', 'Gruenden': 'Gründen',
    'Ruecktritt': 'Rücktritt', 'Oeffnungszeiten': 'Öffnungszeiten', 'geoeffnet': 'geöffnet',
    'Ausserhalb': 'Außerhalb', 'koennen': 'können', 'muendliche': 'mündliche',
    'dreissig': 'dreißig', 'Rueckmeldefrist': 'Rückmeldefrist', 'Waehlen': 'Wählen',
    'Woerter': 'Wörter', 'enthaelt': 'enthält', 'laesst': 'lässt', 'liess': 'ließ',
    'ausschliesslich': 'ausschließlich', 'Sprachmodell': 'Sprachmodell',
    'Textstelle': 'Textstelle', 'naechsten': 'nächsten', 'tatsaechlich': 'tatsächlich',
    'unveraendert': 'unverändert', 'vollstaendig': 'vollständig', 'Flaeche': 'Fläche',
    'Kaestchen': 'Kästchen', 'gueltig': 'gültig', 'ungueltig': 'ungültig', 'Schluessel': 'Schlüssel',
    'erwaehnt': 'erwähnt', 'Abkuerzung': 'Abkürzung', 'schliessen': 'schließen',
    'Groesse': 'Größe', 'groesser': 'größer', 'hoechstens': 'höchstens',
    'Loesung': 'Lösung', 'stuetzt': 'stützt', 'zugehoerigen': 'zugehörigen',
    'zaehlt': 'zählt', 'pruefbar': 'prüfbar', 'Pruefe': 'Prüfe', 'pruefen': 'prüfen',
    'Bewertung': 'Bewertung', 'schriftlich': 'schriftlich', 'Widerspruch': 'Widerspruch',
}
# Wörter, die nur lang genug/eindeutig sind, ersetzen; kurze Tokens bleiben.
MUSTER = re.compile(r'\b(' + '|'.join(sorted(map(re.escape, WOERTER), key=len, reverse=True)) + r')\b')
LITERAL = re.compile(r"""('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`)""", re.S)

def ersetze_literal(m: re.Match) -> str:
    return MUSTER.sub(lambda w: WOERTER[w.group(1)], m.group(0))

check = '--check' in sys.argv
geaendert = 0
for pfad in [a for a in sys.argv[1:] if a != '--check']:
    alt = open(pfad, encoding='utf-8').read()
    neu = LITERAL.sub(ersetze_literal, alt)
    if neu != alt:
        geaendert += 1
        treffer = sorted(set(MUSTER.findall(' '.join(LITERAL.findall(alt)))))
        print(f'{pfad}: {", ".join(treffer)}')
        if not check:
            open(pfad, 'w', encoding='utf-8').write(neu)
print(f'{"zu ändern" if check else "geändert"}: {geaendert} Dateien')
