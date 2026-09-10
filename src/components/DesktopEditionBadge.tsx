import { LaptopMinimal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getDesktopRuntimeInfo, type DesktopRuntimeInfo } from '../lib/desktopRuntime';

export function DesktopEditionBadge() {
  const { i18n } = useTranslation();
  const lv = i18n.language.startsWith('lv');
  const [runtime, setRuntime] = useState<DesktopRuntimeInfo | null>(null);

  useEffect(() => {
    let active = true;
    void getDesktopRuntimeInfo().then((info) => {
      if (active) setRuntime(info);
    });
    return () => { active = false; };
  }, []);

  if (!runtime?.desktop) return null;
  const portable = runtime.distribution === 'portable';
  const label = portable ? (lv ? 'Portable' : 'Portable') : (lv ? 'Instalētā' : 'Installed');
  const detail = portable
    ? (lv ? 'Darbojas bez instalēšanas' : 'Runs without installation')
    : (lv ? 'Windows instalētā versija' : 'Windows installed edition');

  return (
    <span className={`desktop-edition-badge ${runtime.distribution}`} title={`${detail} · v${runtime.version}`}>
      <LaptopMinimal size={13} />
      <span>{label}</span>
      <small>v{runtime.version}</small>
    </span>
  );
}
