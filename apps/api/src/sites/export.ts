import type { Notebook } from '@notebook/shared';
import { notesList, sourceList, type SiteEnv } from './db.ts';
import { sourceText } from './sources.ts';

export async function exportNotebook(
  env: SiteEnv,
  owner: string,
  book: Notebook,
): Promise<Response> {
  const sources = await sourceList(env.DB, owner, book.id);
  const notes = await notesList(env.DB, owner, book.id);
  async function* lines(): AsyncGenerator<string> {
    yield `# ${book.title}\n\nExportiert am ${new Date().toISOString().slice(0, 10)} · ` +
      `${sources.length} Quellen · ${notes.length} Notizen\n\n## Notizen\n\n` +
      '_Notizen sind bearbeitbar. Belege prüfen Textstellen, nicht den Wahrheitsgehalt._\n\n';
    if (notes.length === 0) yield '_Keine Notizen._\n\n';
    for (const note of notes) {
      yield `### ${note.title}\n\n${note.question ? `**Frage:** ${note.question}\n\n` : ''}${note.body}\n\n`;
      if (note.citations.length) {
        yield '**Belege:**\n\n';
        for (const c of note.citations) {
          const where = c.headingPath ? ` · ${c.headingPath}` : '';
          const exact = c.precision === 'exact' ? '' : ' (ganzer Abschnitt)';
          const missing = sources.some((s) => s.id === c.sourceId)
            ? ''
            : ' · Originalquelle gelöscht';
          yield `- [${c.marker}] ${c.sourceTitle}${where} · Zeichen ` +
            `${c.startOffset}–${c.endOffset}${exact}${missing}\n  > ` +
            `${c.excerpt.replace(/\n+/g, ' ')}\n`;
        }
        yield '\n';
      }
    }
    yield '## Quellen\n\n';
    for (const source of sources) {
      const content = await sourceText(env, owner, source.id);
      if (content === null) throw new Error('Eine Quelle wurde während des Exports gelöscht.');
      yield `### ${source.title}\n\n_${source.kind} · ${source.wordCount} Wörter · ` +
        `${source.chunkCount} Abschnitte_\n\n`;
      for (let start = 0; start < content.length;) {
        let end = Math.min(start + 16_384, content.length);
        if (end < content.length && /[\uD800-\uDBFF]/.test(content[end - 1] ?? '')) end--;
        yield content.slice(start, end);
        start = end;
      }
      yield '\n\n';
    }
  }
  const iterator = lines(),
    encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const next = await iterator.next();
        if (next.done) controller.close();
        else controller.enqueue(encoder.encode(next.value));
      } catch (error) {
        controller.error(error);
      }
    },
    async cancel() {
      await iterator.return('');
    },
  });
  const stem =
    book.title
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'notebook';
  const fallback = stem.replace(/[^a-z0-9-]/g, '') || 'notebook';
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fallback}.md"; filename*=UTF-8''${encodeURIComponent(stem)}.md`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
