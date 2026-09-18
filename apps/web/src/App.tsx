import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import type {
  Citation,
  HealthResponse,
  Note,
  Notebook,
  Source,
  SourceContent,
} from '@notebook/shared';
import { ApiClient, ApiRequestError } from './lib/api.ts';
import { API_BASE_URL } from './lib/config.ts';
import { readToken, writeToken } from './lib/session.ts';
import { ChatPanel, type Exchange } from './components/ChatPanel.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';
import { NotesPanel } from './components/NotesPanel.tsx';
import { SourceViewer } from './components/SourceViewer.tsx';
import { SourcesPanel } from './components/SourcesPanel.tsx';
import { Button } from './components/ui/Button.tsx';
import { Dialog } from './components/ui/Dialog.tsx';
import { TextField } from './components/ui/Field.tsx';
import { Tabs } from './components/ui/Tabs.tsx';
import { Badge } from './components/ui/Status.tsx';
import { useToast } from './components/ui/Toast.tsx';
import { cx } from './components/ui/cx.ts';

type RightTab = 'notes' | 'source';
type MobileTab = 'sources' | 'chat' | 'notes';

export function App(): ReactElement {
  const [token, setToken] = useState<string | null>(() => readToken());
  const toast = useToast();

  const api = useMemo(() => new ApiClient(() => token), [token]);

  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  // null = wird geladen. Waehrend des Ladens zeigt die Quellenspalte keine
  // Kaestchen an; sonst kann eine Auswahl angeklickt werden, bevor die
  // Antwort des ersten Abrufs eintrifft - und diese Antwort stellt sie
  // anschliessend wieder zurueck.
  const [sources, setSources] = useState<Source[] | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [pending, setPending] = useState(false);

  const [openSource, setOpenSource] = useState<SourceContent | null>(null);
  const [citationList, setCitationList] = useState<readonly Citation[]>([]);
  const [citationIndex, setCitationIndex] = useState(0);
  const [rightTab, setRightTab] = useState<RightTab>('notes');
  const [mobileTab, setMobileTab] = useState<MobileTab>('chat');
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const activeCitation = citationList[citationIndex] ?? null;
  const loadedSources = sources ?? [];
  const selected = loadedSources.filter((s) => s.selected);

  /** Wie oft eine Quelle zur letzten Antwort beigetragen hat - die Plakette
   *  "n Treffer" auf der Quellenkarte. */
  const hitCounts = useMemo(() => {
    const last = exchanges[exchanges.length - 1]?.response;
    const counts = new Map<string, number>();
    for (const chunk of last?.retrieved ?? []) {
      counts.set(chunk.sourceId, (counts.get(chunk.sourceId) ?? 0) + 1);
    }
    return counts;
  }, [exchanges]);

  const report = useCallback(
    (cause: unknown, fallback: string): void => {
      if (cause instanceof ApiRequestError && cause.status === 401) {
        writeToken(null);
        setToken(null);
        toast('warning', 'Die Sitzung ist abgelaufen. Bitte neu anmelden.');
        return;
      }
      toast('danger', cause instanceof Error ? cause.message : fallback);
    },
    [toast],
  );

  useEffect(() => {
    api
      .health()
      .then(setHealth)
      .catch(() => {
        setHealth(null);
      });
  }, [api]);

  useEffect(() => {
    if (token === null) return;
    api
      .listNotebooks()
      .then((list) => {
        setNotebooks(list);
        setActiveId((current) => current ?? list[0]?.id ?? null);
      })
      .catch((cause: unknown) => {
        report(cause, 'Die Notebooks konnten nicht geladen werden.');
      });
  }, [api, token, report]);

  useEffect(() => {
    if (token === null || activeId === null) return undefined;
    setExchanges([]);
    setOpenSource(null);
    setCitationList([]);
    setSources(null);

    // Beim Wechsel des Notebooks darf die Antwort des vorherigen Abrufs nicht
    // mehr ankommen - sonst zeigt die Spalte die Quellen des falschen
    // Notebooks.
    let veraltet = false;
    Promise.all([api.listSources(activeId), api.listNotes(activeId)])
      .then(([s, n]) => {
        if (veraltet) return;
        setSources(s);
        setNotes(n);
      })
      .catch((cause: unknown) => {
        if (veraltet) return;
        report(cause, 'Das Notebook konnte nicht geladen werden.');
      });
    return () => {
      veraltet = true;
    };
  }, [api, token, activeId, report]);

  const login = async (username: string, password: string): Promise<void> => {
    const session = await api.login(username, password);
    writeToken(session.token);
    setToken(session.token);
  };

  const showCitation = useCallback(
    async (citation: Citation, list: readonly Citation[]): Promise<void> => {
      const index = list.findIndex((c) => c.marker === citation.marker);
      setCitationList(list);
      setCitationIndex(index < 0 ? 0 : index);
      setRightTab('source');
      setMobileTab('notes');
      if (openSource?.id !== citation.sourceId) {
        try {
          setOpenSource(await api.getSource(citation.sourceId));
        } catch (cause) {
          report(cause, 'Die Quelle konnte nicht geladen werden.');
        }
      }
    },
    [api, openSource, report],
  );

  const ask = (question: string): void => {
    if (activeId === null) return;
    const id = `${Date.now()}`;
    const ids = selected.map((s) => s.id);
    setExchanges((current) => [
      ...current,
      { id, question, selectedCount: ids.length, response: null, error: null },
    ]);
    setPending(true);
    api
      .ask(activeId, question, ids)
      .then((response) => {
        setExchanges((current) => current.map((e) => (e.id === id ? { ...e, response } : e)));
      })
      .catch((cause: unknown) => {
        const message =
          cause instanceof Error ? cause.message : 'Die Frage konnte nicht gestellt werden.';
        setExchanges((current) => current.map((e) => (e.id === id ? { ...e, error: message } : e)));
        if (cause instanceof ApiRequestError && cause.status === 401) report(cause, message);
      })
      .finally(() => {
        setPending(false);
      });
  };

  const addSource = async (input: {
    title: string;
    kind: 'text' | 'markdown';
    content: string;
  }): Promise<void> => {
    if (activeId === null) return;
    const created = await api.createSource(activeId, input);
    setSources((current) => (current === null ? [created] : [...current, created]));
    toast('success', `„${created.title}" hinzugefügt (${created.chunkCount} Abschnitte).`);
  };

  const toggleSource = (source: Source, isSelected: boolean): void => {
    // Die Auswahl wird sofort umgestellt und erst danach gespeichert. Wartet
    // das Kaestchen auf die Serverantwort, fuehlt es sich bei jeder Verzoegerung
    // kaputt an - es haekt sich sichtbar zurueck.
    setSources((current) =>
      current === null
        ? current
        : current.map((s) => (s.id === source.id ? { ...s, selected: isSelected } : s)),
    );
    api
      .updateSource(source.id, { selected: isSelected })
      .then(() => {
        // Die Antwort wird bewusst NICHT uebernommen. Beim schnellen
        // Umschalten kommen die Antworten nicht zwingend in der Reihenfolge
        // der Anfragen zurueck; eine spaet eintreffende aeltere Antwort haette
        // die Auswahl wieder umgestellt. Der angezeigte Zustand entspricht
        // ohnehin dem, was gerade bestaetigt wurde.
      })
      .catch((cause: unknown) => {
        // Scheitert das Speichern, wird die Anzeige zurueckgenommen. Eine
        // Auswahl anzuzeigen, die serverseitig nicht gilt, waere eine stille
        // Luege ueber den Abruf.
        setSources((current) =>
          current === null
            ? current
            : current.map((s) => (s.id === source.id ? { ...s, selected: !isSelected } : s)),
        );
        report(cause, 'Die Auswahl konnte nicht gespeichert werden.');
      });
  };

  const saveNote = (exchange: Exchange): void => {
    if (activeId === null || exchange.response === null) return;
    api
      .createNote(activeId, {
        title: exchange.question.slice(0, 80),
        body: exchange.response.answer,
        citations: [...exchange.response.citations],
        question: exchange.question,
      })
      .then((note) => {
        setNotes((current) => [note, ...current]);
        setRightTab('notes');
        toast('success', 'Als Notiz gespeichert — mit allen Belegen.');
      })
      .catch((cause: unknown) => {
        report(cause, 'Die Notiz konnte nicht gespeichert werden.');
      });
  };

  const exportNotebook = (): void => {
    if (activeId === null) return;
    api
      .exportNotebook(activeId)
      .then((markdown) => {
        const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `${notebooks.find((n) => n.id === activeId)?.title ?? 'notebook'}.md`;
        link.click();
        URL.revokeObjectURL(url);
      })
      .catch((cause: unknown) => {
        report(cause, 'Der Export ist fehlgeschlagen.');
      });
  };

  if (token === null) {
    return <LoginScreen apiBaseUrl={API_BASE_URL} onLogin={login} />;
  }

  const notesPanel = (
    <NotesPanel
      notes={notes}
      onSelectCitation={(citation) => {
        void showCitation(citation, [citation]);
      }}
      onUpdate={(id, patch) => {
        api
          .updateNote(id, patch)
          .then((updated) => {
            setNotes((current) => current.map((n) => (n.id === updated.id ? updated : n)));
          })
          .catch((cause: unknown) => {
            report(cause, 'Die Notiz konnte nicht geändert werden.');
          });
      }}
      onDelete={(note) => {
        api
          .deleteNote(note.id)
          .then(() => {
            setNotes((current) => current.filter((n) => n.id !== note.id));
          })
          .catch((cause: unknown) => {
            report(cause, 'Die Notiz konnte nicht gelöscht werden.');
          });
      }}
    />
  );

  const sourcesPanel = (
    <SourcesPanel
      sources={sources}
      loading={sources === null}
      openSourceId={openSource?.id ?? null}
      hitCounts={hitCounts}
      onToggle={toggleSource}
      onOpen={(source) => {
        api
          .getSource(source.id)
          .then((full) => {
            setOpenSource(full);
            setCitationList([]);
            setRightTab('source');
            setMobileTab('notes');
          })
          .catch((cause: unknown) => {
            report(cause, 'Die Quelle konnte nicht geladen werden.');
          });
      }}
      onAdd={addSource}
      onDelete={(source) => {
        api
          .deleteSource(source.id)
          .then(() => {
            setSources((current) =>
              current === null ? current : current.filter((s) => s.id !== source.id),
            );
            if (openSource?.id === source.id) setOpenSource(null);
            toast('success', `„${source.title}" gelöscht.`);
          })
          .catch((cause: unknown) => {
            report(cause, 'Die Quelle konnte nicht gelöscht werden.');
          });
      }}
    />
  );

  const chatPanel = (
    <ChatPanel
      exchanges={exchanges}
      pending={pending}
      selectedCount={selected.length}
      activeMarker={activeCitation?.marker ?? null}
      onAsk={ask}
      onSelectCitation={(citation) => {
        const last = exchanges[exchanges.length - 1]?.response;
        void showCitation(citation, last?.citations ?? [citation]);
      }}
      onSaveNote={saveNote}
    />
  );

  return (
    <div className="bg-surface-sunken flex h-screen flex-col">
      {/* Bis 1280 px umbricht die Leiste, statt aus dem Bildschirm zu laufen -
          waagerechtes Scrollen der Seite ist ausgeschlossen. */}
      <header className="border-border-subtle bg-surface xl:h-13 flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2 xl:flex-nowrap xl:gap-3 xl:px-4 xl:py-0">
        <span className="text-label text-content-strong hidden font-semibold xl:inline">
          Notebook
        </span>
        <select
          value={activeId ?? ''}
          aria-label="Notebook wählen"
          onChange={(event) => {
            setActiveId(event.target.value);
          }}
          className="border-border bg-surface-raised text-body text-content min-w-0 flex-1 rounded-sm border px-2 py-1 xl:max-w-[320px] xl:flex-none"
        >
          {notebooks.map((notebook) => (
            <option key={notebook.id} value={notebook.id}>
              {notebook.title}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          onClick={() => {
            setCreating(true);
          }}
        >
          Neu
        </Button>
        <Button size="sm" variant="ghost" onClick={exportNotebook}>
          Exportieren
        </Button>

        <div className="ml-auto flex shrink-0 items-center gap-2 xl:gap-3">
          {health !== null && (
            <Badge tone={health.llm.configured ? 'success' : 'warning'}>
              {health.llm.configured ? health.llm.model : 'kein Modell verbunden'}
            </Badge>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              writeToken(null);
              setToken(null);
            }}
          >
            Abmelden
          </Button>
        </div>
      </header>

      {/* Schmale Ansicht: eine Spalte, Wechsel ueber Tabs. */}
      <div className="xl:hidden">
        <Tabs
          label="Bereich"
          value={mobileTab}
          onChange={setMobileTab}
          items={[
            { id: 'sources', label: 'Quellen', count: loadedSources.length },
            { id: 'chat', label: 'Chat' },
            { id: 'notes', label: 'Notizen', count: notes.length },
          ]}
        />
      </div>

      <div className="flex min-h-0 flex-1">
        <aside
          className={cx(
            'border-border-subtle bg-surface w-full shrink-0 overflow-hidden border-r xl:w-[300px]',
            mobileTab === 'sources' ? 'block' : 'hidden xl:block',
          )}
        >
          {sourcesPanel}
        </aside>

        <main
          className={cx(
            'bg-surface min-w-0 flex-1',
            mobileTab === 'chat' ? 'block' : 'hidden xl:block',
          )}
        >
          {chatPanel}
        </main>

        <aside
          className={cx(
            'border-border-subtle bg-surface flex w-full shrink-0 flex-col overflow-hidden border-l xl:w-[340px]',
            mobileTab === 'notes' ? 'flex' : 'hidden xl:flex',
          )}
        >
          <Tabs
            label="Rechte Spalte"
            value={rightTab}
            onChange={setRightTab}
            items={[
              { id: 'notes', label: 'Notizen', count: notes.length },
              { id: 'source', label: 'Quelle' },
            ]}
          />
          <div className="min-h-0 flex-1 overflow-hidden">
            {rightTab === 'notes' ? (
              notesPanel
            ) : (
              <SourceViewer
                source={openSource}
                citation={activeCitation}
                citationIndex={citationIndex}
                citationCount={citationList.length}
                onStep={(delta) => {
                  setCitationIndex((current) => {
                    const next = current + delta;
                    if (next < 0 || next >= citationList.length) return current;
                    return next;
                  });
                }}
              />
            )}
          </div>
        </aside>
      </div>

      <Dialog
        open={creating}
        title="Neues Notebook"
        description="Ein Notebook ist ein abgegrenzter Quellenraum. Es greift nie auf die Quellen eines anderen Notebooks zu."
        dismissable={newTitle === ''}
        onClose={() => {
          setCreating(false);
          setNewTitle('');
        }}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setCreating(false);
                setNewTitle('');
              }}
            >
              Abbrechen
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                api
                  .createNotebook(newTitle.trim() === '' ? 'Ohne Titel' : newTitle.trim())
                  .then((notebook) => {
                    setNotebooks((current) => [notebook, ...current]);
                    setActiveId(notebook.id);
                    setCreating(false);
                    setNewTitle('');
                  })
                  .catch((cause: unknown) => {
                    report(cause, 'Das Notebook konnte nicht angelegt werden.');
                  });
              }}
            >
              Anlegen
            </Button>
          </>
        }
      >
        <TextField
          label="Titel"
          value={newTitle}
          placeholder="z. B. Seminar Stochastik"
          onChange={(event) => {
            setNewTitle(event.target.value);
          }}
        />
      </Dialog>
    </div>
  );
}
