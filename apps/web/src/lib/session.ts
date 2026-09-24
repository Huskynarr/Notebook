const STORAGE_KEY = 'notebook.session';

/** Das Sitzungstoken liegt im sessionStorage: es ueberlebt einen Seitenwechsel,
 *  aber nicht das Schliessen des Tabs. Es ist ein kurzlebiger Zugangsbeleg,
 *  wird erst vom Backend ausgestellt und niemals statisch ins Bundle eingebaut. */
export function readToken(): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeToken(token: string | null): void {
  try {
    if (token === null) window.sessionStorage.removeItem(STORAGE_KEY);
    else window.sessionStorage.setItem(STORAGE_KEY, token);
  } catch {
    // Privater Modus oder gesperrter Speicher: die Sitzung gilt dann nur,
    // solange die Seite offen bleibt. Kein Grund, die Anwendung anzuhalten.
  }
}
