import { useState, type ReactElement } from 'react';
import { useT } from '../i18n/index.ts';
import { Button } from './ui/Button.tsx';
import { TextField } from './ui/Field.tsx';
import { InlineNote } from './ui/Status.tsx';

export function LoginScreen({
  apiBaseUrl,
  demo,
  onLogin,
  onOpenSettings,
}: {
  apiBaseUrl: string;
  demo: boolean;
  onLogin: (username: string, password: string) => Promise<void>;
  onOpenSettings: () => void;
}): ReactElement {
  const t = useT();
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
      setError(cause instanceof Error ? cause.message : t('login.failed'));
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
        <h1 className="text-title text-content-strong font-display">{t('app.name')}</h1>
        <p className="text-body text-content-muted mt-1">{t('app.tagline')}</p>

        <div className="mt-6 flex flex-col gap-4">
          <TextField
            label={t('login.username')}
            autoComplete="username"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
            }}
          />
          <TextField
            label={t('login.password')}
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
            {t('login.submit')}
          </Button>
        </div>

        <div className="mt-5">
          <InlineNote tone="info" title={t('login.localTitle')}>
            {t('login.localBody', { creds: 'admin / admin' })}
          </InlineNote>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <p className="text-meta text-content-subtle font-mono">
            {demo ? t('login.demo') : t('login.backend', { url: apiBaseUrl })}
          </p>
          <Button size="sm" variant="ghost" onClick={onOpenSettings}>
            {t('common.settings')}
          </Button>
        </div>
      </form>
    </main>
  );
}
