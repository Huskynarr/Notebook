/**
 * Die einzige Konfiguration, die das Frontend kennen darf.
 *
 * Alles, was mit VITE_ beginnt, steht im Klartext im ausgelieferten JavaScript.
 * Deshalb steht hier ausschliesslich die Adresse des Backends und niemals ein
 * Schluessel, Token oder Passwort (AGENTS.md Regel 4).
 */
const configured: unknown = import.meta.env['VITE_API_BASE_URL'];

/** Explicitly empty means same-origin (/v1), as used behind Plesk nginx. */
export function apiBaseUrl(value: unknown): string {
  return typeof value === 'string' ? value.trim().replace(/\/$/, '') : 'http://localhost:8787';
}

export const API_BASE_URL = apiBaseUrl(configured);

const demo: unknown = import.meta.env['VITE_DEMO'];

/** Explicit optional browser demo build. No access protection, one example
 * notebook, localStorage persistence and visibly simulated model responses. */
export const DEMO_MODE: boolean = demo === 'true' || demo === true;
