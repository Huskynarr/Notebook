import type { Texte } from './de.ts';

/** English interface texts. Must cover every key of `de.ts` - the `Texte` type
 *  makes a missing key a build error. */
export const en: Texte = {
  'app.name': 'Notebook',
  'app.tagline': 'Source-grounded work with verifiable citations.',

  'common.cancel': 'Cancel',
  'common.done': 'Done',
  'common.save': 'Save',
  'common.edit': 'Edit',
  'common.delete': 'Delete',
  'common.retry': 'Try again',
  'common.close': 'Close',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.settings': 'Settings',
  'common.logout': 'Sign out',
  'common.new': 'New',
  'common.copy': 'Copy',
  'common.untitled': 'Untitled',
  'common.loading': 'loading …',
  'common.words': 'words',
  'common.sections': 'sections',
  'common.characters': 'characters',
  'common.closeMessage': 'Dismiss message',

  'notes.editableHint':
    'Notes can be edited. Citations point to original text; they do not independently verify the note’s claims or AI origin.',
  'notes.sourceMissing': 'Original source deleted. Saved evidence excerpt:',
  'demo.singleNotebook':
    'The browser demo contains one example notebook. Full notebook management requires a backend connection.',
  'login.username': 'Username',
  'login.password': 'Password',
  'login.submit': 'Sign in',
  'login.failed': 'Sign-in failed.',
  'login.localTitle': 'Local access',
  'login.localBody':
    'Default {creds}. This access is meant for running on your own machine — change it before exposing the service to a network.',
  'login.backend': 'Backend: {url}',
  'login.demo': 'Demo · runs without a server in this browser',

  'header.chooseNotebook': 'Choose notebook',
  'header.share': 'Share',
  'header.noModel': 'no model connected',
  'header.externalApiBlocked': 'external API blocked',

  'notebook.new.title': 'New notebook',
  'notebook.new.description':
    'A notebook is a self-contained set of sources. It never reads the sources of another notebook.',
  'notebook.new.titleLabel': 'Title',
  'notebook.new.placeholder': 'e.g. Probability seminar',
  'notebook.new.submit': 'Create',
  'notebook.rename': 'Rename',
  'notebook.delete.title': 'Delete notebook',
  'notebook.delete.body': 'Delete “{title}” with all its sources and notes? This cannot be undone.',
  'notebook.delete.confirm': 'Delete notebook',

  'sources.title': 'Sources',
  'sources.selectedOf': '{selected} of {total} selected',
  'sources.add': 'Add',
  'sources.empty.title': 'No source yet',
  'sources.empty.body':
    'Paste text, pick a .txt or .md file, or enter a URL. Without a source this notebook answers nothing.',
  'sources.loading': 'Loading sources …',
  'sources.considerForQuestions': 'Include {title} in questions',
  'sources.deleteTitle': 'Delete {title}',
  'sources.deselected': 'Excluded',
  'sources.hits': '{count} hits',
  'sources.kind.text': 'Text',
  'sources.kind.markdown': 'Markdown',
  'sources.kind.url': 'URL',
  'sources.kind.pdf': 'PDF',

  'addSource.title': 'Add source',
  'addSource.description':
    'The original text is stored unchanged — every citation later points to character positions in exactly this text.',
  'addSource.tab.text': 'Text',
  'addSource.tab.file': 'File',
  'addSource.tab.url': 'URL',
  'addSource.titleLabel': 'Title',
  'addSource.titlePlaceholder': 'e.g. company-register-extract.md',
  'addSource.titleHint': 'A title ending in .md is split as Markdown.',
  'addSource.fileLabel': 'Choose file (.txt or .md)',
  'addSource.textLabel': 'Text',
  'addSource.textPlaceholder': 'Paste text here …',
  'addSource.urlLabel': 'URL (https://…)',
  'addSource.urlPlaceholder': 'https://example.org/regulations',
  'addSource.urlHint':
    'Web page or text/JSON endpoint. Scripts, navigation and footers are removed; the extracted text is stored.',
  'addSource.submit': 'Create source',
  'addSource.fetching': 'Fetching URL …',
  'addSource.emptyError': 'A source needs some text.',
  'addSource.urlError': 'Please enter a full address starting with https://.',
  'addSource.genericError': 'The source could not be created.',
  'addSource.added': '“{title}” added ({count} sections).',
  'addSource.corsError':
    'This address does not allow fetching directly from the browser (CORS). With a backend the server fetches the page; in the demo this only works for sites that permit it.',

  'chat.emptyTitle': 'Ask a question',
  'chat.emptyBody':
    'Answers come exclusively from the sources selected on the left. Every statement carries a citation that points to the passage in the original.',
  'chat.tryOne': 'Try one:',
  'chat.example1': 'Who represents Everlast Consulting GmbH according to its legal notice?',
  'chat.example2': 'What registry details appear in the legal notice?',
  'chat.example3': 'Whom does the Everlast website name as founders?',
  'chat.searching': 'Searching {count} {noun} …',
  'chat.sourceOne': 'source',
  'chat.sourceMany': 'sources',
  'chat.considered': '{count} sources considered',
  'chat.inputLabel': 'Question to the selected sources',
  'chat.inputPlaceholder': 'Ask the selected sources …',
  'chat.send': 'Ask',
  'chat.hint': 'Enter sends, Shift+Enter inserts a line break.',
  'chat.openRouterPrivacy':
    'OpenRouter Free: your question and selected excerpts go to an external model provider. Use only public, non-sensitive test data.',
  'chat.noSourceTitle': 'No source selected',
  'chat.noSourceBody':
    'Select at least one source on the left. Without a source there is no answer.',
  'chat.errorTitle': 'The question could not be answered',
  'chat.modelBlockedTitle': 'AI requests temporarily blocked',
  'chat.modelBlockedBody':
    'OpenCode rejected external requests to the free MiMo model. You can still use sources and notes; AI answers are currently unavailable.',
  'chat.simulatedTitle': 'Simulated answer — no model connected',
  'chat.simulatedBody':
    'No language model is connected. The passages that were found are shown; nothing was written.',
  'chat.ungroundedTitle': 'Not supported by the sources',
  'chat.ungroundedBody': 'The selected sources do not cover this question.',
  'chat.dropped':
    '{count} citations placed by the model pointed to no retrieved passage and were removed.',
  'chat.unsupported': '{count} sentences without a citation (dotted underline).',
  'chat.unsupportedTitle': 'This sentence carries no citation from the sources.',
  'chat.saveNote': 'Save as note',
  'chat.wholeSection': 'whole section',
  'chat.askFailed': 'The question could not be sent.',

  'citation.label': 'Citation {marker}: {source}',
  'citation.range': 'Characters {start}–{end}',
  'citation.exact': 'quoted verbatim',
  'citation.chunk': 'whole section (no verbatim quote found)',
  'citation.step': 'Citation {index} of {total}',
  'citation.prev': 'Previous citation',
  'citation.next': 'Next citation',

  'viewer.emptyTitle': 'No source open',
  'viewer.emptyBody':
    'Pick a source on the left or click a citation in an answer to see the original passage.',

  'notes.title': 'Notes',
  'notes.source': 'Source',
  'notes.empty.title': 'No note yet',
  'notes.empty.body':
    'Save an answer as a note. Its citations are frozen and stay verifiable even as the chat moves on.',
  'notes.question': 'Question: {question}',
  'notes.editTitle': 'Edit note',
  'notes.deleteTitle': 'Delete note',
  'notes.saved': 'Saved as note — with all citations.',
  'notes.fieldTitle': 'Title',
  'notes.fieldBody': 'Text',

  'tabs.area': 'Area',
  'tabs.right': 'Right column',
  'tabs.sources': 'Sources',
  'tabs.chat': 'Chat',
  'tabs.notes': 'Notes',
  'tabs.source': 'Source',

  'settings.title': 'Settings',
  'settings.description': 'Changes apply immediately and are kept on this device.',
  'settings.language': 'Language',
  'settings.design': 'Design',
  'settings.appearance': 'Appearance',
  'settings.mode.system': 'System',
  'settings.mode.light': 'Light',
  'settings.mode.dark': 'Dark',
  'settings.data': 'Data',
  'settings.demoData':
    'This demo runs without a server. Notebooks, sources and notes live in this browser’s storage and survive a reload. No language model is connected; answers show the passages found.',
  'settings.backend': 'Backend',
  'settings.backendHint': 'Set at build time via {variable}.',
  'settings.showTour': 'Show introduction again',
  'settings.privacy': 'Privacy',
  'settings.rememberSettings': 'Remember settings on this device',
  'settings.privacyHint':
    'No cookies, no tracking. Unchecked, language, design and column widths last only until the tab is closed.',
  'settings.privacyDecided': 'Decided on {date}.',
  'settings.privacyUndecided': 'Not decided yet.',

  'consent.title': 'Storage on this device',
  'consent.body':
    'This application sets no cookies and does no tracking. Online notebooks, sources and notes are stored on the server. Here you decide whether local settings remain beyond this session.',
  'consent.necessary.title': 'Necessary',
  'consent.necessary.body':
    'Sign-in session; in the demo also notebooks, sources and notes. The application does not work without them.',
  'consent.settings.title': 'Remember settings',
  'consent.settings.body':
    'Language, design, appearance, column widths and whether you have seen the introduction. Without consent they last only until the tab is closed.',
  'consent.always': 'always on',
  'consent.acceptAll': 'Accept all',
  'consent.necessaryOnly': 'Necessary only',
  'consent.save': 'Save selection',
  'consent.customize': 'Customise selection',
  'consent.less': 'Show less',

  'login.wait': 'Sign-in available again in {seconds} seconds.',
  'login.cooldownHint': 'After three failed sign-ins, an increasing cooldown applies.',
  'login.demoOpen': 'Open demo',
  'login.demoWarning':
    'Unprotected browser demo. No real authentication or AI connection. Use sample data only.',
  'login.back': 'Back to home',
  'login.protected': 'Protected workspace',
  'addSource.tooLarge': 'Maximum 10 MiB (10,485,760 bytes) per source in this test environment.',
  'addSource.invalidFile': 'Only UTF-8 text files in .txt or .md format are supported.',
  'addSource.unsupportedUrl':
    'Website import is not available in this release. Import text or Markdown.',
  'addSource.fileHint': '.txt or .md · UTF-8 · maximum 10 MiB per source',
  'design.everlast.label': 'Everlast · Research',
  'design.everlast.hint':
    'Independent interpretation with black, lemon yellow and clear typography.',
  'design.eigen.label': 'Paper and ink',
  'design.eigen.hint': 'Own design: warm surfaces, serif for reading text, brown for citations.',
  'design.uni-freiburg.label': 'University of Freiburg',
  'design.uni-freiburg.hint':
    'The university’s corporate design. House typeface only with a licence, otherwise Arial.',
  'design.huskynarr.label': 'huskynarr',
  'design.huskynarr.hint':
    'Approximation of huskynarr.de — only the base colour #0c0a09 is documented.',

  'tour.step': 'Step {index} of {total}',
  'tour.language.title': 'Welcome',
  'tour.language.body': 'Which language should the interface use?',
  'tour.design.title': 'Choose a design',
  'tour.design.body':
    'Three designs, changeable any time in Settings. The choice applies immediately.',
  'tour.how.title': 'How it works',
  'tour.how.1':
    'Add sources — text, file or URL. Select on the left what counts for the next question.',
  'tour.how.2': 'Ask a question. The answer is built only from the selected sources.',
  'tour.how.3':
    'Click a citation: the source opens on the right and highlights exactly the supporting characters.',
  'tour.how.4': 'Save as a note — the citations stay frozen and verifiable.',
  'tour.demoNote':
    'This demo runs without a server: data stays in your browser, and no language model is connected.',
  'tour.start': 'Get started',
  'tour.skip': 'Skip',

  'share.title': 'Share',
  'share.notebook': 'Whole notebook',
  'share.answer': 'This answer',
  'share.markdown': 'Markdown (.md)',
  'share.pdf': 'PDF (print view)',
  'share.docx': 'Word (.docx)',
  'share.image': 'Image (.png)',
  'share.copyLink': 'Copy link',
  'share.linkCopied': 'Link copied.',
  'share.linkDemo':
    'In the demo, data lives only in this browser — for others the link opens an empty sample notebook.',
  'share.exported': '{format} exported.',
  'share.failed': 'Export failed.',
  'share.pdfHint': 'Choose “Save as PDF” in the print dialog.',
  'share.answerHeading': 'Answer',
  'share.questionHeading': 'Question',
  'share.citationsHeading': 'Citations',
  'share.exportedOn': 'Exported on {date}',
  'share.noNotes': 'No notes.',

  'error.sessionExpired': 'Your session has expired. Please sign in again.',
  'error.loadNotebooks': 'The notebooks could not be loaded.',
  'error.loadNotebook': 'The notebook could not be loaded.',
  'error.loadSource': 'The source could not be loaded.',
  'error.saveSelection': 'The selection could not be saved.',
  'error.saveNote': 'The note could not be saved.',
  'error.updateNote': 'The note could not be changed.',
  'error.deleteNote': 'The note could not be deleted.',
  'error.deleteSource': 'The source could not be deleted.',
  'error.createNotebook': 'The notebook could not be created.',
  'error.export': 'Export failed.',
  'error.network': 'The backend at {url} is not reachable.',
  'error.contract': 'The backend’s response does not match the expected format.',
  'error.status': 'Error {status}.',
  'error.sourceDeleted': '“{title}” deleted.',

  'answer.noSources':
    'No source is selected. Select at least one source on the left so the question can be answered from the sources.',
  'answer.noMatch':
    'The selected sources contain no passage for this question. Either they do not cover the topic, or the question uses different terms than the texts.',
  'answer.noTerms': 'The question contains no searchable terms.',
  'answer.stubIntro':
    'No language model is connected. This answer is therefore not written out; it only shows which passages were found for the question:',
  'answer.stubItem': 'Section [{marker}] from {source}',
  'answer.stubOutro': 'Click a citation to jump to the passage in the original text.',
};
