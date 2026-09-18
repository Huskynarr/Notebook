import {
  EXAMPLE_NOTEBOOK_TITLE,
  EXAMPLE_SOURCES,
  chunkText,
  countWords,
  type AskResponse,
  type Chunk,
  type Citation,
  type CreateSourceRequest,
  type HealthResponse,
  type Language,
  type Note,
  type Notebook,
  type RetrievedChunk,
  type Source,
  type SourceContent,
} from '@notebook/shared';
import type { NotebookApi } from '../lib/api.ts';
import { uebersetzen, type Uebersetzer } from '../i18n/index.ts';

/**
 * Datenquelle für die Demo ohne Backend (GitHub Pages).
 *
 * Die Anwendung läuft damit vollständig im Browser und verhält sich wie der
 * Server mit `LLM_PROVIDER=stub`: Anmeldung mit dem festen Zugang, Notebooks,
 * Quellen, Notizen — alles echt und im `localStorage` gespeichert. Quellen
 * werden mit **demselben** `chunkText` zerlegt wie auf dem Server; die Marker
 * zeigen auf tatsächlich gefundene Abschnitte und die Offsets treffen die
 * Stelle im Originaltext.
 *
 * Was fehlt, ist genau eines: ein Sprachmodell. Im Frontend darf keines
 * konfiguriert sein (AGENTS.md Regel 4). Jede Antwort trägt deshalb
 * `simulated: true`, und das UI kennzeichnet sie — nicht mehr und nicht weniger
 * als beim Server ohne Modell (Regel 5).
 *
 * Adressen holt die Demo direkt aus dem Browser. Die meisten Seiten erlauben
 * das nicht (CORS); dann steht ein erklärter Fehler da, kein stilles Scheitern.
 */

interface Eintrag {
  source: Source;
  content: string;
  chunks: Chunk[];
}

let zaehler = 0;
function id(praefix: string): string {
  zaehler += 1;
  return `${praefix}-${zaehler}-${Math.random().toString(36).slice(2, 8)}`;
}

const STOPWORDS = new Set([
  'aber',
  'alle',
  'als',
  'auch',
  'auf',
  'aus',
  'bei',
  'das',
  'dem',
  'den',
  'der',
  'des',
  'die',
  'ein',
  'eine',
  'einem',
  'einen',
  'einer',
  'für',
  'hat',
  'ich',
  'ist',
  'kann',
  'man',
  'mit',
  'nach',
  'nicht',
  'nur',
  'oder',
  'sich',
  'sind',
  'und',
  'von',
  'vor',
  'was',
  'wenn',
  'wer',
  'wie',
  'wird',
  'zum',
  'zur',
  'the',
  'and',
  'for',
  'are',
  'with',
  'what',
  'when',
  'which',
  'from',
  'that',
  'this',
  'does',
  'how',
  'long',
]);

/** Bewusst schlicht: zählt, wie viele Suchbegriffe als Präfix im Abschnitt
 *  vorkommen. Der Server rechnet BM25 über FTS5; das hier ist eine Demo und
 *  gibt sich nicht als dasselbe aus. */
function bewerten(text: string, begriffe: readonly string[]): number {
  const klein = text.toLowerCase();
  let treffer = 0;
  for (const begriff of begriffe) {
    if (klein.includes(begriff)) treffer += begriff.length >= 6 ? 2 : 1;
  }
  return treffer;
}

function begriffeAus(frage: string): string[] {
  return [
    ...new Set(
      frage
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter((t) => t.length >= 4 && !STOPWORDS.has(t)),
    ),
  ];
}

const SPEICHER_SCHLUESSEL = 'notebook.demo.v1';

/** Fester Zugang wie beim Server (D-003). Hier im Klartext, weil es in einer
 *  Demo ohne Server nichts zu schützen gibt - die Prüfung ist Teil des
 *  Bedienablaufs, nicht der Sicherheit. */
const ZUGANG = { username: 'admin', password: 'admin' };

interface Gespeichert {
  titel: string;
  eintraege: Eintrag[];
  notizen: Note[];
}

/** Sehr einfache Extraktion für den Browser: Skripte/Stile weg, Überschriften
 *  als Markdown, Rest als Text. Der Server macht es gründlicher; hier reicht
 *  es für Seiten, die den Abruf überhaupt erlauben. */
function textAusHtml(html: string): { title: string; content: string } {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  for (const sel of [
    'script',
    'style',
    'noscript',
    'template',
    'svg',
    'iframe',
    'nav',
    'header',
    'footer',
    'aside',
    'form',
  ]) {
    for (const el of doc.querySelectorAll(sel)) el.remove();
  }
  for (const h of doc.querySelectorAll('h1,h2,h3,h4,h5,h6')) {
    const ebene = Number(h.tagName.slice(1));
    h.replaceWith(doc.createTextNode(`\n\n${'#'.repeat(ebene)} ${h.textContent.trim()}\n\n`));
  }
  for (const li of doc.querySelectorAll('li')) li.prepend(doc.createTextNode('\n- '));
  for (const block of doc.querySelectorAll('p,div,section,article,blockquote,pre,tr,ul,ol,br'))
    block.append(doc.createTextNode('\n\n'));
  const content = doc.body.textContent
    .split('\n')
    .map((z) => z.replace(/[ \t\u00a0]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { title: doc.title.trim(), content };
}

export class DemoClient implements NotebookApi {
  private readonly notebookId = 'demo';
  private eintraege: Eintrag[] = [];
  private notizen: Note[] = [];
  private titel = EXAMPLE_NOTEBOOK_TITLE;
  private readonly speicher: Storage | null;
  private readonly t: Uebersetzer;

  constructor(speicher: Storage | null = fensterSpeicher(), t?: Uebersetzer) {
    this.speicher = speicher;
    this.t = t ?? ((key, params) => uebersetzen('de', key, params));
    if (!this.laden()) {
      for (const quelle of EXAMPLE_SOURCES) {
        this.anlegen(quelle.title, quelle.kind, quelle.content, null);
      }
      this.sichern();
    }
  }

  private laden(): boolean {
    try {
      const roh = this.speicher?.getItem(SPEICHER_SCHLUESSEL);
      if (roh === null || roh === undefined) return false;
      const daten = JSON.parse(roh) as Partial<Gespeichert>;
      if (!Array.isArray(daten.eintraege) || !Array.isArray(daten.notizen)) return false;
      this.eintraege = daten.eintraege;
      this.notizen = daten.notizen;
      this.titel = typeof daten.titel === 'string' ? daten.titel : EXAMPLE_NOTEBOOK_TITLE;
      return true;
    } catch {
      return false;
    }
  }

  private sichern(): void {
    try {
      const daten: Gespeichert = {
        titel: this.titel,
        eintraege: this.eintraege,
        notizen: this.notizen,
      };
      this.speicher?.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(daten));
    } catch {
      // Voller oder gesperrter Speicher: die Sitzung läuft weiter, nur ohne
      // Dauerhaftigkeit. Ein Fehler hier darf keine Bedienung abbrechen.
    }
  }

  private anlegen(
    title: string,
    kind: 'text' | 'markdown' | 'url',
    content: string,
    origin: string | null,
  ): Source {
    const sourceId = id('quelle');
    const chunks: Chunk[] = chunkText(content).map((c) => ({
      id: id('abschnitt'),
      sourceId,
      ordinal: c.ordinal,
      text: c.text,
      startOffset: c.startOffset,
      endOffset: c.endOffset,
      headingPath: c.headingPath,
    }));
    const source: Source = {
      id: sourceId,
      notebookId: this.notebookId,
      title,
      kind,
      wordCount: countWords(content),
      chunkCount: chunks.length,
      origin,
      selected: true,
      createdAt: new Date().toISOString(),
    };
    this.eintraege.push({ source, content, chunks });
    this.sichern();
    return source;
  }

  private notebook(): Notebook {
    return {
      id: this.notebookId,
      title: this.titel,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sourceCount: this.eintraege.length,
      noteCount: this.notizen.length,
    };
  }

  health(): Promise<HealthResponse> {
    return Promise.resolve({
      status: 'ok',
      version: 'demo',
      llm: { configured: false, provider: 'demo', model: this.t('header.noModel') },
    });
  }

  login(username: string, password: string): Promise<{ token: string; expiresAt: string }> {
    if (username !== ZUGANG.username || password !== ZUGANG.password) {
      return Promise.reject(new Error(this.t('login.failed')));
    }
    return Promise.resolve({
      token: 'demo',
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    });
  }

  listNotebooks(): Promise<Notebook[]> {
    return Promise.resolve([this.notebook()]);
  }

  createNotebook(title: string): Promise<Notebook> {
    this.titel = title;
    this.sichern();
    return Promise.resolve(this.notebook());
  }

  renameNotebook(_id: string, title: string): Promise<Notebook> {
    this.titel = title;
    this.sichern();
    return Promise.resolve(this.notebook());
  }

  deleteNotebook(_id: string): Promise<void> {
    return Promise.resolve();
  }

  exportNotebook(_id: string): Promise<string> {
    const zeilen = [`# ${this.titel}`, ''];
    for (const notiz of this.notizen) zeilen.push(`## ${notiz.title}`, '', notiz.body, '');
    for (const e of this.eintraege) zeilen.push(`## ${e.source.title}`, '', e.content, '');
    return Promise.resolve(zeilen.join('\n'));
  }

  listSources(_notebookId: string): Promise<Source[]> {
    return Promise.resolve(this.eintraege.map((e) => e.source));
  }

  async createSource(_notebookId: string, input: CreateSourceRequest): Promise<Source> {
    if (input.kind === 'url') {
      let antwort: Response;
      try {
        antwort = await fetch(input.url, {
          headers: { accept: 'text/html, text/plain, application/json' },
        });
      } catch {
        // Ein TypeError beim fetch ist im Browser fast immer CORS oder Netz -
        // der Browser verrät den Grund absichtlich nicht.
        throw new Error(this.t('addSource.corsError'));
      }
      if (!antwort.ok) throw new Error(this.t('error.status', { status: antwort.status }));
      const typ = antwort.headers.get('content-type') ?? '';
      const text = await antwort.text();
      let title = input.title ?? new URL(input.url).hostname;
      let content = text.trim();
      if (typ.includes('html') || /^\s*<(!doctype|html)/i.test(text)) {
        const extrahiert = textAusHtml(text);
        content = extrahiert.content;
        if (input.title === undefined && extrahiert.title !== '') title = extrahiert.title;
      } else if (typ.includes('json')) {
        try {
          content = JSON.stringify(JSON.parse(text) as unknown, null, 2);
        } catch {
          // dann bleibt der Rohtext
        }
      }
      if (content === '') throw new Error(this.t('addSource.emptyError'));
      const source = this.anlegen(title, 'url', content, input.url);
      if (source.chunkCount === 0) {
        this.eintraege.pop();
        throw new Error(this.t('addSource.emptyError'));
      }
      return source;
    }

    const source = this.anlegen(input.title, input.kind, input.content, null);
    if (source.chunkCount === 0) {
      this.eintraege.pop();
      throw new Error(this.t('addSource.emptyError'));
    }
    return source;
  }

  updateSource(sourceId: string, patch: { selected?: boolean; title?: string }): Promise<Source> {
    const eintrag = this.eintraege.find((e) => e.source.id === sourceId);
    if (eintrag === undefined) return Promise.reject(new Error(this.t('error.loadSource')));
    eintrag.source = {
      ...eintrag.source,
      selected: patch.selected ?? eintrag.source.selected,
      title: patch.title ?? eintrag.source.title,
    };
    this.sichern();
    return Promise.resolve(eintrag.source);
  }

  deleteSource(sourceId: string): Promise<void> {
    const stelle = this.eintraege.findIndex((e) => e.source.id === sourceId);
    if (stelle >= 0) this.eintraege.splice(stelle, 1);
    this.sichern();
    return Promise.resolve();
  }

  getSource(sourceId: string): Promise<SourceContent> {
    const eintrag = this.eintraege.find((e) => e.source.id === sourceId);
    if (eintrag === undefined) return Promise.reject(new Error(this.t('error.loadSource')));
    return Promise.resolve({ ...eintrag.source, content: eintrag.content });
  }

  ask(
    _notebookId: string,
    question: string,
    sourceIds: string[],
    language: Language,
  ): Promise<AskResponse> {
    const beginn = Date.now();
    const t: Uebersetzer = (key, params) => uebersetzen(language, key, params);
    const leer = (antwort: string): AskResponse => ({
      answer: antwort,
      citations: [],
      retrieved: [],
      grounded: false,
      unsupportedSentenceCount: 0,
      droppedMarkers: [],
      simulated: true,
      model: `demo (${t('header.noModel')})`,
      elapsedMs: Date.now() - beginn,
    });

    if (sourceIds.length === 0) return Promise.resolve(leer(t('answer.noSources')));

    const begriffe = begriffeAus(question);
    if (begriffe.length === 0) return Promise.resolve(leer(t('answer.noTerms')));

    const treffer: RetrievedChunk[] = [];
    for (const eintrag of this.eintraege) {
      if (!sourceIds.includes(eintrag.source.id)) continue;
      for (const chunk of eintrag.chunks) {
        const score = bewerten(chunk.text, begriffe);
        if (score > 0) treffer.push({ ...chunk, sourceTitle: eintrag.source.title, score });
      }
    }
    treffer.sort((a, b) => b.score - a.score);
    const abgerufen = treffer.slice(0, 8);
    if (abgerufen.length === 0) return Promise.resolve(leer(t('answer.noMatch')));

    const citations: Citation[] = abgerufen.slice(0, 3).map((chunk, index) => ({
      marker: index + 1,
      sourceId: chunk.sourceId,
      sourceTitle: chunk.sourceTitle,
      chunkId: chunk.id,
      headingPath: chunk.headingPath,
      startOffset: chunk.startOffset,
      endOffset: chunk.endOffset,
      excerpt: chunk.text,
      precision: 'chunk',
    }));

    const liste = citations
      .map(
        (c) =>
          `- ${t('answer.stubItem', { marker: c.marker, source: c.sourceTitle })}${c.headingPath === '' ? '' : ` · ${c.headingPath}`}`,
      )
      .join('\n');

    return Promise.resolve({
      answer: `${t('answer.stubIntro')}\n\n${liste}\n\n${t('answer.stubOutro')}`,
      citations,
      retrieved: abgerufen,
      grounded: false,
      unsupportedSentenceCount: 0,
      droppedMarkers: [],
      simulated: true,
      model: `demo (${t('header.noModel')})`,
      elapsedMs: Date.now() - beginn,
    });
  }

  listNotes(_notebookId: string): Promise<Note[]> {
    return Promise.resolve(this.notizen);
  }

  createNote(
    _notebookId: string,
    input: { title: string; body: string; citations: Citation[]; question: string },
  ): Promise<Note> {
    const notiz: Note = {
      id: id('notiz'),
      notebookId: this.notebookId,
      title: input.title,
      body: input.body,
      citations: input.citations,
      question: input.question,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.notizen = [notiz, ...this.notizen];
    this.sichern();
    return Promise.resolve(notiz);
  }

  updateNote(noteId: string, patch: { title?: string; body?: string }): Promise<Note> {
    const notiz = this.notizen.find((n) => n.id === noteId);
    if (notiz === undefined) return Promise.reject(new Error(this.t('error.updateNote')));
    const neu: Note = {
      ...notiz,
      title: patch.title ?? notiz.title,
      body: patch.body ?? notiz.body,
      updatedAt: new Date().toISOString(),
    };
    this.notizen = this.notizen.map((n) => (n.id === noteId ? neu : n));
    this.sichern();
    return Promise.resolve(neu);
  }

  deleteNote(noteId: string): Promise<void> {
    this.notizen = this.notizen.filter((n) => n.id !== noteId);
    this.sichern();
    return Promise.resolve();
  }
}

function fensterSpeicher(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}
