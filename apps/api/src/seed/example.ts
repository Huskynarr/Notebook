/** Beispielinhalt fuer ein sofort nutzbares Notebook (P9).
 *
 *  Die Texte sind fuer dieses Projekt geschrieben und bilden keine echte
 *  Pruefungsordnung ab. Das steht auch im Text selbst, damit niemand sie fuer
 *  eine verbindliche Auskunft haelt. */
export const EXAMPLE_NOTEBOOK_TITLE = 'Beispiel: Pruefungsrecht (erfundene Ordnung)';

export const EXAMPLE_QUESTION = 'Wie lange habe ich Zeit, einer Bewertung zu widersprechen?';

export const EXAMPLE_SOURCES: ReadonlyArray<{
  title: string;
  kind: 'markdown';
  content: string;
}> = [
  {
    title: 'pruefungsordnung-beispiel.md',
    kind: 'markdown',
    content: `# Pruefungsordnung (Beispieltext, nicht verbindlich)

Dieser Text ist fuer die Demonstration dieser Anwendung erfunden. Er gibt keine
Ordnung einer realen Hochschule wieder und taugt nicht als Rechtsauskunft.

## 1 Geltungsbereich

Diese Ordnung gilt fuer alle Modulpruefungen des Bachelorstudiengangs Mathematik.
Fuer Abschlussarbeiten gelten zusaetzlich die Regelungen in Abschnitt 5.

## 2 Anmeldung

Die Anmeldung zu einer Modulpruefung erfolgt ueber das Pruefungsportal. Sie ist
spaetestens zehn Werktage vor dem Pruefungstermin vorzunehmen.

Eine Abmeldung ist bis drei Werktage vor dem Termin ohne Angabe von Gruenden
moeglich. Danach ist ein Ruecktritt nur mit einem aerztlichen Attest zulaessig.

## 3 Fristen

### 3.1 Bekanntgabe

Die Bewertung einer Pruefungsleistung wird den Studierenden spaetestens sechs
Wochen nach dem Pruefungstermin bekannt gegeben.

### 3.2 Widerspruch

Gegen die Bewertung einer Pruefungsleistung kann Widerspruch eingelegt werden.
Die Widerspruchsfrist betraegt vierzehn Tage ab Bekanntgabe der Bewertung.

Der Widerspruch ist schriftlich und mit Begruendung beim Pruefungsamt
einzureichen. Ein per E-Mail eingereichter Widerspruch wahrt die Frist nicht.

## 4 Wiederholung

Eine nicht bestandene Modulpruefung kann zweimal wiederholt werden. Die zweite
Wiederholung wird als muendliche Pruefung durchgefuehrt.

Die Wiederholung ist innerhalb von zwoelf Monaten nach der nicht bestandenen
Pruefung abzulegen.

## 5 Abschlussarbeit

Die Bearbeitungszeit der Bachelorarbeit betraegt vier Monate. Auf begruendeten
Antrag kann der Pruefungsausschuss die Frist einmalig um bis zu vier Wochen
verlaengern.`,
  },
  {
    title: 'merkblatt-pruefungsamt.md',
    kind: 'markdown',
    content: `# Merkblatt des Pruefungsamts (Beispieltext, nicht verbindlich)

Auch dieser Text ist erfunden und dient nur der Demonstration.

## Oeffnungszeiten

Das Pruefungsamt ist dienstags und donnerstags von 9 bis 12 Uhr geoeffnet.
Ausserhalb dieser Zeiten koennen Unterlagen in den Briefkasten neben Raum 214
eingeworfen werden.

## Form des Widerspruchs

Ein Widerspruch muss enthalten: Name, Matrikelnummer, die Bezeichnung der
Pruefung, das Datum der Bekanntgabe und eine Begruendung.

Fehlt die Begruendung, fordert das Pruefungsamt sie nach. Die Nachreichung
verlaengert die Widerspruchsfrist nicht.

## Einsicht in die Pruefungsakte

Die Einsicht in die eigene Pruefungsakte ist innerhalb eines Jahres nach
Bekanntgabe der Bewertung moeglich. Sie ist formlos zu beantragen.

Die Einsicht findet in Raum 214 statt und dauert in der Regel dreissig Minuten.`,
  },
];
