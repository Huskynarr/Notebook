import { useEffect, useState, type ReactElement } from 'react';
import { useT } from '../i18n/index.ts';
import { ApiRequestError } from '../lib/api.ts';
import {
  EMPTY_COOLDOWN,
  LOGIN_COOLDOWN_KEY,
  failedLogin,
  readCooldown,
  remainingSeconds,
} from '../lib/loginCooldown.ts';
import { NotebookMark } from './LandingPage.tsx';
import { Button } from './ui/Button.tsx';
import { TextField } from './ui/Field.tsx';
import { InlineNote } from './ui/Status.tsx';

export function LoginScreen({
  apiBaseUrl,
  demo,
  onLogin,
  onOpenSettings,
  onBack,
}: {
  apiBaseUrl: string;
  demo: boolean;
  onLogin: (username: string, password: string) => Promise<void>;
  onOpenSettings: () => void;
  onBack: () => void;
}): ReactElement {
  const t = useT();
  const [username, setUsername] = useState('Huskynar');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(() => {
    try {
      return readCooldown(window.localStorage);
    } catch {
      return EMPTY_COOLDOWN;
    }
  });
  const [now, setNow] = useState(Date.now);
  const remaining = demo ? 0 : remainingSeconds(cooldown, now);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    const sync = (): void => {
      try {
        setCooldown(readCooldown(window.localStorage));
      } catch {
        /* storage unavailable */
      }
    };
    window.addEventListener('storage', sync);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const submit = async (): Promise<void> => {
    if (busy || (!demo && remainingSeconds(cooldown) > 0)) return;
    setBusy(true);
    setError(undefined);
    try {
      await onLogin(demo ? '' : username, demo ? '' : password);
      try {
        window.localStorage.removeItem(LOGIN_COOLDOWN_KEY);
      } catch {
        /* optional persistence */
      }
      setCooldown(EMPTY_COOLDOWN);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('login.failed'));
      // Network failures do not imply an invalid password.
      if (cause instanceof ApiRequestError && (cause.status === 401 || cause.status === 429)) {
        const next = failedLogin(cooldown, cause.retryAfterSeconds);
        setCooldown(next);
        setNow(Date.now());
        try {
          window.localStorage.setItem(LOGIN_COOLDOWN_KEY, JSON.stringify(next));
        } catch {
          /* server still enforces cooldown */
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="bg-surface-sunken flex min-h-screen flex-col items-center justify-center gap-8 px-5 py-12">
      <Button variant="ghost" onClick={onBack} className="self-start sm:ml-8">
        ← {t('login.back')}
      </Button>
      <form
        className="bg-surface border-border-subtle mb-auto w-full max-w-md rounded-lg border p-6 shadow-lg sm:p-9"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="text-action mb-7">
          <NotebookMark />
        </div>
        <p className="text-action mb-3 text-xs font-medium tracking-widest">NOTEBOOK / RESEARCH</p>
        <h1 className="text-title text-content-strong font-display">
          {demo ? t('login.demoOpen') : t('login.protected')}
        </h1>
        <p className="text-body text-content-muted mt-2">
          {demo ? t('login.demoWarning') : t('app.tagline')}
        </p>
        <div className="mt-7 flex flex-col gap-5">
          {!demo && (
            <>
              <TextField
                label={t('login.username')}
                autoComplete="username"
                value={username}
                maxLength={80}
                required
                disabled={busy || remaining > 0}
                onChange={(event) => {
                  setUsername(event.target.value);
                }}
              />
              <TextField
                label={t('login.password')}
                type="password"
                autoComplete="current-password"
                value={password}
                maxLength={1024}
                required
                disabled={busy || remaining > 0}
                error={error}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError(undefined);
                }}
              />
            </>
          )}
          {remaining > 0 && (
            <p
              className="bg-warning-surface text-warning rounded-md p-3 text-sm"
              role="status"
              aria-live="polite"
            >
              {t('login.wait', { seconds: remaining })}
            </p>
          )}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={busy}
            disabled={remaining > 0}
            className="rounded-full"
          >
            {demo ? t('login.demoOpen') : t('login.submit')} <span aria-hidden="true">↗</span>
          </Button>
        </div>
        {!demo && (
          <div className="mt-6">
            <InlineNote tone="info" title={t('login.security')}>
              {t('login.cooldownHint')}
            </InlineNote>
          </div>
        )}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <p className="text-meta text-content-subtle max-w-full break-all font-mono">
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
