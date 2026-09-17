const STORAGE_KEY = 'notebook.session';

/** Das Sitzungstoken liegt im sessionStorage: es ueberlebt einen Seitenwechsel,
 *  aber nicht das Schliessen des Tabs. Ein Geheimnis ist es nicht - es wird vom
 *  Backend ausgestellt und laeuft ab. */
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
