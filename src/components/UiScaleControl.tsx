import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type UiScale = 'compact' | 'standard' | 'large';

const STORAGE_KEY = 'printguardian.uiScale.v1';

function readScale(): UiScale {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value === 'compact' || value === 'large') return value;
  } catch {
    // Local storage may be unavailable in hardened/private contexts.
  }
  return 'standard';
}

function applyScale(scale: UiScale) {
  document.documentElement.dataset.uiScale = scale;
}

export function UiScaleControl() {
  const { i18n } = useTranslation();
  const lv = i18n.language.startsWith('lv');
  const [scale, setScale] = useState<UiScale>(() => readScale());

  useEffect(() => {
    applyScale(scale);
    try {
      window.localStorage.setItem(STORAGE_KEY, scale);
    } catch {
      // The UI still works for the current session if persistence is blocked.
    }
  }, [scale]);

  const labels: Record<UiScale, string> = lv
    ? { compact: 'Kompakts interfeiss', standard: 'Standarta interfeiss', large: 'Liels interfeiss' }
    : { compact: 'Compact interface', standard: 'Standard interface', large: 'Large interface' };

  return (
    <div className="ui-scale-control" role="group" aria-label={lv ? 'Interfeisa izmērs' : 'Interface size'}>
      <button className={scale === 'compact' ? 'active' : ''} type="button" onClick={() => setScale('compact')} title={labels.compact} aria-label={labels.compact}>A−</button>
      <button className={scale === 'standard' ? 'active' : ''} type="button" onClick={() => setScale('standard')} title={labels.standard} aria-label={labels.standard}>A</button>
      <button className={scale === 'large' ? 'active' : ''} type="button" onClick={() => setScale('large')} title={labels.large} aria-label={labels.large}>A+</button>
    </div>
  );
}
