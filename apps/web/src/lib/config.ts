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
