import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type SettingTooltipKey = 'maxVolumetricSpeed' | 'wallLoops' | 'sparseInfillDensity' | 'layerHeight' | 'support' | 'brimWidth';

type Props = {
  name: string;
  translationKey?: SettingTooltipKey;
  value: string;
  tone?: 'normal' | 'warning';
};

export function SettingTerm({ name, translationKey, value, tone = 'normal' }: Props) {
  const { t } = useTranslation();
  return (
    <div className={`setting-row ${tone === 'warning' ? 'warning' : ''}`}>
      <div className="setting-name">
        <span>{name}</span>
        {translationKey && (
          <span className="tooltip-anchor" tabIndex={0} aria-label={`${name} info`}>
            <Info size={14} />
            <span className="tooltip-card" role="tooltip">
              <strong>{name}</strong>
              <p>{t(`settings.${translationKey}.description`)}</p>
              <div className="tooltip-grid">
                <div><b>↑</b><span>{t(`settings.${translationKey}.higher`)}</span></div>
                <div><b>↓</b><span>{t(`settings.${translationKey}.lower`)}</span></div>
              </div>
            </span>
          </span>
        )}
      </div>
      <strong className="setting-value">{value}</strong>
    </div>
  );
}
