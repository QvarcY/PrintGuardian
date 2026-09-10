import { Coffee, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isTauriRuntime, openExternalUrl } from '../lib/desktopRuntime';

const SUPPORT_URL = 'https://buymeacoffee.com/craftin';

type SupportProjectProps = {
  compact?: boolean;
  prominent?: boolean;
};

export function SupportProject({ compact = false, prominent = false }: SupportProjectProps) {
  const { t } = useTranslation();

  return (
    <a
      className={`support-project${compact ? ' compact' : ''}${prominent ? ' prominent' : ''}`}
      href={SUPPORT_URL}
      target="_blank"
      onClick={(event) => {
        if (!isTauriRuntime()) return;
        event.preventDefault();
        void openExternalUrl(SUPPORT_URL);
      }}
      rel="noreferrer noopener"
      aria-label={`${t('app.support')} — Buy Me a Coffee`}
      title={t('app.supportHint')}
    >
      <span className="support-project-icon"><Coffee size={compact ? 14 : prominent ? 16 : 18} /></span>
      <span className="support-project-copy">
        <strong>{prominent ? `Buy Me a Coffee · ${t('app.support')}` : t('app.support')}</strong>
        {!compact && !prominent && <small>buymeacoffee.com/craftin</small>}
      </span>
      {!compact && !prominent && <ExternalLink size={13} className="support-project-open" />}
    </a>
  );
}
