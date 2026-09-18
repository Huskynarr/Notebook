import {
  EXAMPLE_NOTEBOOK_TITLE,
  EXAMPLE_SOURCES,
  chunkText,
  countWords,
  type AskResponse,
  type Chunk,
  type Citation,
  type HealthResponse,
  type Note,
  type Notebook,
  type RetrievedChunk,
  type Source,
  type SourceContent,
} from '@notebook/shared';
import type { NotebookApi } from '../lib/api.ts';

/**
 * Datenquelle für die Ausgabe ohne Backend (GitHub Pages).
 *
 * Sie ist **kein** Ersatz für den Server und tut bewusst nicht so. Was sie
 * leistet: Quellen verwalten, sie mit **demselben** Chunking wie der Server
 * zerlegen (`chunkText` aus `@notebook/shared`) und zu einer Frage die
 * passenden Abschnitte finden. Die Belegkette ist darin echt — die Marker
 * zeigen auf tatsächlich gefundene Abschnitte, und die Zeichen-Offsets treffen
 * die Stelle im Originaltext.
 *
 * Was sie **nicht** leistet: eine Antwort formulieren. Es ist kein Modell
 * verbunden und im Frontend darf keines konfiguriert sein (AGENTS.md Regel 4).
 * Jede Antwort trägt deshalb `simulated: true`, und das UI zeigt dafür ein
 * dauerhaftes Banner (Regel 5).
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
  'fuer',
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
]);

/** Bewusst schlicht: zaehlt, wie viele Suchbegriffe als Praefix im Abschnitt
 *  vorkommen. Der Server rechnet BM25 ueber FTS5; das hier ist eine Vorschau
 *  und gibt sich nicht als dasselbe aus. */
function bewerten(text: string, begriffe: readonly string[]): number {
  const klein = text.toLowerCase();
  let treffer = 0;
  for (const begriff of begriffe) {
    const stelle = klein.indexOf(begriff);
    if (stelle >= 0) treffer += begriff.length >= 6 ? 2 : 1;
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

export class PreviewClient implements NotebookApi {
  private readonly notebookId = 'vorschau';
  private readonly eintraege: Eintrag[] = [];
  private notizen: Note[] = [];
  private titel = EXAMPLE_NOTEBOOK_TITLE;

  constructor() {
    for (const quelle of EXAMPLE_SOURCES) {
      this.anlegen(quelle.title, quelle.kind, quelle.content);
    }
  }

  private anlegen(title: string, kind: 'text' | 'markdown', content: string): Source {
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
      selected: true,
      createdAt: new Date().toISOString(),
    };
    this.eintraege.push({ source, content, chunks });
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
      version: 'Vorschau',
      llm: { configured: false, provider: 'vorschau', model: 'kein Modell verbunden' },
    });
  }

  login(): Promise<{ token: string; expiresAt: string }> {
    return Promise.resolve({
      token: 'vorschau',
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    });
  }

  listNotebooks(): Promise<Notebook[]> {
    return Promise.resolve([this.notebook()]);
  }

  createNotebook(title: string): Promise<Notebook> {
    this.titel = title;
    return Promise.resolve(this.notebook());
  }

  renameNotebook(_id: string, title: string): Promise<Notebook> {
    this.titel = title;
    return Promise.resolve(this.notebook());
  }

  deleteNotebook(): Promise<void> {
    return Promise.resolve();
  }

  exportNotebook(): Promise<string> {
    const zeilen = [`# ${this.titel}`, '', '_Export aus der Vorschau ohne Backend._', ''];
    for (const notiz of this.notizen) zeilen.push(`## ${notiz.title}`, '', notiz.body, '');
    for (const e of this.eintraege) zeilen.push(`## ${e.source.title}`, '', e.content, '');
    return Promise.resolve(zeilen.join('\n'));
  }

  listSources(): Promise<Source[]> {
    return Promise.resolve(this.eintraege.map((e) => e.source));
  }

  createSource(
    _notebookId: string,
    input: { title: string; kind: 'text' | 'markdown'; content: string },
  ): Promise<Source> {
    const source = this.anlegen(input.title, input.kind, input.content);
    if (source.chunkCount === 0) {
      this.eintraege.pop();
      return Promise.reject(new Error('Aus dieser Quelle liess sich kein Abschnitt bilden.'));
    }
    return Promise.resolve(source);
  }

  updateSource(sourceId: string, patch: { selected?: boolean; title?: string }): Promise<Source> {
    const eintrag = this.eintraege.find((e) => e.source.id === sourceId);
    if (eintrag === undefined) return Promise.reject(new Error('Quelle nicht gefunden.'));
    eintrag.source = {
      ...eintrag.source,
      selected: patch.selected ?? eintrag.source.selected,
      title: patch.title ?? eintrag.source.title,
    };
    return Promise.resolve(eintrag.source);
  }

  deleteSource(sourceId: string): Promise<void> {
    const stelle = this.eintraege.findIndex((e) => e.source.id === sourceId);
    if (stelle >= 0) this.eintraege.splice(stelle, 1);
    return Promise.resolve();
  }

  getSource(sourceId: string): Promise<SourceContent> {
    const eintrag = this.eintraege.find((e) => e.source.id === sourceId);
    if (eintrag === undefined) return Promise.reject(new Error('Quelle nicht gefunden.'));
    return Promise.resolve({ ...eintrag.source, content: eintrag.content });
  }

  ask(_notebookId: string, question: string, sourceIds: string[]): Promise<AskResponse> {
    const beginn = Date.now();
    const leer = (antwort: string): AskResponse => ({
      answer: antwort,
      citations: [],
      retrieved: [],
      grounded: false,
      unsupportedSentenceCount: 0,
      droppedMarkers: [],
      simulated: true,
      model: 'Vorschau ohne Backend',
      elapsedMs: Date.now() - beginn,
    });

    if (sourceIds.length === 0) {
      return Promise.resolve(
        leer(
          'Es ist keine Quelle ausgewaehlt. Waehle links mindestens eine Quelle aus, damit die Frage aus den Quellen beantwortet werden kann.',
        ),
      );
    }

    const begriffe = begriffeAus(question);
    if (begriffe.length === 0)
      return Promise.resolve(leer('Die Frage enthält keine suchbaren Begriffe.'));

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

    if (abgerufen.length === 0) {
      return Promise.resolve(
        leer(
          'In den ausgewaehlten Quellen findet sich zu dieser Frage keine Textstelle. Moeglich ist, dass die Quellen das Thema nicht behandeln oder die Frage andere Begriffe verwendet als die Texte.',
        ),
      );
    }

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
          `- Abschnitt [${c.marker}] aus ${c.sourceTitle}${c.headingPath === '' ? '' : ` · ${c.headingPath}`}`,
      )
      .join('\n');

    return Promise.resolve({
      answer:
        'Dies ist eine Vorschau ohne Backend. Es ist kein Sprachmodell verbunden, deshalb wird hier nichts formuliert — gezeigt wird nur, welche Textstellen zu der Frage gefunden wurden:\n\n' +
        liste +
        '\n\nDie Belege sind echt: ein Klick springt zur Stelle im Originaltext.',
      citations,
      retrieved: abgerufen,
      grounded: false,
      unsupportedSentenceCount: 0,
      droppedMarkers: [],
      simulated: true,
      model: 'Vorschau ohne Backend',
      elapsedMs: Date.now() - beginn,
    });
  }

  listNotes(): Promise<Note[]> {
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
    return Promise.resolve(notiz);
  }

  updateNote(noteId: string, patch: { title?: string; body?: string }): Promise<Note> {
    const notiz = this.notizen.find((n) => n.id === noteId);
    if (notiz === undefined) return Promise.reject(new Error('Notiz nicht gefunden.'));
    const neu: Note = {
      ...notiz,
      title: patch.title ?? notiz.title,
      body: patch.body ?? notiz.body,
      updatedAt: new Date().toISOString(),
    };
    this.notizen = this.notizen.map((n) => (n.id === noteId ? neu : n));
    return Promise.resolve(neu);
  }

  deleteNote(noteId: string): Promise<void> {
    this.notizen = this.notizen.filter((n) => n.id !== noteId);
    return Promise.resolve();
  }
}
