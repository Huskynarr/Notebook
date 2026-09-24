/**
 * Deutsche Oberflaechentexte. `en.ts` muss dieselben Schluessel haben - der
 * Typ `Texte` erzwingt das beim Build. Platzhalter stehen als {name}.
 *
 * Keine Bibliothek (AGENTS.md Regel 7): zwei Sprachen, flache Schluessel,
 * eine Funktion. Mehr braucht es nicht.
 */
export const de = {
  'app.name': 'Notebook',
  'app.tagline': 'Quellenbasiertes Arbeiten mit überprüfbaren Belegen.',

  'common.cancel': 'Abbrechen',
  'common.done': 'Fertig',
  'common.save': 'Speichern',
  'common.edit': 'Bearbeiten',
  'common.delete': 'Löschen',
  'common.retry': 'Erneut versuchen',
  'common.close': 'Schließen',
  'common.back': 'Zurück',
  'common.next': 'Weiter',
  'common.settings': 'Einstellungen',
  'common.logout': 'Abmelden',
  'common.new': 'Neu',
  'common.copy': 'Kopieren',
  'common.untitled': 'Ohne Titel',
  'common.loading': 'wird geladen …',
  'common.words': 'Wörter',
  'common.sections': 'Abschnitte',
  'common.characters': 'Zeichen',
  'common.closeMessage': 'Meldung schließen',

  'notes.editableHint':
    'Notizen sind bearbeitbar. Belege verweisen auf Originaltext; die Aussage und KI-Herkunft einer Notiz werden dadurch nicht unabhängig bestätigt.',
  'notes.sourceMissing': 'Originalquelle gelöscht. Gespeicherter Belegauszug:',
  'demo.singleNotebook':
    'Die Browser-Demo enthält ein einzelnes Beispiel-Notebook. Vollständige Notebook-Verwaltung benötigt die Backend-Verbindung.',
  'login.username': 'Benutzername',
  'login.password': 'Passwort',
  'login.submit': 'Anmelden',
  'login.failed': 'Anmeldung fehlgeschlagen.',
  'login.localTitle': 'Lokaler Zugang',
  'login.localBody':
    'Voreinstellung {creds}. Der Zugang ist für den Betrieb auf dem eigenen Rechner gedacht — vor einer Erreichbarkeit im Netz muss er geändert werden.',
  'login.backend': 'Backend: {url}',
  'login.demo': 'Demo · läuft ohne Server in diesem Browser',
  'login.wait': 'Erneute Anmeldung in {seconds} Sekunden möglich.',
  'login.cooldownHint': 'Nach drei fehlgeschlagenen Anmeldungen verlängert sich die Wartezeit.',
  'login.demoOpen': 'Demo öffnen',
  'login.demoWarning':
    'Ungeschützte Browser-Demo. Keine echte Anmeldung, keine KI-Verbindung. Nur Beispieldaten verwenden.',
  'login.back': 'Zur Startseite',
  'login.protected': 'Geschützter Arbeitsbereich',

  'header.chooseNotebook': 'Notebook wählen',
  'header.share': 'Teilen',
  'header.noModel': 'kein Modell verbunden',
  'header.externalApiBlocked': 'externe API gesperrt',

  'notebook.new.title': 'Neues Notebook',
  'notebook.new.description':
    'Ein Notebook ist ein abgegrenzter Quellenraum. Es greift nie auf die Quellen eines anderen Notebooks zu.',
  'notebook.new.titleLabel': 'Titel',
  'notebook.new.placeholder': 'z. B. Seminar Stochastik',
  'notebook.new.submit': 'Anlegen',
  'notebook.rename': 'Umbenennen',
  'notebook.delete.title': 'Notebook löschen',
  'notebook.delete.body':
    '„{title}" mit allen Quellen und Notizen löschen? Das lässt sich nicht rückgängig machen.',
  'notebook.delete.confirm': 'Notebook löschen',

  'sources.title': 'Quellen',
  'sources.selectedOf': '{selected} von {total} ausgewählt',
  'sources.add': 'Hinzufügen',
  'sources.empty.title': 'Noch keine Quelle',
  'sources.empty.body':
    'Text einfügen oder eine .txt- oder .md-Datei wählen. Ohne Quelle beantwortet dieses Notebook keine Frage.',
  'sources.loading': 'Quellen werden geladen …',
  'sources.considerForQuestions': '{title} für Fragen berücksichtigen',
  'sources.deleteTitle': '{title} löschen',
  'sources.deselected': 'Abgewählt',
  'sources.hits': '{count} Treffer',
  'sources.kind.text': 'Text',
  'sources.kind.markdown': 'Markdown',
  'sources.kind.url': 'Adresse',
  'sources.kind.pdf': 'PDF',

  'addSource.title': 'Quelle hinzufügen',
  'addSource.description':
    'Der Originaltext wird unverändert gespeichert — alle Belege verweisen später auf Zeichenpositionen in genau diesem Text.',
  'addSource.tab.text': 'Text',
  'addSource.tab.file': 'Datei',
  'addSource.tab.url': 'Adresse',
  'addSource.titleLabel': 'Titel',
  'addSource.titlePlaceholder': 'z. B. Handelsregisterauszug.md',
  'addSource.titleHint': 'Endet der Titel auf .md, wird der Text als Markdown zerlegt.',
  'addSource.fileLabel': 'Datei wählen (.txt oder .md)',
  'addSource.textLabel': 'Text',
  'addSource.textPlaceholder': 'Text hier einfügen …',
  'addSource.urlLabel': 'Adresse (https://…)',
  'addSource.urlPlaceholder': 'https://example.org/ordnung',
  'addSource.urlHint':
    'Webseite oder Text-/JSON-Endpunkt. Skripte, Navigation und Fußzeilen werden entfernt; gespeichert wird der extrahierte Text.',
  'addSource.submit': 'Quelle anlegen',
  'addSource.fetching': 'Adresse wird abgerufen …',
  'addSource.emptyError': 'Ohne Text lässt sich keine Quelle anlegen.',
  'addSource.urlError': 'Bitte eine vollständige Adresse mit https:// angeben.',
  'addSource.genericError': 'Die Quelle konnte nicht angelegt werden.',
  'addSource.tooLarge': 'Maximal 10 MiB (10.485.760 Bytes) pro Quelle in dieser Testumgebung.',
  'addSource.invalidFile': 'Nur UTF-8-Textdateien im Format .txt oder .md sind unterstützt.',
  'addSource.unsupportedUrl':
    'Website-Import ist in dieser Version nicht verfügbar. Text oder Markdown importieren.',
  'addSource.fileHint': '.txt oder .md · UTF-8 · maximal 10 MiB pro Quelle',
  'addSource.added': '„{title}" hinzugefügt ({count} Abschnitte).',
  'addSource.corsError':
    'Diese Adresse erlaubt keinen Abruf direkt aus dem Browser (CORS). Mit einem Backend holt der Server die Seite; in der Demo geht das nur bei Seiten, die den Abruf freigeben.',

  'chat.emptyTitle': 'Frage stellen',
  'chat.emptyBody':
    'Antworten entstehen ausschließlich aus den links ausgewählten Quellen. Jede Aussage trägt einen Beleg, der auf die Stelle im Original zeigt.',
  'chat.tryOne': 'Zum Ausprobieren:',
  'chat.example1': 'Wer vertritt die Everlast Consulting GmbH laut Impressum?',
  'chat.example2': 'Welche Registerangaben nennt das Impressum?',
  'chat.example3': 'Welche Gründer nennt die Everlast-Website?',
  'chat.searching': 'Durchsuche {count} {noun} …',
  'chat.sourceOne': 'Quelle',
  'chat.sourceMany': 'Quellen',
  'chat.considered': '{count} Quellen berücksichtigt',
  'chat.inputLabel': 'Frage an die ausgewählten Quellen',
  'chat.inputPlaceholder': 'Frage an die ausgewählten Quellen …',
  'chat.send': 'Fragen',
  'chat.hint': 'Enter sendet, Umschalt+Enter erzeugt einen Zeilenumbruch.',
  'chat.openRouterPrivacy':
    'OpenRouter Free: Frage und ausgewählte Textstellen gehen an einen externen Modellanbieter. Nur öffentliche, unkritische Testdaten verwenden.',
  'chat.noSourceTitle': 'Keine Quelle ausgewählt',
  'chat.noSourceBody':
    'Wähle links mindestens eine Quelle aus. Ohne Quelle wird nicht geantwortet.',
  'chat.errorTitle': 'Die Frage konnte nicht beantwortet werden',
  'chat.modelBlockedTitle': 'KI-Anfragen vorübergehend gesperrt',
  'chat.modelBlockedBody':
    'OpenCode hat externe Anfragen an das kostenlose MiMo-Modell abgewiesen. Quellen und Notizen bleiben nutzbar; eine KI-Antwort ist derzeit nicht verfügbar.',
  'chat.simulatedTitle': 'Simulierte Antwort — kein Modell verbunden',
  'chat.simulatedBody':
    'Es ist kein Sprachmodell angebunden. Gezeigt werden die gefundenen Textstellen; formuliert wurde nichts.',
  'chat.ungroundedTitle': 'Nicht aus den Quellen belegbar',
  'chat.ungroundedBody': 'Die ausgewählten Quellen decken diese Frage nicht ab.',
  'chat.dropped':
    '{count} vom Modell gesetzte Belege zeigten auf keine abgerufene Textstelle und wurden entfernt.',
  'chat.unsupported': '{count} Sätze ohne Beleg (gepunktet unterstrichen).',
  'chat.unsupportedTitle': 'Dieser Satz trägt keinen Beleg aus den Quellen.',
  'chat.saveNote': 'Als Notiz speichern',
  'chat.wholeSection': 'ganzer Abschnitt',
  'chat.askFailed': 'Die Frage konnte nicht gestellt werden.',

  'citation.label': 'Beleg {marker}: {source}',
  'citation.range': 'Zeichen {start}–{end}',
  'citation.exact': 'wörtlich belegt',
  'citation.chunk': 'ganzer Abschnitt (kein wörtliches Zitat gefunden)',
  'citation.step': 'Beleg {index} von {total}',
  'citation.prev': 'Vorheriger Beleg',
  'citation.next': 'Nächster Beleg',

  'viewer.emptyTitle': 'Keine Quelle geöffnet',
  'viewer.emptyBody':
    'Wähle links eine Quelle aus oder klicke in einer Antwort auf einen Beleg, um die Originalstelle zu sehen.',

  'notes.title': 'Notizen',
  'notes.source': 'Quelle',
  'notes.empty.title': 'Noch keine Notiz',
  'notes.empty.body':
    'Speichere eine Antwort als Notiz. Die Belege werden dabei eingefroren und bleiben prüfbar, auch wenn der Chat weiterläuft.',
  'notes.question': 'Frage: {question}',
  'notes.editTitle': 'Notiz bearbeiten',
  'notes.deleteTitle': 'Notiz löschen',
  'notes.saved': 'Als Notiz gespeichert — mit allen Belegen.',
  'notes.fieldTitle': 'Titel',
  'notes.fieldBody': 'Text',

  'tabs.area': 'Bereich',
  'tabs.right': 'Rechte Spalte',
  'tabs.sources': 'Quellen',
  'tabs.chat': 'Chat',
  'tabs.notes': 'Notizen',
  'tabs.source': 'Quelle',

  'settings.title': 'Einstellungen',
  'settings.description': 'Änderungen wirken sofort und bleiben auf diesem Gerät gespeichert.',
  'settings.language': 'Sprache',
  'settings.design': 'Design',
  'settings.appearance': 'Erscheinungsbild',
  'settings.mode.system': 'System',
  'settings.mode.light': 'Hell',
  'settings.mode.dark': 'Dunkel',
  'settings.data': 'Daten',
  'settings.demoData':
    'Diese Demo läuft ohne Server. Notebooks, Quellen und Notizen liegen im Speicher dieses Browsers und bleiben beim Neuladen erhalten. Ein Sprachmodell ist nicht angebunden; Antworten zeigen die gefundenen Belegstellen.',
  'settings.backend': 'Backend',
  'settings.backendHint': 'Wird beim Bauen über {variable} gesetzt.',
  'settings.showTour': 'Einführung erneut anzeigen',
  'settings.privacy': 'Datenschutz',
  'settings.rememberSettings': 'Einstellungen auf diesem Gerät merken',
  'settings.privacyHint':
    'Keine Cookies, kein Tracking. Ohne Häkchen gelten Sprache, Design und Spaltenbreiten nur bis zum Schließen des Tabs.',
  'settings.privacyDecided': 'Entschieden am {date}.',
  'settings.privacyUndecided': 'Noch nicht entschieden.',

  'consent.title': 'Speicherung auf diesem Gerät',
  'consent.body':
    'Diese Anwendung setzt keine Cookies und kein Tracking. Im Onlinebetrieb liegen Notebooks, Quellen und Notizen auf dem Server. Hier entscheidest du, ob lokale Einstellungen über die Sitzung hinaus gespeichert werden.',
  'consent.necessary.title': 'Notwendig',
  'consent.necessary.body':
    'Anmeldesitzung; in der Demo außerdem Notebooks, Quellen und Notizen. Ohne sie funktioniert die Anwendung nicht.',
  'consent.settings.title': 'Einstellungen merken',
  'consent.settings.body':
    'Sprache, Design, Erscheinungsbild, Spaltenbreiten und ob du die Einführung gesehen hast. Ohne Zustimmung gelten sie nur bis zum Schließen des Tabs.',
  'consent.always': 'immer aktiv',
  'consent.acceptAll': 'Alle akzeptieren',
  'consent.necessaryOnly': 'Nur notwendige',
  'consent.save': 'Auswahl speichern',
  'consent.customize': 'Auswahl anpassen',
  'consent.less': 'Weniger anzeigen',

  'design.everlast.label': 'Everlast · Research',
  'design.everlast.hint':
    'Eigenständige Interpretation mit Schwarz, Zitronengelb und klarer Typografie.',
  'design.eigen.label': 'Papier und Tinte',
  'design.eigen.hint': 'Eigenes Design: warme Flächen, Serife für Lesetext, Braun für Belege.',
  'design.uni-freiburg.label': 'Universität Freiburg',
  'design.uni-freiburg.hint':
    'Corporate Design der Universität. Hausschrift nur mit Lizenz, sonst Arial.',
  'design.huskynarr.label': 'huskynarr',
  'design.huskynarr.hint':
    'Angenähert an huskynarr.de — dunkle Steinfarben, Limettengrün und Inter.',

  'tour.step': 'Schritt {index} von {total}',
  'tour.language.title': 'Willkommen',
  'tour.language.body': 'In welcher Sprache soll die Oberfläche erscheinen?',
  'tour.design.title': 'Design wählen',
  'tour.design.body':
    'Drei Designs, jederzeit in den Einstellungen änderbar. Die Auswahl wirkt sofort.',
  'tour.how.title': 'So funktioniert es',
  'tour.how.1':
    'Quellen hinzufügen — Text, Datei oder Adresse. Links auswählen, was für die nächste Frage zählt.',
  'tour.how.2': 'Frage stellen. Die Antwort entsteht nur aus den ausgewählten Quellen.',
  'tour.how.3':
    'Beleg anklicken: Die Quelle öffnet sich rechts und hebt genau die belegenden Zeichen hervor.',
  'tour.how.4': 'Als Notiz speichern — die Belege bleiben eingefroren und prüfbar.',
  'tour.demoNote':
    'Diese Demo läuft ohne Server: Daten bleiben in deinem Browser, ein Sprachmodell ist nicht angebunden.',
  'tour.start': 'Los geht’s',
  'tour.skip': 'Überspringen',

  'share.title': 'Teilen',
  'share.notebook': 'Ganzes Notebook',
  'share.answer': 'Diese Antwort',
  'share.markdown': 'Markdown (.md)',
  'share.pdf': 'PDF (Druckansicht)',
  'share.docx': 'Word (.docx)',
  'share.image': 'Bild (.png)',
  'share.copyLink': 'Link kopieren',
  'share.linkCopied': 'Link kopiert.',
  'share.linkDemo':
    'In der Demo liegen die Daten nur in diesem Browser — der Link öffnet für andere ein leeres Beispiel-Notebook.',
  'share.exported': '{format} exportiert.',
  'share.failed': 'Der Export ist fehlgeschlagen.',
  'share.pdfHint': 'Im Druckdialog „Als PDF speichern" wählen.',
  'share.answerHeading': 'Antwort',
  'share.questionHeading': 'Frage',
  'share.citationsHeading': 'Belege',
  'share.exportedOn': 'Exportiert am {date}',
  'share.noNotes': 'Keine Notizen.',

  'error.sessionExpired': 'Die Sitzung ist abgelaufen. Bitte neu anmelden.',
  'error.loadNotebooks': 'Die Notebooks konnten nicht geladen werden.',
  'error.loadNotebook': 'Das Notebook konnte nicht geladen werden.',
  'error.loadSource': 'Die Quelle konnte nicht geladen werden.',
  'error.saveSelection': 'Die Auswahl konnte nicht gespeichert werden.',
  'error.saveNote': 'Die Notiz konnte nicht gespeichert werden.',
  'error.updateNote': 'Die Notiz konnte nicht geändert werden.',
  'error.deleteNote': 'Die Notiz konnte nicht gelöscht werden.',
  'error.deleteSource': 'Die Quelle konnte nicht gelöscht werden.',
  'error.createNotebook': 'Das Notebook konnte nicht angelegt werden.',
  'error.export': 'Der Export ist fehlgeschlagen.',
  'error.network': 'Das Backend unter {url} ist nicht erreichbar.',
  'error.contract': 'Die Antwort des Backends entspricht nicht dem erwarteten Format.',
  'error.status': 'Fehler {status}.',
  'error.sourceDeleted': '„{title}" gelöscht.',

  'answer.noSources':
    'Es ist keine Quelle ausgewählt. Wähle links mindestens eine Quelle aus, damit die Frage aus den Quellen beantwortet werden kann.',
  'answer.noMatch':
    'In den ausgewählten Quellen findet sich zu dieser Frage keine Textstelle. Möglich ist, dass die Quellen das Thema nicht behandeln oder die Frage andere Begriffe verwendet als die Texte.',
  'answer.noTerms': 'Die Frage enthält keine suchbaren Begriffe.',
  'answer.stubIntro':
    'Es ist kein Sprachmodell verbunden. Diese Antwort ist daher nicht formuliert, sondern zeigt nur, welche Textstellen zu der Frage gefunden wurden:',
  'answer.stubItem': 'Abschnitt [{marker}] aus {source}',
  'answer.stubOutro': 'Ein Klick auf einen Beleg springt zur Stelle im Originaltext.',
} as const;

export type TextKey = keyof typeof de;
export type Texte = Record<TextKey, string>;
