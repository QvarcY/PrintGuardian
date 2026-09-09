import { Coffee, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SUPPORT_URL = 'https://buymeacoffee.com/craftin';

type SupportProjectProps = {
  compact?: boolean;
};

export function SupportProject({ compact = false }: SupportProjectProps) {
  const { t } = useTranslation();

  return (
    <a
      className={`support-project${compact ? ' compact' : ''}`}
      href={SUPPORT_URL}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={`${t('app.support')} — Buy Me a Coffee`}
      title={t('app.supportHint')}
    >
      <span className="support-project-icon"><Coffee size={compact ? 14 : 17} /></span>
      <span className="support-project-copy">
        <strong>{t('app.support')}</strong>
        {!compact && <small>buymeacoffee.com/craftin</small>}
      </span>
      {!compact && <ExternalLink size={13} className="support-project-open" />}
    </a>
  );
}
