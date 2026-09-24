#!/usr/bin/env python3
"""Erzeugt apps/web/src/styles/theme.css aus den Paletten unten.

Drei Designs mal zwei Erscheinungsbilder mal rund 40 Tokens sind ueber 200
Werte. Von Hand geschrieben waeren Abweichungen zwischen den Bloecken
unvermeidlich - ein vergessener Token faellt erst auf, wenn ein Element in
einem Design unsichtbar wird. Deshalb stehen die Paletten hier als Daten, und
das Skript prueft beim Erzeugen, dass jedes Design jeden Token belegt.

Aufruf: pnpm theme
"""

from pathlib import Path

TOKENS = [
    'surface-sunken', 'surface', 'surface-raised', 'surface-overlay', 'surface-inset',
    'content-strong', 'content', 'content-muted', 'content-subtle', 'content-inverted',
    'border-subtle', 'border', 'border-strong',
    'accent', 'accent-hover', 'accent-surface', 'accent-surface-strong', 'accent-border',
    'accent-contrast',
    'action', 'action-hover', 'action-surface', 'action-contrast',
    'info', 'info-surface', 'warning', 'warning-surface', 'warning-mark',
    'danger', 'danger-surface',
    'focus-ring', 'scrim',
    'font-ui', 'font-display', 'font-reading', 'font-mono',
    'radius-xs', 'radius-sm', 'radius-md', 'radius-lg',
]

INTER = "'Inter Variable', ui-sans-serif, system-ui, sans-serif"
SERIF = "'Source Serif 4', ui-serif, Georgia, serif"
JET = "'JetBrains Mono Variable', ui-monospace, monospace"
SOCIAL = "'Social', Arial, Helvetica, sans-serif"
SOCIAL_X = "'Social Extended', 'Social', Arial, Helvetica, sans-serif"
SYSMONO = "ui-monospace, 'SF Mono', 'Cascadia Mono', Menlo, Consolas, monospace"

DESIGNS = {
    'eigen': {
        'label': 'Papier und Tinte - eigenes Design, Vorgabe',
        'light': {
            'surface-sunken': '#f2efe9', 'surface': '#faf8f4', 'surface-raised': '#ffffff',
            'surface-overlay': '#ffffff', 'surface-inset': '#efece5',
            'content-strong': '#14171a', 'content': '#2c3238', 'content-muted': '#5b6470',
            'content-subtle': '#7d8794', 'content-inverted': '#faf8f4',
            'border-subtle': '#e4e0d8', 'border': '#d3cec4', 'border-strong': '#b0a99c',
            'accent': '#7a4a12', 'accent-hover': '#5e380b', 'accent-surface': '#fbeed7',
            'accent-surface-strong': '#f3ddb0', 'accent-border': '#d9a55c',
            'accent-contrast': '#ffffff',
            'action': '#25405e', 'action-hover': '#1a2f47', 'action-surface': '#e6ecf3',
            'action-contrast': '#ffffff',
            'info': '#1f5a73', 'info-surface': '#e2eff4',
            'warning': '#8a5a00', 'warning-surface': '#fbf0d8', 'warning-mark': '#e0a533',
            'danger': '#9b2226', 'danger-surface': '#fae6e6',
            'focus-ring': '#25405e', 'scrim': 'rgb(20 23 26 / 0.45)',
            'font-ui': INTER, 'font-display': INTER, 'font-reading': SERIF, 'font-mono': JET,
            'radius-xs': '3px', 'radius-sm': '5px', 'radius-md': '8px', 'radius-lg': '12px',
        },
        'dark': {
            'surface-sunken': '#15171a', 'surface': '#1c1f23', 'surface-raised': '#24282d',
            'surface-overlay': '#2b3036', 'surface-inset': '#141619',
            'content-strong': '#f4f2ee', 'content': '#d6d3cd', 'content-muted': '#9aa1a9',
            'content-subtle': '#6f767e', 'content-inverted': '#14171a',
            'border-subtle': '#2f343a', 'border': '#3b4148', 'border-strong': '#545c65',
            'accent': '#e0a95f', 'accent-hover': '#f0bd78', 'accent-surface': '#453318',
            'accent-surface-strong': '#5c451f', 'accent-border': '#8a6526',
            'accent-contrast': '#14171a',
            'action': '#b9cde6', 'action-hover': '#cfdff2', 'action-surface': '#2a3a4c',
            'action-contrast': '#14171a',
            'info': '#7fc0da', 'info-surface': '#16303b',
            'warning': '#e8bc63', 'warning-surface': '#3a2e14', 'warning-mark': '#e8bc63',
            'danger': '#f08d8f', 'danger-surface': '#3a1d1e',
            'focus-ring': '#9fc2ea', 'scrim': 'rgb(0 0 0 / 0.6)',
            'font-ui': INTER, 'font-display': INTER, 'font-reading': SERIF, 'font-mono': JET,
            'radius-xs': '3px', 'radius-sm': '5px', 'radius-md': '8px', 'radius-lg': '12px',
        },
    },
    'uni-freiburg': {
        'label': 'Universitaet Freiburg - cd.uni-freiburg.de',
        'light': {
            'surface-sunken': '#f6f1e3', 'surface': '#faf8f1', 'surface-raised': '#ffffff',
            'surface-overlay': '#ffffff', 'surface-inset': '#f6f1e3',
            'content-strong': '#000000', 'content': '#000000', 'content-muted': '#5c5c5c',
            'content-subtle': '#6e6e6e', 'content-inverted': '#ffffff',
            'border-subtle': '#d7d8ec', 'border': '#afb1d8', 'border-strong': '#868dc2',
            'accent': '#00a082', 'accent-hover': '#27b29b', 'accent-surface': '#daede7',
            'accent-surface-strong': '#afdace', 'accent-border': '#00a082',
            'accent-contrast': '#000000',
            'action': '#344a9a', 'action-hover': '#00004a', 'action-surface': '#d7d8ec',
            'action-contrast': '#ffffff',
            'info': '#344a9a', 'info-surface': '#d7d8ec',
            'warning': '#8f6b30', 'warning-surface': '#fffae0', 'warning-mark': '#ffe863',
            'danger': '#a4232b', 'danger-surface': '#f7e6e7',
            'focus-ring': '#344a9a', 'scrim': 'rgb(0 0 74 / 0.5)',
            'font-ui': SOCIAL, 'font-display': SOCIAL_X, 'font-reading': SOCIAL,
            'font-mono': SYSMONO,
            'radius-xs': '2px', 'radius-sm': '3px', 'radius-md': '4px', 'radius-lg': '6px',
        },
        'dark': {
            'surface-sunken': '#000033', 'surface': '#00004a', 'surface-raised': '#131a5c',
            'surface-overlay': '#1a2270', 'surface-inset': '#000033',
            'content-strong': '#ffffff', 'content': '#e9eaf6', 'content-muted': '#b6b9dd',
            'content-subtle': '#8b8fc4', 'content-inverted': '#000000',
            'border-subtle': '#1c2470', 'border': '#2e3792', 'border-strong': '#5d6bad',
            'accent': '#27b29b', 'accent-hover': '#7bc6b4', 'accent-surface': '#0a3a33',
            'accent-surface-strong': '#0f5449', 'accent-border': '#27b29b',
            'accent-contrast': '#000000',
            'action': '#afb1d8', 'action-hover': '#d7d8ec', 'action-surface': '#2e3792',
            'action-contrast': '#00004a',
            'info': '#afb1d8', 'info-surface': '#1c2470',
            'warning': '#ffe863', 'warning-surface': '#3a3410', 'warning-mark': '#ffe863',
            'danger': '#f08d8f', 'danger-surface': '#3a1d1e',
            'focus-ring': '#d7d8ec', 'scrim': 'rgb(0 0 0 / 0.65)',
            'font-ui': SOCIAL, 'font-display': SOCIAL_X, 'font-reading': SOCIAL,
            'font-mono': SYSMONO,
            'radius-xs': '2px', 'radius-sm': '3px', 'radius-md': '4px', 'radius-lg': '6px',
        },
    },
    'huskynarr': {
        'label': 'huskynarr - Naeherung, siehe docs/design-system.md Abschnitt 11',
        'light': {
            'surface-sunken': '#f5f5f4', 'surface': '#fafaf9', 'surface-raised': '#ffffff',
            'surface-overlay': '#ffffff', 'surface-inset': '#f5f5f4',
            'content-strong': '#0c0a09', 'content': '#1c1917', 'content-muted': '#57534e',
            'content-subtle': '#78716c', 'content-inverted': '#fafaf9',
            'border-subtle': '#e7e5e4', 'border': '#d6d3d1', 'border-strong': '#a8a29e',
            'accent': '#0f766e', 'accent-hover': '#115e59', 'accent-surface': '#ccfbf1',
            'accent-surface-strong': '#99f6e4', 'accent-border': '#0f766e',
            'accent-contrast': '#ffffff',
            'action': '#292524', 'action-hover': '#0c0a09', 'action-surface': '#e7e5e4',
            'action-contrast': '#fafaf9',
            'info': '#0369a1', 'info-surface': '#e0f2fe',
            'warning': '#92400e', 'warning-surface': '#fef3c7', 'warning-mark': '#f59e0b',
            'danger': '#b91c1c', 'danger-surface': '#fee2e2',
            'focus-ring': '#292524', 'scrim': 'rgb(12 10 9 / 0.5)',
            'font-ui': INTER, 'font-display': INTER, 'font-reading': INTER, 'font-mono': JET,
            'radius-xs': '4px', 'radius-sm': '6px', 'radius-md': '10px', 'radius-lg': '14px',
        },
        'dark': {
            'surface-sunken': '#0c0a09', 'surface': '#1c1917', 'surface-raised': '#292524',
            'surface-overlay': '#292524', 'surface-inset': '#0c0a09',
            'content-strong': '#fafaf9', 'content': '#e7e5e4', 'content-muted': '#a8a29e',
            'content-subtle': '#78716c', 'content-inverted': '#0c0a09',
            'border-subtle': '#292524', 'border': '#44403c', 'border-strong': '#57534e',
            'accent': '#2dd4bf', 'accent-hover': '#5eead4', 'accent-surface': '#0d3c38',
            'accent-surface-strong': '#115e59', 'accent-border': '#2dd4bf',
            'accent-contrast': '#0c0a09',
            'action': '#f5f5f4', 'action-hover': '#ffffff', 'action-surface': '#292524',
            'action-contrast': '#0c0a09',
            'info': '#7dd3fc', 'info-surface': '#0c2b3b',
            'warning': '#fbbf24', 'warning-surface': '#3a2a06', 'warning-mark': '#fbbf24',
            'danger': '#f87171', 'danger-surface': '#3f1212',
            'focus-ring': '#f5f5f4', 'scrim': 'rgb(0 0 0 / 0.7)',
            'font-ui': INTER, 'font-display': INTER, 'font-reading': INTER, 'font-mono': JET,
            'radius-xs': '4px', 'radius-sm': '6px', 'radius-md': '10px', 'radius-lg': '14px',
        },
    },
}

# Independently implemented palette inspired by the inspected public Everlast
# reference (black, lemon yellow, Inter), not an official brand asset.
DESIGNS['everlast'] = {
    'label': 'Everlast Research - eigenstaendige Interpretation',
    'light': {
        **DESIGNS['eigen']['light'],
        'surface-sunken': '#efefe8', 'surface': '#f9faf4', 'surface-inset': '#eeefe4',
        'content-strong': '#11130b', 'content': '#292d22', 'content-muted': '#5c6253',
        'content-subtle': '#69715e', 'border-subtle': '#e0e4d5', 'border': '#c7ceba',
        'action': '#343d09', 'action-hover': '#212705', 'action-surface': '#f0f5cc',
        'action-contrast': '#ffffff', 'focus-ring': '#56650e',
        'accent': '#65740b', 'accent-hover': '#424f06', 'accent-surface': '#f0f5cc',
        'accent-surface-strong': '#e5ecab', 'accent-border': '#9eae3d',
        'font-reading': INTER, 'radius-xs': '5px', 'radius-sm': '8px',
        'radius-md': '14px', 'radius-lg': '24px',
    },
    'dark': {
        **DESIGNS['eigen']['dark'],
        'surface-sunken': '#060608', 'surface': '#0d0f0e', 'surface-raised': '#141714',
        'surface-overlay': '#191d18', 'surface-inset': '#080a08',
        'content-strong': '#f7f9ef', 'content': '#e4ece8', 'content-muted': '#a1aa9c',
        'content-subtle': '#87927e', 'content-inverted': '#11130b',
        'border-subtle': '#242b21', 'border': '#37402f', 'border-strong': '#576649',
        'action': '#e0f36b', 'action-hover': '#edff8f', 'action-surface': '#252d0d',
        'action-contrast': '#171e00', 'focus-ring': '#e0f36b',
        'accent': '#b8d587', 'accent-hover': '#d2ecaa', 'accent-surface': '#222e17',
        'accent-surface-strong': '#354625', 'accent-border': '#668846',
        'accent-contrast': '#101907', 'font-reading': INTER,
        'radius-xs': '5px', 'radius-sm': '8px', 'radius-md': '14px', 'radius-lg': '24px',
    },
}
DESIGNS['huskynarr']['light'].update({
    'action': '#3f6212', 'action-hover': '#365314', 'action-surface': '#ecfccb',
    'action-contrast': '#ffffff', 'focus-ring': '#4d7c0f',
})
DESIGNS['huskynarr']['dark'].update({
    'action': '#84cc16', 'action-hover': '#bef264', 'action-surface': '#1a2e05',
    'action-contrast': '#0c0a09', 'focus-ring': '#bef264',
})

DEFAULT = 'everlast'

KOPF = """/* ERZEUGTE DATEI - nicht von Hand aendern.
   Quelle: tools/build-theme.py - neu erzeugen mit `pnpm theme`.
   Siehe docs/design-system.md. */

@import 'tailwindcss';

@import '@fontsource-variable/inter';
@import '@fontsource/source-serif-4/400.css';
@import '@fontsource/source-serif-4/600.css';
@import '@fontsource-variable/jetbrains-mono';

/* Die Hausschrift "Social" des Designs uni-freiburg ist lizenzpflichtig und
   liegt nicht im Repo. Ihre @font-face-Regeln stehen in public/fonts/social.css
   und werden in index.html eingebunden - dort verarbeitet Vite sie nicht, sodass
   fehlende Schriftdateien weder den Build brechen noch ihn mit Warnungen fluten.
   Ohne die Dateien faellt das Design auf Arial zurueck, die vom Corporate Design
   der Universitaet vorgesehene Zweitschrift. Siehe public/fonts/README.md. */
"""

SKALEN = """
  --text-display: 1.875rem;
  --text-display--line-height: 2.25rem;
  --text-display--letter-spacing: -0.01em;
  --text-display--font-weight: 600;
  --text-title: 1.375rem;
  --text-title--line-height: 1.875rem;
  --text-title--font-weight: 600;
  --text-heading: 1.0625rem;
  --text-heading--line-height: 1.5rem;
  --text-heading--font-weight: 600;
  --text-body: 0.9375rem;
  --text-body--line-height: 1.5rem;
  --text-reading: 1rem;
  --text-reading--line-height: 1.75rem;
  --text-label: 0.8125rem;
  --text-label--line-height: 1.125rem;
  --text-label--letter-spacing: 0.01em;
  --text-label--font-weight: 600;
  --text-meta: 0.75rem;
  --text-meta--line-height: 1rem;
  --text-micro: 0.6875rem;
  --text-micro--line-height: 0.875rem;
  --text-micro--letter-spacing: 0.04em;
  --text-micro--font-weight: 600;

  --spacing: 0.25rem;

  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.07);
  --shadow-md: 0 4px 12px rgb(0 0 0 / 0.12);
  --shadow-lg: 0 16px 40px rgb(0 0 0 / 0.2);

  --container-reading: 68ch;
  --container-page: 76rem;

  --text-hero: clamp(2.3rem, 4vw, 4.1rem);
  --text-hero--line-height: 1.05;
  --text-hero--letter-spacing: -0.055em;
  --text-hero--font-weight: 600;
  --text-section: clamp(1.75rem, 3vw, 2.75rem);
  --text-section--line-height: 1.14;
  --text-section--letter-spacing: -0.04em;

  --ease-fast: cubic-bezier(0.2, 0, 0.2, 1);
  --ease-base: cubic-bezier(0.2, 0, 0, 1);
  --ease-slow: cubic-bezier(0.4, 0, 0.2, 1);
}
"""

FUSS = """
@layer base {
  html {
    color-scheme: light dark;
  }
  body {
    background-color: var(--t-surface-sunken);
    color: var(--t-content);
    font-family: var(--font-ui);
    -webkit-font-smoothing: antialiased;
  }
  /* Layoutregel des Freiburger CD, fuer alle Designs uebernommen:
     ausschliesslich linksbuendiger Flattersatz. */
  body,
  p,
  h1,
  h2,
  h3,
  h4,
  li,
  td,
  th,
  label {
    text-align: left;
  }
  /* Deutsche Komposita erzeugen im Flattersatz sonst Loecher. */
  .prose-reading {
    hyphens: auto;
  }
  :focus-visible {
    outline: 2px solid var(--t-focus-ring);
    outline-offset: 2px;
  }
  ::selection {
    background-color: var(--t-accent-surface-strong);
  }
}

/* Aufblitzen der Belegstelle nach dem Sprung (motion-slow, 420 ms). */
@keyframes citation-flash {
  0% {
    background-color: var(--t-accent);
  }
  100% {
    background-color: var(--t-accent-surface);
  }
}
.citation-flash {
  animation: citation-flash 420ms var(--ease-slow);
}
.scrim {
  background-color: var(--t-scrim);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
"""


def pruefen() -> None:
    for name, design in DESIGNS.items():
        for mode in ('light', 'dark'):
            fehlend = [t for t in TOKENS if t not in design[mode]]
            zuviel = [t for t in design[mode] if t not in TOKENS]
            if fehlend:
                raise SystemExit(f'{name}/{mode}: Token fehlt: {", ".join(fehlend)}')
            if zuviel:
                raise SystemExit(f'{name}/{mode}: unbekannter Token: {", ".join(zuviel)}')


def block(values: 'dict[str, str]', indent: str = '  ') -> str:
    return '\n'.join(f'{indent}--t-{t}: {values[t]};' for t in TOKENS)


def main() -> None:
    pruefen()
    out = [KOPF, '@theme {']
    for t in TOKENS:
        if t == 'scrim':
            continue
        praefix = '' if t.startswith(('font-', 'radius-')) else 'color-'
        out.append(f'  --{praefix}{t}: var(--t-{t});')
    out.append(SKALEN)

    for name, design in DESIGNS.items():
        ist_vorgabe = name == DEFAULT
        eigen = f":root[data-design='{name}']"
        hell = f':root, {eigen}' if ist_vorgabe else eigen
        ohne = f":root:not([data-design]), {eigen}" if ist_vorgabe else eigen
        dunkel_erzwungen = (
            f":root:not([data-design])[data-theme='dark'], {eigen}[data-theme='dark']"
            if ist_vorgabe
            else f"{eigen}[data-theme='dark']"
        )

        out.append(f'/* --- {name}: {design["label"]} --- */')
        out.append(f'{hell} {{')
        out.append(block(design['light']))
        out.append('}\n')

        auswahl = ', '.join(f"{s.strip()}:not([data-theme='light'])" for s in ohne.split(','))
        out.append('@media (prefers-color-scheme: dark) {')
        out.append(f'  {auswahl} {{')
        out.append(block(design['dark'], '    '))
        out.append('  }')
        out.append('}\n')

        out.append(f'{dunkel_erzwungen} {{')
        out.append(block(design['dark']))
        out.append('}\n')

    out.append(FUSS)
    ziel = Path('apps/web/src/styles/theme.css')
    ziel.write_text('\n'.join(out))
    print(f'{ziel}: {len(DESIGNS)} Designs, je {len(TOKENS)} Tokens hell und dunkel')


if __name__ == '__main__':
    main()
