import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import type {
  Citation,
  CreateSourceRequest,
  HealthResponse,
  Note,
  Notebook,
  Source,
  SourceContent,
} from '@notebook/shared';
import { ApiClient, ApiRequestError, type NotebookApi } from './lib/api.ts';
import { API_BASE_URL, DEMO_MODE } from './lib/config.ts';
import { readToken, writeToken } from './lib/session.ts';
import {
  anwenden as erscheinungsbildAnwenden,
  lesen as erscheinungsbildLesen,
  schreiben as erscheinungsbildSchreiben,
  type Erscheinungsbild,
} from './lib/appearance.ts';
import {
  SpracheContext,
  spracheLesen,
  spracheSchreiben,
  uebersetzen,
  type Sprache,
  type Uebersetzer,
} from './i18n/index.ts';
import type * as ExportModul from './lib/export.ts';
import { DemoClient } from './demo/demoClient.ts';
import { zustimmungLesen, zustimmungSchreiben, type Zustimmung } from './lib/consent.ts';
import { ConsentBanner } from './components/ConsentBanner.tsx';
import { useResizableColumns } from './hooks/useResizableColumns.ts';
import { ChatPanel, type Exchange } from './components/ChatPanel.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';
import { NotesPanel } from './components/NotesPanel.tsx';
import { SettingsDialog } from './components/SettingsDialog.tsx';
import { ShareMenu } from './components/ShareMenu.tsx';
import { SourceViewer } from './components/SourceViewer.tsx';
import { SourcesPanel } from './components/SourcesPanel.tsx';
import { Tour, tourGesehen } from './components/Tour.tsx';
import { Button } from './components/ui/Button.tsx';
import { Dialog } from './components/ui/Dialog.tsx';
import { TextField } from './components/ui/Field.tsx';
import { Menu } from './components/ui/Menu.tsx';
import { ResizeHandle } from './components/ui/ResizeHandle.tsx';
import { Badge } from './components/ui/Status.tsx';
import { Tabs } from './components/ui/Tabs.tsx';
import { useToast } from './components/ui/Toast.tsx';
import { cx } from './components/ui/cx.ts';

type RightTab = 'notes' | 'source';

/* Die Exportbibliotheken (docx, html-to-image) sind zusammen groesser als
 * der Rest der Anwendung; sie werden erst beim ersten Teilen geladen. */
const exportModul = (): Promise<typeof ExportModul> => import('./lib/export.ts');
type MobileTab = 'sources' | 'chat' | 'notes';

export function App(): ReactElement {
  const [sprache, setSprache] = useState<Sprache>(() => spracheLesen());
  const t = useCallback<Uebersetzer>((key, params) => uebersetzen(sprache, key, params), [sprache]);
  useEffect(() => {
    spracheSchreiben(sprache);
  }, [sprache]);

  return (
    <SpracheContext.Provider value={{ sprache, t }}>
      <Arbeitsbereich sprache={sprache} onSprache={setSprache} t={t} />
    </SpracheContext.Provider>
  );
}

function Arbeitsbereich({
  sprache,
  onSprache,
  t,
}: {
  sprache: Sprache;
  onSprache: (s: Sprache) => void;
  t: Uebersetzer;
}): ReactElement {
  const [token, setToken] = useState<string | null>(() => readToken());
  const toast = useToast();
  const [loginOpen, setLoginOpen] = useState(() => window.location.hash === '#login');
  useEffect(() => {
    const changed = (): void => {
      setLoginOpen(window.location.hash === '#login');
    };
    window.addEventListener('hashchange', changed);
    return () => {
      window.removeEventListener('hashchange', changed);
    };
  }, []);

  // Eine stabile Uebersetzungsfunktion: Client und Ladeeffekte haengen an ihr,
  // nicht an `t` - sonst wuerde ein Sprachwechsel den Client neu bauen und den
  // Arbeitsstand (Chatverlauf, geoeffnete Quelle) verwerfen.
  const tRef = useRef(t);
  tRef.current = t;
  const tStabil = useCallback<Uebersetzer>((key, params) => tRef.current(key, params), []);

  // In der Demo laeuft die Anwendung vollstaendig im Browser. Sie kennt nur
  // die Schnittstelle NotebookApi und an keiner Stelle den Unterschied -
  // sichtbar ist er ueber `simulated` in jeder Antwort, wie beim Server ohne
  // Modell.
  const api = useMemo<NotebookApi>(
    () => (DEMO_MODE ? new DemoClient(undefined, tStabil) : new ApiClient(() => token, tStabil)),
    [token, tStabil],
  );

  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sources, setSources] = useState<Source[] | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [pending, setPending] = useState(false);

  const [openSource, setOpenSource] = useState<SourceContent | null>(null);
  const sourceLoad = useRef(0);
  const [citationList, setCitationList] = useState<readonly Citation[]>([]);
  const [citationIndex, setCitationIndex] = useState(0);
  const [rightTab, setRightTab] = useState<RightTab>('notes');
  const [mobileTab, setMobileTab] = useState<MobileTab>('chat');

  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [titelEntwurf, setTitelEntwurf] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Erst die Einwilligung, dann die Einfuehrung: zwei Dialoge auf einmal
  // waeren zu viel, und die Einfuehrung speichert bereits Einstellungen.
  const [zustimmung, setZustimmung] = useState<Zustimmung | null>(() => zustimmungLesen());
  const [tourOpen, setTourOpen] = useState(
    () => token !== null && zustimmungLesen() !== null && !tourGesehen(),
  );
  const entscheiden = (einstellungen: boolean): void => {
    const war = zustimmung;
    setZustimmung(zustimmungSchreiben(einstellungen));
    if (war === null && token !== null && !tourGesehen()) setTourOpen(true);
  };
  const [erscheinungsbild, setErscheinungsbild] = useState<Erscheinungsbild>(() =>
    erscheinungsbildLesen(),
  );
  const { spalten, ziehenStarten, perTaste, grenzen } = useResizableColumns();

  useEffect(() => {
    erscheinungsbildAnwenden(erscheinungsbild);
    erscheinungsbildSchreiben(erscheinungsbild);
  }, [erscheinungsbild]);

  const activeCitation = citationList[citationIndex] ?? null;
  const loadedSources = sources ?? [];
  const selected = loadedSources.filter((s) => s.selected);
  const aktivesNotebook = notebooks.find((n) => n.id === activeId) ?? null;

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
        toast('warning', tStabil('error.sessionExpired'));
        return;
      }
      toast('danger', cause instanceof Error ? cause.message : fallback);
    },
    [toast, tStabil],
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
        report(cause, tStabil('error.loadNotebooks'));
      });
  }, [api, token, report, tStabil]);

  useEffect(() => {
    if (token === null || activeId === null) return undefined;
    setExchanges([]);
    sourceLoad.current += 1;
    setOpenSource(null);
    setCitationList([]);
    setSources(null);
    let veraltet = false;
    Promise.all([api.listSources(activeId), api.listNotes(activeId)])
      .then(([s, n]) => {
        if (veraltet) return;
        setSources(s);
        setNotes(n);
      })
      .catch((cause: unknown) => {
        if (veraltet) return;
        report(cause, tStabil('error.loadNotebook'));
      });
    return () => {
      veraltet = true;
    };
  }, [api, token, activeId, report, tStabil]);

  const login = async (username: string, password: string): Promise<void> => {
    const session = await api.login(username, password);
    writeToken(session.token);
    setToken(session.token);
    window.location.hash = '';
    if (!tourGesehen() && zustimmung !== null) setTourOpen(true);
  };

  const showCitation = useCallback(
    async (citation: Citation, list: readonly Citation[]): Promise<void> => {
      const generation = ++sourceLoad.current;
      const index = list.findIndex((c) => c.marker === citation.marker);
      setCitationList(list);
      setCitationIndex(index < 0 ? 0 : index);
      setRightTab('source');
      setMobileTab('notes');
      if (openSource?.id !== citation.sourceId) {
        setOpenSource(null);
        try {
          const source = await api.getSource(citation.sourceId);
          if (generation === sourceLoad.current) setOpenSource(source);
        } catch (cause) {
          if (generation === sourceLoad.current) report(cause, t('error.loadSource'));
        }
      }
    },
    [api, openSource, report, t],
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
      .ask(activeId, question, ids, sprache)
      .then((response) => {
        setExchanges((current) => current.map((e) => (e.id === id ? { ...e, response } : e)));
      })
      .catch((cause: unknown) => {
        const message = cause instanceof Error ? cause.message : t('chat.askFailed');
        setExchanges((current) => current.map((e) => (e.id === id ? { ...e, error: message } : e)));
        if (cause instanceof ApiRequestError && cause.status === 401) report(cause, message);
      })
      .finally(() => {
        setPending(false);
      });
  };

  const addSource = async (input: CreateSourceRequest): Promise<void> => {
    if (activeId === null) return;
    const created = await api.createSource(activeId, input);
    setSources((current) => (current === null ? [created] : [...current, created]));
    toast('info', t('addSource.added', { title: created.title, count: created.chunkCount }));
  };

  const toggleSource = (source: Source, isSelected: boolean): void => {
    // Sofort umstellen, erst danach speichern; die Serverantwort wird nicht
    // uebernommen (D-010), nur ein Fehler nimmt die Anzeige zurueck.
    setSources((current) =>
      current === null
        ? current
        : current.map((s) => (s.id === source.id ? { ...s, selected: isSelected } : s)),
    );
    api
      .updateSource(source.id, { selected: isSelected })
      .then(() => undefined)
      .catch((cause: unknown) => {
        setSources((current) =>
          current === null
            ? current
            : current.map((s) => (s.id === source.id ? { ...s, selected: !isSelected } : s)),
        );
        report(cause, t('error.saveSelection'));
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
        toast('info', t('notes.saved'));
      })
      .catch((cause: unknown) => {
        report(cause, t('error.saveNote'));
      });
  };

  /* ---------------------------- Teilen ---------------------------- */

  const quellenMitText = async (): Promise<Array<Source & { content: string }>> =>
    Promise.all(loadedSources.map(async (s) => ({ ...s, ...(await api.getSource(s.id)) })));

  const notebookTeilen = {
    markdown: () => {
      if (aktivesNotebook === null) return;
      void Promise.all([exportModul(), quellenMitText()])
        .then(([ex, q]) => {
          ex.markdownSpeichern(
            ex.notebookAlsMarkdown(aktivesNotebook, q, notes, t),
            aktivesNotebook.title,
          );
          toast('info', t('share.exported', { format: 'Markdown' }));
        })
        .catch((cause: unknown) => {
          report(cause, t('share.failed'));
        });
    },
    pdf: () => {
      void exportModul().then((ex) => {
        ex.drucken(null);
      });
    },
    docx: () => {
      if (aktivesNotebook === null) return;
      void Promise.all([exportModul(), quellenMitText()])
        .then(
          async ([ex, q]) => [ex, await ex.notebookAlsDocx(aktivesNotebook, q, notes, t)] as const,
        )
        .then(([ex, blob]) => {
          ex.docxSpeichern(blob, aktivesNotebook.title);
          toast('info', t('share.exported', { format: 'Word' }));
        })
        .catch((cause: unknown) => {
          report(cause, t('share.failed'));
        });
    },
    copyLink: () => {
      void navigator.clipboard.writeText(window.location.href).then(() => {
        toast('info', DEMO_MODE ? t('share.linkDemo') : t('share.linkCopied'));
      });
    },
  };

  const antwortTeilen = (exchange: Exchange, element: HTMLElement | null) => {
    const response = exchange.response;
    const basis = exchange.question.slice(0, 60);
    return {
      markdown: () => {
        if (response === null) return;
        void exportModul()
          .then((ex) => {
            ex.markdownSpeichern(
              ex.antwortAlsMarkdown({ question: exchange.question, response }, t),
              basis,
            );
            toast('info', t('share.exported', { format: 'Markdown' }));
          })
          .catch((cause: unknown) => {
            report(cause, t('share.failed'));
          });
      },
      pdf: () => {
        void exportModul().then((ex) => {
          ex.drucken(element);
        });
      },
      docx: () => {
        if (response === null) return;
        void exportModul()
          .then(async (ex) => {
            ex.docxSpeichern(
              await ex.antwortAlsDocx({ question: exchange.question, response }, t),
              basis,
            );
            toast('info', t('share.exported', { format: 'Word' }));
          })
          .catch((cause: unknown) => {
            report(cause, t('share.failed'));
          });
      },
      image: () => {
        if (element === null) return;
        void exportModul()
          .then((ex) => ex.elementAlsPng(element, basis))
          .then(() => {
            toast('info', t('share.exported', { format: 'PNG' }));
          })
          .catch((cause: unknown) => {
            report(cause, t('share.failed'));
          });
      },
    };
  };

  /* ---------------------------- Dialoge ---------------------------- */

  const einstellungen = (
    <SettingsDialog
      open={settingsOpen}
      wert={erscheinungsbild}
      sprache={sprache}
      apiBaseUrl={API_BASE_URL}
      demo={DEMO_MODE}
      onChange={setErscheinungsbild}
      onSprache={onSprache}
      onShowTour={() => {
        setSettingsOpen(false);
        setTourOpen(true);
      }}
      zustimmung={zustimmung}
      onZustimmung={entscheiden}
      onClose={() => {
        setSettingsOpen(false);
      }}
    />
  );

  const tour = (
    <Tour
      open={tourOpen}
      demo={DEMO_MODE}
      sprache={sprache}
      erscheinungsbild={erscheinungsbild}
      onSprache={onSprache}
      onErscheinungsbild={setErscheinungsbild}
      onClose={() => {
        setTourOpen(false);
      }}
    />
  );

  const banner = zustimmung === null ? <ConsentBanner onDecide={entscheiden} /> : null;

  if (token === null) {
    return (
      <>
        {banner}
        {loginOpen ? (
          <LoginScreen
            apiBaseUrl={API_BASE_URL}
            demo={DEMO_MODE}
            onLogin={login}
            onBack={() => {
              window.location.hash = '';
            }}
            onOpenSettings={() => {
              setSettingsOpen(true);
            }}
          />
        ) : (
          <LandingPage
            demo={DEMO_MODE}
            modelBlocked={health?.llm.accessBlocked === true}
            embeddingsEnabled={health?.embeddings?.configured === true}
            openRouterChat={
              health?.llm.model === 'qwen/qwen3.8-27b:free' ||
              health?.llm.model === 'google/gemma-4-26b-a4b-it:free'
            }
            onLogin={() => {
              window.location.hash = 'login';
            }}
            onOpenSettings={() => {
              setSettingsOpen(true);
            }}
          />
        )}
        {einstellungen}
        {tour}
      </>
    );
  }

  const notesPanel = (
    <NotesPanel
      sources={sources}
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
            report(cause, t('error.updateNote'));
          });
      }}
      onDelete={(note) => {
        api
          .deleteNote(note.id)
          .then(() => {
            setNotes((current) => current.filter((n) => n.id !== note.id));
          })
          .catch((cause: unknown) => {
            report(cause, t('error.deleteNote'));
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
        const generation = ++sourceLoad.current;
        setOpenSource(null);
        setCitationList([]);
        setRightTab('source');
        setMobileTab('notes');
        api
          .getSource(source.id)
          .then((full) => {
            if (generation !== sourceLoad.current) return;
            setOpenSource(full);
            setCitationList([]);
            setRightTab('source');
            setMobileTab('notes');
          })
          .catch((cause: unknown) => {
            report(cause, t('error.loadSource'));
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
            toast('info', t('error.sourceDeleted', { title: source.title }));
          })
          .catch((cause: unknown) => {
            report(cause, t('error.deleteSource'));
          });
      }}
    />
  );

  const chatPanel = (
    <ChatPanel
      exchanges={exchanges}
      pending={pending}
      modelBlocked={health?.llm.accessBlocked === true}
      openRouterChat={
        health?.llm.configured === true &&
        (health.llm.model === 'qwen/qwen3.8-27b:free' ||
          health.llm.model === 'google/gemma-4-26b-a4b-it:free')
      }
      selectedCount={selected.length}
      activeMarker={activeCitation?.marker ?? null}
      onAsk={ask}
      onSelectCitation={(citation, citations) => {
        void showCitation(citation, citations);
      }}
      onSaveNote={saveNote}
      shareActions={antwortTeilen}
    />
  );

  const notebookMenue = (
    <Menu
      label={t('header.chooseNotebook')}
      align="start"
      buttonProps={{ variant: 'ghost', size: 'md', className: 'max-w-[60vw] xl:max-w-[44ch]' }}
      groups={[
        {
          items: notebooks.map((n) => ({
            id: n.id,
            label: n.title,
            hint: `${n.sourceCount} ${t('sources.title').toLowerCase()} · ${n.noteCount} ${t('notes.title').toLowerCase()}`,
            onSelect: () => {
              setActiveId(n.id);
            },
          })),
        },
        {
          items: [
            {
              id: 'neu',
              label: t('notebook.new.title'),
              onSelect: () => {
                setTitelEntwurf('');
                setCreating(true);
              },
            },
            ...(aktivesNotebook === null
              ? []
              : [
                  {
                    id: 'umbenennen',
                    label: t('notebook.rename'),
                    onSelect: () => {
                      setTitelEntwurf(aktivesNotebook.title);
                      setRenaming(true);
                    },
                  },
                  {
                    id: 'loeschen',
                    label: t('notebook.delete.title'),
                    danger: true,
                    onSelect: () => {
                      setDeleting(true);
                    },
                  },
                ]),
          ],
        },
      ]}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="text-heading text-content-strong truncate" title={aktivesNotebook?.title}>
          {aktivesNotebook?.title ?? t('app.name')}
        </span>
        <span aria-hidden="true" className="text-content-muted shrink-0">
          ▾
        </span>
      </span>
    </Menu>
  );

  return (
    <div className="bg-surface-sunken flex h-screen flex-col">
      <header className="border-border-subtle bg-surface xl:h-13 flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2 xl:flex-nowrap xl:gap-3 xl:px-4 xl:py-0">
        <span className="text-label text-content-muted hidden font-semibold uppercase tracking-wide xl:inline">
          {t('app.name')}
        </span>
        <div className="min-w-0 flex-1 xl:flex-none">{notebookMenue}</div>

        <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-1 xl:shrink-0 xl:gap-3">
          {health !== null && (
            <Badge tone={health.llm.accessBlocked || !health.llm.configured ? 'warning' : 'info'}>
              {health.llm.accessBlocked
                ? `${health.llm.model} · ${t('header.externalApiBlocked')}`
                : health.llm.configured
                  ? health.llm.model
                  : t('header.noModel')}
            </Badge>
          )}
          <ShareMenu scope="notebook" actions={notebookTeilen} />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSettingsOpen(true);
            }}
          >
            {t('common.settings')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              writeToken(null);
              setToken(null);
            }}
          >
            {t('common.logout')}
          </Button>
        </div>
      </header>

      {DEMO_MODE && (
        <p className="bg-warning-surface text-warning px-4 py-2 text-xs" role="status">
          {t('login.demoWarning')}
        </p>
      )}
      <div className="xl:hidden">
        <Tabs
          label={t('tabs.area')}
          value={mobileTab}
          onChange={setMobileTab}
          items={[
            { id: 'sources', label: t('tabs.sources'), count: loadedSources.length },
            { id: 'chat', label: t('tabs.chat') },
            { id: 'notes', label: t('tabs.notes'), count: notes.length },
          ]}
        />
      </div>

      <div className="flex min-h-0 flex-1">
        <aside
          style={{ ['--w' as string]: `${spalten.links}px` }}
          className={cx(
            'bg-surface w-full shrink-0 overflow-hidden xl:w-[var(--w)]',
            mobileTab === 'sources' ? 'block' : 'hidden xl:block',
          )}
        >
          {sourcesPanel}
        </aside>
        <ResizeHandle
          label={t('tabs.sources')}
          value={spalten.links}
          min={grenzen.links[0]}
          max={grenzen.links[1]}
          onPointerDown={ziehenStarten('links')}
          onStep={(d) => {
            perTaste('links', d);
          }}
        />

        <main
          className={cx(
            'bg-surface min-w-0 flex-1',
            mobileTab === 'chat' ? 'block' : 'hidden xl:block',
          )}
        >
          {chatPanel}
        </main>

        <ResizeHandle
          label={t('tabs.notes')}
          value={spalten.rechts}
          min={grenzen.rechts[0]}
          max={grenzen.rechts[1]}
          onPointerDown={ziehenStarten('rechts')}
          onStep={(d) => {
            perTaste('rechts', d);
          }}
        />
        <aside
          style={{ ['--w' as string]: `${spalten.rechts}px` }}
          className={cx(
            'bg-surface flex w-full shrink-0 flex-col overflow-hidden xl:w-[var(--w)]',
            mobileTab === 'notes' ? 'flex' : 'hidden xl:flex',
          )}
        >
          <Tabs
            label={t('tabs.right')}
            value={rightTab}
            onChange={setRightTab}
            items={[
              { id: 'notes', label: t('tabs.notes'), count: notes.length },
              { id: 'source', label: t('tabs.source') },
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
                  const next = citationList[citationIndex + delta];
                  if (next !== undefined) void showCitation(next, citationList);
                }}
              />
            )}
          </div>
        </aside>
      </div>

      {einstellungen}
      {tour}
      {banner}

      <Dialog
        open={creating || renaming}
        title={renaming ? t('notebook.rename') : t('notebook.new.title')}
        {...(renaming ? {} : { description: t('notebook.new.description') })}
        dismissable={titelEntwurf === '' || renaming}
        onClose={() => {
          setCreating(false);
          setRenaming(false);
        }}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setCreating(false);
                setRenaming(false);
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const titel =
                  titelEntwurf.trim() === '' ? t('common.untitled') : titelEntwurf.trim();
                const aktion =
                  renaming && aktivesNotebook !== null
                    ? api.renameNotebook(aktivesNotebook.id, titel).then((nb) => {
                        setNotebooks((current) => current.map((n) => (n.id === nb.id ? nb : n)));
                      })
                    : api.createNotebook(titel).then((nb) => {
                        setNotebooks((current) => [nb, ...current.filter((n) => n.id !== nb.id)]);
                        setActiveId(nb.id);
                      });
                aktion
                  .then(() => {
                    setCreating(false);
                    setRenaming(false);
                  })
                  .catch((cause: unknown) => {
                    report(cause, t('error.createNotebook'));
                  });
              }}
            >
              {renaming ? t('common.save') : t('notebook.new.submit')}
            </Button>
          </>
        }
      >
        <TextField
          label={t('notebook.new.titleLabel')}
          value={titelEntwurf}
          placeholder={t('notebook.new.placeholder')}
          onChange={(event) => {
            setTitelEntwurf(event.target.value);
          }}
        />
      </Dialog>

      <Dialog
        open={deleting && aktivesNotebook !== null}
        title={t('notebook.delete.title')}
        onClose={() => {
          setDeleting(false);
        }}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setDeleting(false);
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (aktivesNotebook === null) return;
                api
                  .deleteNotebook(aktivesNotebook.id)
                  .then(() => {
                    setNotebooks((current) => current.filter((n) => n.id !== aktivesNotebook.id));
                    setActiveId(notebooks.find((n) => n.id !== aktivesNotebook.id)?.id ?? null);
                    setDeleting(false);
                  })
                  .catch((cause: unknown) => {
                    report(cause, t('error.createNotebook'));
                  });
              }}
            >
              {t('notebook.delete.confirm')}
            </Button>
          </>
        }
      >
        <p className="text-body text-content">
          {t('notebook.delete.body', { title: aktivesNotebook?.title ?? '' })}
        </p>
      </Dialog>
    </div>
  );
}
