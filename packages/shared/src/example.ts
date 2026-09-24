/** Öffentliches Quellenbeispiel für ein sofort nutzbares Notebook (P9).
 *
 * Die kurzen, selbst verfassten Zusammenfassungen geben Selbstauskünfte der
 * Unternehmenswebsite wieder. Sie sind keine Auszüge aus dem Handelsregister.
 * Für Bilanzen und Beteiligungen liegen hier keine Originaldokumente vor. */
export const EXAMPLE_NOTEBOOK_TITLE = 'Beispiel: Everlast AI recherchieren';

export const EXAMPLE_QUESTION =
  'Welche Gesellschaft steht hinter Everlast AI und wer vertritt sie laut Impressum?';

export const EXAMPLE_SOURCES: ReadonlyArray<{
  title: string;
  kind: 'markdown';
  content: string;
}> = [
  {
    title: 'Everlast Consulting GmbH – Impressum.md',
    kind: 'markdown',
    content: `# Everlast Consulting GmbH – Impressum

Quelle: https://www.kiberatung.de/impressum
Art: Unternehmenswebsite, eigene Angaben des Unternehmens; keine amtliche Registerabschrift.
Abrufdatum: 23.09.2026.
Die folgenden Sätze sind eine knappe, selbst verfasste Zusammenfassung.

## Firma und Sitz

Das Impressum nennt die Everlast Consulting GmbH mit der Anschrift
Rißstraße 17, 88400 Biberach an der Riß.

## Registerangaben

Die Website nennt als Registergericht das Amtsgericht Ulm und als
Registernummer HRB 748517.

## Vertretung

Unter „Vertreten durch“ nennt das Impressum Viktor Schöck. Die Seite
bezeichnet ihn dort nicht ausdrücklich als Geschäftsführer.`,
  },
  {
    title: 'Everlast AI – Selbstauskunft.md',
    kind: 'markdown',
    content: `# Everlast AI – Selbstauskunft

Quelle: https://www.kiberatung.de/referenzen
Abschnitt: „Wer steckt hinter Everlast AI?“ in den häufigen Fragen.
Art: Unternehmenswebsite, eigene Angaben des Unternehmens; keine amtliche Gesellschafterliste.
Abrufdatum: 23.09.2026.
Die folgenden Sätze sind eine knappe, selbst verfasste Zusammenfassung.

## Marke und Gesellschaft

Auf ihrer Website bezeichnet das Unternehmen Everlast AI als Marke der
Everlast Consulting GmbH. Die Website nennt auch die Anschrift
Rißstraße 17 in 88400 Biberach an der Riß und das Amtsgericht Ulm
mit der Registernummer HRB 748517.

## Als Gründer genannte Personen

Die Website nennt Leonard Schmedding, Stevo Topic und Marvin Schienbein
als Gründer des Unternehmens. Sie legt in diesem Abschnitt keine aktuelle
Gesellschafterliste oder geprüften Bilanzzahlen vor.`,
  },
];
