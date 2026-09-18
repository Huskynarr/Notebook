import { z } from 'zod';
import {
  ApiErrorSchema,
  AskResponseSchema,
  HealthResponseSchema,
  LoginResponseSchema,
  NoteListResponseSchema,
  NoteSchema,
  NotebookListResponseSchema,
  NotebookSchema,
  SourceContentSchema,
  SourceListResponseSchema,
  SourceSchema,
  type AskResponse,
  type Citation,
  type CreateSourceRequest,
  type HealthResponse,
  type Language,
  type Note,
  type Notebook,
  type Source,
  type SourceContent,
} from '@notebook/shared';
import { API_BASE_URL } from './config.ts';
import type { Uebersetzer } from '../i18n/index.ts';

/** Fehler mit einer Meldung, die einer Person etwas sagt. Der Code erlaubt dem
 *  UI, einzelne Faelle zu unterscheiden (z. B. abgelaufene Sitzung, CORS). */
export class ApiRequestError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.code = code;
    this.status = status;
  }
}

export type TokenProvider = () => string | null;

/** Was die Anwendung von ihrer Datenquelle braucht. `ApiClient` spricht damit
 *  das Backend an, `DemoClient` liefert dieselbe Form aus dem Browser heraus
 *  (siehe demo/demoClient.ts). Die Anwendung kennt nur diese Schnittstelle. */
export interface NotebookApi {
  health(): Promise<HealthResponse>;
  login(username: string, password: string): Promise<{ token: string; expiresAt: string }>;
  listNotebooks(): Promise<Notebook[]>;
  createNotebook(title: string): Promise<Notebook>;
  renameNotebook(id: string, title: string): Promise<Notebook>;
  deleteNotebook(id: string): Promise<void>;
  exportNotebook(id: string): Promise<string>;
  listSources(notebookId: string): Promise<Source[]>;
  createSource(notebookId: string, input: CreateSourceRequest): Promise<Source>;
  updateSource(id: string, patch: { selected?: boolean; title?: string }): Promise<Source>;
  deleteSource(id: string): Promise<void>;
  getSource(id: string): Promise<SourceContent>;
  ask(
    notebookId: string,
    question: string,
    sourceIds: string[],
    language: Language,
  ): Promise<AskResponse>;
  listNotes(notebookId: string): Promise<Note[]>;
  createNote(
    notebookId: string,
    input: { title: string; body: string; citations: Citation[]; question: string },
  ): Promise<Note>;
  updateNote(id: string, patch: { title?: string; body?: string }): Promise<Note>;
  deleteNote(id: string): Promise<void>;
}

export class ApiClient implements NotebookApi {
  private readonly baseUrl: string;
  private readonly getToken: TokenProvider;
  private readonly t: Uebersetzer;

  constructor(getToken: TokenProvider, t: Uebersetzer, baseUrl: string = API_BASE_URL) {
    this.getToken = getToken;
    this.t = t;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private headers(withBody: boolean): Record<string, string> {
    const token = this.getToken();
    return {
      ...(withBody ? { 'content-type': 'application/json' } : {}),
      ...(token === null ? {} : { authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(
    path: string,
    schema: z.ZodType<T>,
    init: Omit<RequestInit, 'headers'> = {},
  ): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: this.headers(init.body !== undefined),
      });
    } catch {
      throw new ApiRequestError(this.t('error.network', { url: this.baseUrl }), 'network', 0);
    }

    if (!response.ok) {
      const parsed = ApiErrorSchema.safeParse(await response.json().catch(() => null));
      throw new ApiRequestError(
        parsed.success
          ? parsed.data.error.message
          : this.t('error.status', { status: response.status }),
        parsed.success ? parsed.data.error.code : 'internal',
        response.status,
      );
    }

    if (response.status === 204) return schema.parse(undefined);

    const payload: unknown = await response.json();
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      // Ein Vertragsbruch soll auffallen, nicht als halb gefuelltes UI enden.
      throw new ApiRequestError(this.t('error.contract'), 'validation_failed', response.status);
    }
    return parsed.data;
  }

  private async requestText(path: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}${path}`, { headers: this.headers(false) });
    if (!response.ok) {
      throw new ApiRequestError(
        this.t('error.status', { status: response.status }),
        'internal',
        response.status,
      );
    }
    return response.text();
  }

  health(): Promise<HealthResponse> {
    return this.request('/v1/health', HealthResponseSchema);
  }

  login(username: string, password: string): Promise<{ token: string; expiresAt: string }> {
    return this.request('/v1/auth/login', LoginResponseSchema, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async listNotebooks(): Promise<Notebook[]> {
    return (await this.request('/v1/notebooks', NotebookListResponseSchema)).notebooks;
  }

  createNotebook(title: string): Promise<Notebook> {
    return this.request('/v1/notebooks', NotebookSchema, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  renameNotebook(id: string, title: string): Promise<Notebook> {
    return this.request(`/v1/notebooks/${id}`, NotebookSchema, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });
  }

  deleteNotebook(id: string): Promise<void> {
    return this.request(`/v1/notebooks/${id}`, z.void(), { method: 'DELETE' });
  }

  exportNotebook(id: string): Promise<string> {
    return this.requestText(`/v1/notebooks/${id}/export`);
  }

  async listSources(notebookId: string): Promise<Source[]> {
    return (await this.request(`/v1/notebooks/${notebookId}/sources`, SourceListResponseSchema))
      .sources;
  }

  createSource(notebookId: string, input: CreateSourceRequest): Promise<Source> {
    return this.request(`/v1/notebooks/${notebookId}/sources`, SourceSchema, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  updateSource(id: string, patch: { selected?: boolean; title?: string }): Promise<Source> {
    return this.request(`/v1/sources/${id}`, SourceSchema, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  }

  deleteSource(id: string): Promise<void> {
    return this.request(`/v1/sources/${id}`, z.void(), { method: 'DELETE' });
  }

  getSource(id: string): Promise<SourceContent> {
    return this.request(`/v1/sources/${id}`, SourceContentSchema);
  }

  ask(
    notebookId: string,
    question: string,
    sourceIds: string[],
    language: Language,
  ): Promise<AskResponse> {
    return this.request(`/v1/notebooks/${notebookId}/ask`, AskResponseSchema, {
      method: 'POST',
      body: JSON.stringify({ question, sourceIds, language }),
    });
  }

  async listNotes(notebookId: string): Promise<Note[]> {
    return (await this.request(`/v1/notebooks/${notebookId}/notes`, NoteListResponseSchema)).notes;
  }

  createNote(
    notebookId: string,
    input: { title: string; body: string; citations: Citation[]; question: string },
  ): Promise<Note> {
    return this.request(`/v1/notebooks/${notebookId}/notes`, NoteSchema, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  updateNote(id: string, patch: { title?: string; body?: string }): Promise<Note> {
    return this.request(`/v1/notes/${id}`, NoteSchema, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  }

  deleteNote(id: string): Promise<void> {
    return this.request(`/v1/notes/${id}`, z.void(), { method: 'DELETE' });
  }
}
