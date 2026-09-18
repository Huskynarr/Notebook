import { describe, expect, it } from 'vitest';
import { DemoClient } from './demoClient.ts';

/** Minimaler Speicher mit der Schnittstelle von localStorage. Ein echter steht
 *  in vitest ohne Browser nicht zur Verfuegung; gebraucht wird nur, dass zwei
 *  Clients nacheinander dasselbe Objekt sehen. */
function speicher(): Storage {
  const daten = new Map<string, string>();
  return {
    get length() {
      return daten.size;
    },
    clear: () => {
      daten.clear();
    },
    getItem: (k) => daten.get(k) ?? null,
    key: (i) => [...daten.keys()][i] ?? null,
    removeItem: (k) => {
      daten.delete(k);
    },
    setItem: (k, v) => {
      daten.set(k, v);
    },
  };
}

describe('DemoClient', () => {
  it('prueft den festen Zugang statt jeden hereinzulassen', async () => {
    const client = new DemoClient(speicher());
    await expect(client.login('admin', 'falsch')).rejects.toThrow(/fehlgeschlagen/);
    await expect(client.login('root', 'admin')).rejects.toThrow(/fehlgeschlagen/);
    await expect(client.login('admin', 'admin')).resolves.toHaveProperty('token');
  });

  it('startet mit dem Beispiel-Notebook', async () => {
    const client = new DemoClient(speicher());
    const [notebook] = await client.listNotebooks();
    expect(notebook?.sourceCount).toBe(2);
  });

  it('behaelt Quellen, Auswahl und Notizen über einen Neustart hinweg', async () => {
    const gemeinsam = speicher();
    const erster = new DemoClient(gemeinsam);
    const [notebook] = await erster.listNotebooks();
    const quelle = await erster.createSource(notebook!.id, {
      title: 'eigene.md',
      kind: 'markdown',
      content: '# Eigenes\n\nDie Rückmeldefrist endet am 15. Februar.',
    });
    await erster.updateSource(quelle.id, { selected: false });
    await erster.createNote(notebook!.id, {
      title: 'Merken',
      body: 'Frist im Februar.',
      citations: [],
      question: 'Wann?',
    });

    // Zweiter Client = neu geladene Seite mit demselben Speicher.
    const zweiter = new DemoClient(gemeinsam);
    const quellen = await zweiter.listSources(notebook!.id);
    expect(quellen.map((q) => q.title)).toContain('eigene.md');
    expect(quellen.find((q) => q.title === 'eigene.md')?.selected).toBe(false);
    expect((await zweiter.listNotes(notebook!.id)).map((n) => n.title)).toEqual(['Merken']);
  });

  it('findet zu einer Frage die Stelle im Original und belegt sie mit echten Offsets', async () => {
    const client = new DemoClient(speicher());
    const [notebook] = await client.listNotebooks();
    const quellen = await client.listSources(notebook!.id);
    const antwort = await client.ask(
      notebook!.id,
      'Wie lange ist die Widerspruchsfrist?',
      quellen.map((q) => q.id),
      'de',
    );
    expect(antwort.simulated).toBe(true);
    expect(antwort.citations.length).toBeGreaterThan(0);
    for (const beleg of antwort.citations) {
      const quelle = await client.getSource(beleg.sourceId);
      expect(quelle.content.slice(beleg.startOffset, beleg.endOffset)).toBe(beleg.excerpt);
    }
  });

  it('kommt ohne Speicher aus', async () => {
    const client = new DemoClient(null);
    await expect(client.listNotebooks()).resolves.toHaveLength(1);
  });
});
