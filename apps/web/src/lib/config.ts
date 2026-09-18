/**
 * Die einzige Konfiguration, die das Frontend kennen darf.
 *
 * Alles, was mit VITE_ beginnt, steht im Klartext im ausgelieferten JavaScript.
 * Deshalb steht hier ausschliesslich die Adresse des Backends und niemals ein
 * Schluessel, Token oder Passwort (AGENTS.md Regel 4).
 */
const configured: unknown = import.meta.env['VITE_API_BASE_URL'];

export const API_BASE_URL: string =
  typeof configured === 'string' && configured.trim() !== ''
    ? configured.trim()
    : 'http://localhost:8787';

const demo: unknown = import.meta.env['VITE_DEMO'];

/** true = Demo ohne Backend (GitHub Pages). Die Anwendung laeuft dann
 *  vollstaendig im Browser: Anmeldung, Notebooks, Quellen, Notizen und die
 *  Belegmechanik sind echt und bleiben im localStorage; nur ein Sprachmodell
 *  ist nicht angebunden - das ist an der Antwort gekennzeichnet, wie beim
 *  Server mit LLM_PROVIDER=stub. */
export const DEMO_MODE: boolean = demo === 'true' || demo === true;
