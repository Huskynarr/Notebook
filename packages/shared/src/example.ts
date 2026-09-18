/** Beispielinhalt fuer ein sofort nutzbares Notebook (P9).
 *
 *  Die Texte sind fuer dieses Projekt geschrieben und bilden keine echte
 *  Pruefungsordnung ab. Das steht auch im Text selbst, damit niemand sie fuer
 *  eine verbindliche Auskunft haelt. */
export const EXAMPLE_NOTEBOOK_TITLE = 'Beispiel: Prüfungsrecht (erfundene Ordnung)';

export const EXAMPLE_QUESTION = 'Wie lange habe ich Zeit, einer Bewertung zu widersprechen?';

export const EXAMPLE_SOURCES: ReadonlyArray<{
  title: string;
  kind: 'markdown';
  content: string;
}> = [
  {
    title: 'Prüfungsordnung (Beispiel).md',
    kind: 'markdown',
    content: `# Prüfungsordnung (Beispieltext, nicht verbindlich)

Dieser Text ist für die Demonstration dieser Anwendung erfunden. Er gibt keine
Ordnung einer realen Hochschule wieder und taugt nicht als Rechtsauskunft.

## 1 Geltungsbereich

Diese Ordnung gilt für alle Modulprüfungen des Bachelorstudiengangs Mathematik.
Für Abschlussarbeiten gelten zusätzlich die Regelungen in Abschnitt 5.

## 2 Anmeldung

Die Anmeldung zu einer Modulprüfung erfolgt über das Prüfungsportal. Sie ist
spätestens zehn Werktage vor dem Prüfungstermin vorzunehmen.

Eine Abmeldung ist bis drei Werktage vor dem Termin ohne Angabe von Gründen
möglich. Danach ist ein Rücktritt nur mit einem ärztlichen Attest zulässig.

## 3 Fristen

### 3.1 Bekanntgabe

Die Bewertung einer Prüfungsleistung wird den Studierenden spätestens sechs
Wochen nach dem Prüfungstermin bekannt gegeben.

### 3.2 Widerspruch

Gegen die Bewertung einer Prüfungsleistung kann Widerspruch eingelegt werden.
Die Widerspruchsfrist beträgt vierzehn Tage ab Bekanntgabe der Bewertung.

Der Widerspruch ist schriftlich und mit Begründung beim Prüfungsamt
einzureichen. Ein per E-Mail eingereichter Widerspruch wahrt die Frist nicht.

## 4 Wiederholung

Eine nicht bestandene Modulprüfung kann zweimal wiederholt werden. Die zweite
Wiederholung wird als mündliche Prüfung durchgefuehrt.

Die Wiederholung ist innerhalb von zwölf Monaten nach der nicht bestandenen
Prüfung abzulegen.

## 5 Abschlussarbeit

Die Bearbeitungszeit der Bachelorarbeit beträgt vier Monate. Auf begruendeten
Antrag kann der Prüfungsausschuss die Frist einmalig um bis zu vier Wochen
verlängern.`,
  },
  {
    title: 'Merkblatt Prüfungsamt.md',
    kind: 'markdown',
    content: `# Merkblatt des Prüfungsamts (Beispieltext, nicht verbindlich)

Auch dieser Text ist erfunden und dient nur der Demonstration.

## Öffnungszeiten

Das Prüfungsamt ist dienstags und donnerstags von 9 bis 12 Uhr geöffnet.
Außerhalb dieser Zeiten können Unterlagen in den Briefkasten neben Raum 214
eingeworfen werden.

## Form des Widerspruchs

Ein Widerspruch muss enthalten: Name, Matrikelnummer, die Bezeichnung der
Prüfung, das Datum der Bekanntgabe und eine Begründung.

Fehlt die Begründung, fordert das Prüfungsamt sie nach. Die Nachreichung
verlängert die Widerspruchsfrist nicht.

## Einsicht in die Prüfungsakte

Die Einsicht in die eigene Prüfungsakte ist innerhalb eines Jahres nach
Bekanntgabe der Bewertung möglich. Sie ist formlos zu beantragen.

Die Einsicht findet in Raum 214 statt und dauert in der Regel dreißig Minuten.`,
  },
];
