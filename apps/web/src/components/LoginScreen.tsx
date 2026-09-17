import { useState, type ReactElement } from 'react';
import { Button } from './ui/Button.tsx';
import { TextField } from './ui/Field.tsx';
import { InlineNote } from './ui/Status.tsx';

export function LoginScreen({
  apiBaseUrl,
  onLogin,
}: {
  apiBaseUrl: string;
  onLogin: (username: string, password: string) => Promise<void>;
}): ReactElement {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  const submit = async (): Promise<void> => {
    setBusy(true);
    setError(undefined);
    try {
      await onLogin(username, password);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Anmeldung fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="bg-surface-sunken flex min-h-screen items-center justify-center px-4">
      <form
        className="bg-surface-overlay w-full max-w-sm rounded-lg p-6 shadow-md"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <h1 className="text-title text-content-strong">Notebook</h1>
        <p className="text-body text-content-muted mt-1">
          Quellenbasiertes Arbeiten mit überprüfbaren Belegen.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          <TextField
            label="Benutzername"
            autoComplete="username"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
            }}
          />
          <TextField
            label="Passwort"
            type="password"
            autoComplete="current-password"
            value={password}
            error={error}
            onChange={(event) => {
              setPassword(event.target.value);
              setError(undefined);
            }}
          />
          <Button type="submit" variant="primary" size="lg" loading={busy}>
            Anmelden
          </Button>
        </div>

        <div className="mt-5">
          <InlineNote tone="info" title="Lokaler Zugang">
            Voreinstellung <code className="font-mono">admin / admin</code>. Der Zugang ist für den
            Betrieb auf dem eigenen Rechner gedacht — vor einer Erreichbarkeit im Netz muss er
            geändert werden.
          </InlineNote>
        </div>

        <p className="text-meta text-content-subtle mt-4 font-mono">Backend: {apiBaseUrl}</p>
      </form>
    </main>
  );
}
