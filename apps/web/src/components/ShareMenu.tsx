import type { ReactElement } from 'react';
import { useT } from '../i18n/index.ts';
import { Menu, type MenuGroup } from './ui/Menu.tsx';
import type { ButtonProps } from './ui/Button.tsx';

export interface ShareActions {
  readonly markdown: () => void;
  readonly pdf: () => void;
  readonly docx: () => void;
  readonly image?: () => void;
  readonly copyLink?: () => void;
}

/** Ein Menü, zwei Einsatzorte: Kopfleiste (ganzes Notebook) und Antwort. */
export function ShareMenu({
  actions,
  size = 'sm',
  variant = 'secondary',
  scope,
}: {
  actions: ShareActions;
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
  scope: 'notebook' | 'answer';
}): ReactElement {
  const t = useT();
  const gruppen: MenuGroup[] = [
    {
      title: scope === 'notebook' ? t('share.notebook') : t('share.answer'),
      items: [
        { id: 'md', label: t('share.markdown'), onSelect: actions.markdown },
        { id: 'pdf', label: t('share.pdf'), hint: t('share.pdfHint'), onSelect: actions.pdf },
        { id: 'docx', label: t('share.docx'), onSelect: actions.docx },
        ...(actions.image ? [{ id: 'png', label: t('share.image'), onSelect: actions.image }] : []),
      ],
    },
    ...(actions.copyLink
      ? [{ items: [{ id: 'link', label: t('share.copyLink'), onSelect: actions.copyLink }] }]
      : []),
  ];
  return (
    <Menu label={t('share.title')} groups={gruppen} buttonProps={{ size, variant }}>
      {t('header.share')}
    </Menu>
  );
}
